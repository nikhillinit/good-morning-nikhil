from __future__ import annotations

import base64
import json
import urllib.error
import urllib.request
from contextlib import contextmanager
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

XTTS_DEFAULT_MODEL_NAME = "tts_models/multilingual/multi-dataset/xtts_v2"


@dataclass(slots=True)
class XTTSConfig:
    model_name: str = XTTS_DEFAULT_MODEL_NAME
    language_code: str = "en"
    device: str = "cuda"
    speaker_wav_paths: list[str] = field(default_factory=list)
    split_sentences: bool = True
    enable_text_splitting: bool = False
    temperature: float = 0.75
    length_penalty: float = 1.0
    repetition_penalty: float = 10.0
    top_k: int = 50
    top_p: float = 0.85
    speed: float = 1.0
    worker_url: str | None = None
    timeout_sec: int = 180


@contextmanager
def xtts_runtime_patches():
    import librosa
    import soundfile as sf
    import torch
    from TTS.tts.models import xtts as xtts_mod

    original_torch_load = torch.load
    original_load_audio = xtts_mod.load_audio

    def _compat_torch_load(*args, **kwargs):
        kwargs.setdefault("weights_only", False)
        return original_torch_load(*args, **kwargs)

    def _compat_load_audio(audiopath, sampling_rate):
        audio, lsr = sf.read(audiopath, always_2d=False)
        if getattr(audio, "ndim", 1) > 1:
            audio = audio.mean(axis=1)
        if lsr != sampling_rate:
            audio = librosa.resample(audio, orig_sr=lsr, target_sr=sampling_rate)
        audio = torch.tensor(audio, dtype=torch.float32).unsqueeze(0)
        audio = audio.clamp(-1, 1)
        return audio

    torch.load = _compat_torch_load
    xtts_mod.load_audio = _compat_load_audio
    try:
        yield
    finally:
        torch.load = original_torch_load
        xtts_mod.load_audio = original_load_audio


class XTTSLocalBackend:
    backend_name = "xtts-local"

    def __init__(self, config: XTTSConfig) -> None:
        self.config = config
        self._tts = None

    def synthesize(self, text: str, variant, profile) -> Path:
        output_path = Path(variant.output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.config.speaker_wav_paths:
            raise ValueError("XTTS local backend requires at least one reference WAV path.")

        tts = self._get_tts()
        xtts_text = build_xtts_text(text, variant.pause_scale)
        speed = clamp(self.config.speed * max(variant.speech_rate_scale, 0.5), 0.7, 1.35)

        with xtts_runtime_patches():
            tts.tts_to_file(
                text=xtts_text,
                file_path=str(output_path),
                speaker_wav=self.config.speaker_wav_paths,
                language=self.config.language_code,
                split_sentences=self.config.split_sentences,
                speed=speed,
                temperature=self.config.temperature,
                length_penalty=self.config.length_penalty,
                repetition_penalty=self.config.repetition_penalty,
                top_k=self.config.top_k,
                top_p=self.config.top_p,
                enable_text_splitting=self.config.enable_text_splitting,
            )
        return output_path

    def _get_tts(self):
        if self._tts is not None:
            return self._tts
        try:
            from TTS.api import TTS
        except ImportError as exc:
            raise RuntimeError(
                "XTTS local backend requires the optional TTS package. Install the xtts extra or run the worker backend."
            ) from exc

        with xtts_runtime_patches():
            tts = TTS(self.config.model_name)
            if hasattr(tts, "to"):
                tts = tts.to(self.config.device)
        self._tts = tts
        return self._tts


class XTTSWorkerBackend:
    backend_name = "xtts-worker"

    def __init__(self, config: XTTSConfig) -> None:
        if not config.worker_url:
            raise ValueError("XTTS worker backend requires worker_url.")
        self.config = config

    def synthesize(self, text: str, variant, profile) -> Path:
        output_path = Path(variant.output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        payload = build_xtts_worker_request(text, variant, self.config)
        response = post_json(f"{self.config.worker_url.rstrip('/')}/synthesize", payload, self.config.timeout_sec)
        audio_content = response.get("audioContent")
        if not audio_content:
            raise RuntimeError("XTTS worker response did not include audioContent.")
        output_path.write_bytes(base64.b64decode(audio_content))
        return output_path


def build_xtts_worker_request(text: str, variant, config: XTTSConfig) -> dict[str, Any]:
    refs = []
    for path in config.speaker_wav_paths:
        p = Path(path)
        refs.append(
            {
                "filename": p.name,
                "content_base64": base64.b64encode(p.read_bytes()).decode("ascii"),
            }
        )
    variant_pause = getattr(variant, "pause_scale", variant if isinstance(variant, (int, float)) else 1.0)
    variant_speed = getattr(variant, "speech_rate_scale", 1.0)
    return {
        "text": build_xtts_text(text, variant_pause),
        "language_code": config.language_code,
        "model_name": config.model_name,
        "device": config.device,
        "split_sentences": config.split_sentences,
        "enable_text_splitting": config.enable_text_splitting,
        "temperature": config.temperature,
        "length_penalty": config.length_penalty,
        "repetition_penalty": config.repetition_penalty,
        "top_k": config.top_k,
        "top_p": config.top_p,
        "speed": clamp(config.speed * max(variant_speed, 0.5), 0.7, 1.35),
        "speaker_wav_refs": refs,
    }


def build_xtts_text(text: str, pause_scale: float) -> str:
    if pause_scale >= 1.08:
        return text.replace(", ", ", ... ").replace(". ", ". ... ").replace("? ", "? ... ").replace("! ", "! ... ")
    if pause_scale <= 0.92:
        return text.replace(", ", ", ").replace(". ", ". ").replace("? ", "? ").replace("! ", "! ")
    return text


def post_json(url: str, body: dict[str, Any], timeout_sec: int) -> dict[str, Any]:
    encoded = json.dumps(body).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=encoded,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_sec) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"XTTS worker request failed: {exc.code} {detail}") from exc


def resolve_reference_paths(configured: list[str] | None) -> list[str]:
    return [str(Path(path)) for path in (configured or []) if path]


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))

