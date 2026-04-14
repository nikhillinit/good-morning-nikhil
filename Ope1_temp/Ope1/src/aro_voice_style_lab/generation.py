from __future__ import annotations

import json
import math
import os
import wave
from pathlib import Path
from typing import Any, Protocol

import numpy as np

from .analysis import load_manifest
from .models import GenerationVariant, StyleProfile, ensure_path
from .vertex_tts import VertexTTSBackend, VertexTTSConfig
from .xtts_backend import XTTSConfig, XTTSLocalBackend, XTTSWorkerBackend, XTTS_DEFAULT_MODEL_NAME, resolve_reference_paths


class GenerationBackend(Protocol):
    backend_name: str

    def synthesize(self, text: str, variant: GenerationVariant, profile: StyleProfile) -> Path:
        """Generate one candidate clip and return its path."""


class PlaceholderToneBackend:
    backend_name = "placeholder"

    def __init__(self, sample_rate: int = 22050) -> None:
        self.sample_rate = sample_rate

    def synthesize(self, text: str, variant: GenerationVariant, profile: StyleProfile) -> Path:
        output_path = Path(variant.output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        base_f0 = profile.global_features.f0_mean_hz or 220.0
        words = text.split() or ["placeholder"]
        word_duration = max(0.09, 0.23 / max(variant.speech_rate_scale, 0.1))
        gap_duration = max(0.03, (profile.global_features.mean_pause_ms / 1000.0 or 0.08) * variant.pause_scale)
        emphasis = max(0.2, variant.emphasis_scale)

        signal_chunks: list[np.ndarray] = []
        for index, _word in enumerate(words):
            duration = word_duration * (1.0 + ((index % 3) - 1) * 0.08)
            frequency = base_f0 * variant.pitch_scale * (1.0 + 0.03 * (index % 5))
            amplitude = min(0.95, 0.3 + 0.15 * emphasis)
            signal_chunks.append(sine_wave(frequency, duration, amplitude, self.sample_rate))
            signal_chunks.append(np.zeros(int(self.sample_rate * gap_duration), dtype=np.float32))

        waveform = np.concatenate(signal_chunks) if signal_chunks else np.zeros(int(self.sample_rate * 0.25), dtype=np.float32)
        write_wav(output_path, waveform, self.sample_rate)
        return output_path


class VertexGenerationBackend:
    def __init__(self, backend: VertexTTSBackend) -> None:
        self.backend = backend
        self.backend_name = backend.backend_name

    def synthesize(self, text: str, variant: GenerationVariant, profile: StyleProfile) -> Path:
        output_path = Path(variant.output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        speaking_rate = max(0.25, min(2.0, variant.speech_rate_scale))
        audio_bytes = self.backend.synthesize_bytes(text, speaking_rate=speaking_rate, pause_scale=variant.pause_scale)
        output_path.write_bytes(audio_bytes)
        return output_path


def generate_line(
    text: str,
    character_profile: str | Path | dict,
    substyle: str,
    n_variants: int = 5,
    output_dir: str | Path | None = None,
    backend: GenerationBackend | None = None,
    backend_name: str | None = None,
    backend_options: dict[str, Any] | None = None,
) -> list[Path]:
    profile = load_profile(character_profile)
    target_dir = ensure_path(output_dir) if output_dir else Path("outputs") / profile.character
    target_dir.mkdir(parents=True, exist_ok=True)

    backend = backend or create_backend(profile, backend_name=backend_name, backend_options=backend_options)
    variants = plan_variants(profile, substyle, n_variants, target_dir)
    output_paths: list[Path] = []
    for variant in variants:
        output_path = backend.synthesize(text, variant, profile)
        sidecar = output_path.with_suffix(".json")
        payload = variant.to_dict()
        payload["backend"] = getattr(backend, "backend_name", backend.__class__.__name__)
        payload["backend_options"] = summarize_backend_options(backend)
        sidecar.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        output_paths.append(output_path)
    return output_paths


def summarize_backend_options(backend: GenerationBackend) -> dict[str, Any]:
    if hasattr(backend, "backend") and hasattr(backend.backend, "describe"):
        return backend.backend.describe()
    if hasattr(backend, "config"):
        config = getattr(backend, "config")
        return {
            "backend": getattr(backend, "backend_name", backend.__class__.__name__),
            "model_name": getattr(config, "model_name", None),
            "language_code": getattr(config, "language_code", None),
            "device": getattr(config, "device", None),
            "split_sentences": getattr(config, "split_sentences", None),
            "enable_text_splitting": getattr(config, "enable_text_splitting", None),
            "temperature": getattr(config, "temperature", None),
            "length_penalty": getattr(config, "length_penalty", None),
            "repetition_penalty": getattr(config, "repetition_penalty", None),
            "top_k": getattr(config, "top_k", None),
            "top_p": getattr(config, "top_p", None),
            "speed": getattr(config, "speed", None),
            "worker_url": getattr(config, "worker_url", None),
        }
    return {"backend": getattr(backend, "backend_name", backend.__class__.__name__)}


def create_backend(
    profile: StyleProfile,
    backend_name: str | None = None,
    backend_options: dict[str, Any] | None = None,
) -> GenerationBackend:
    name = (backend_name or os.environ.get("ARO_VOICE_BACKEND") or "placeholder").strip().lower()
    options = backend_options or {}

    if name in {"", "placeholder"}:
        return PlaceholderToneBackend()
    if name in {"vertex", "vertex-chirp", "vertex-instant-custom"}:
        project_id = options.get("project_id") or os.environ.get("ARO_VERTEX_PROJECT_ID") or os.environ.get("GOOGLE_CLOUD_PROJECT")
        if not project_id:
            raise ValueError("Vertex backend requires project_id or ARO_VERTEX_PROJECT_ID.")

        voice_cloning_key = options.get("voice_cloning_key") or os.environ.get("ARO_VERTEX_VOICE_CLONING_KEY")
        reference_audio_path = (
            options.get("reference_audio_path")
            or os.environ.get("ARO_VERTEX_REFERENCE_AUDIO_PATH")
            or select_reference_audio(profile)
        )
        consent_audio_path = options.get("consent_audio_path") or os.environ.get("ARO_VERTEX_CONSENT_AUDIO_PATH")
        resolved_voice_name = options.get("voice_name") or os.environ.get("ARO_VERTEX_VOICE_NAME") or "en-US-Chirp3-HD-Charon"

        if name == "vertex-chirp":
            voice_cloning_key = None
            reference_audio_path = None
            consent_audio_path = None
        elif name == "vertex-instant-custom" and not voice_cloning_key and not (reference_audio_path and consent_audio_path):
            raise ValueError(
                "Vertex instant custom backend requires ARO_VERTEX_VOICE_CLONING_KEY or both reference_audio_path and consent_audio_path."
            )

        config = VertexTTSConfig(
            project_id=project_id,
            language_code=options.get("language_code") or os.environ.get("ARO_VERTEX_LANGUAGE_CODE") or "en-US",
            voice_name=resolved_voice_name,
            voice_cloning_key=voice_cloning_key,
            reference_audio_path=reference_audio_path,
            consent_audio_path=consent_audio_path,
            access_token=options.get("access_token") or os.environ.get("ARO_VERTEX_ACCESS_TOKEN"),
        )
        return VertexGenerationBackend(VertexTTSBackend(config))
    if name in {"xtts", "xtts-local", "xtts-worker"}:
        refs = resolve_reference_paths(
            options.get("xtts_reference_audio_paths")
            or split_env_paths("ARO_XTTS_REFERENCE_AUDIO_PATHS")
            or select_reference_audios(profile)
        )
        if not refs:
            raise ValueError("XTTS backend requires one or more reference WAV paths.")
        xtts_config = XTTSConfig(
            model_name=options.get("xtts_model_name") or os.environ.get("ARO_XTTS_MODEL_NAME") or XTTS_DEFAULT_MODEL_NAME,
            language_code=options.get("language_code") or os.environ.get("ARO_XTTS_LANGUAGE_CODE") or "en",
            device=options.get("xtts_device") or os.environ.get("ARO_XTTS_DEVICE") or "cuda",
            speaker_wav_paths=refs,
            worker_url=options.get("xtts_worker_url") or os.environ.get("ARO_XTTS_WORKER_URL"),
            split_sentences=coerce_bool(options.get("xtts_split_sentences"), os.environ.get("ARO_XTTS_SPLIT_SENTENCES"), True),
            enable_text_splitting=coerce_bool(options.get("xtts_enable_text_splitting"), os.environ.get("ARO_XTTS_ENABLE_TEXT_SPLITTING"), False),
            temperature=float(options.get("xtts_temperature") or os.environ.get("ARO_XTTS_TEMPERATURE") or 0.75),
            length_penalty=float(options.get("xtts_length_penalty") or os.environ.get("ARO_XTTS_LENGTH_PENALTY") or 1.0),
            repetition_penalty=float(options.get("xtts_repetition_penalty") or os.environ.get("ARO_XTTS_REPETITION_PENALTY") or 10.0),
            top_k=int(options.get("xtts_top_k") or os.environ.get("ARO_XTTS_TOP_K") or 50),
            top_p=float(options.get("xtts_top_p") or os.environ.get("ARO_XTTS_TOP_P") or 0.85),
            speed=float(options.get("xtts_speed") or os.environ.get("ARO_XTTS_SPEED") or 1.0),
        )
        if name == "xtts-worker" or xtts_config.worker_url:
            return XTTSWorkerBackend(xtts_config)
        return XTTSLocalBackend(xtts_config)

    raise ValueError(f"Unsupported backend_name: {backend_name}")


def coerce_bool(option_value: Any, env_value: Any, default: bool) -> bool:
    value = option_value if option_value is not None else env_value
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "y", "on"}


def split_env_paths(env_key: str) -> list[str] | None:
    raw = os.environ.get(env_key)
    if not raw:
        return None
    parts = [item.strip() for item in raw.split(os.pathsep) if item.strip()]
    return parts or None


def select_reference_audios(profile: StyleProfile, max_refs: int = 3) -> list[str]:
    if not profile.source_manifest:
        return []
    manifest_path = Path(profile.source_manifest)
    if not manifest_path.exists():
        return []

    candidates: list[tuple[tuple[int, float, int], str]] = []
    for row in load_manifest(manifest_path):
        path = Path(row.file_path)
        if not row.keep_flag or not path.exists() or path.suffix.lower() not in {".wav", ".wave"}:
            continue
        transcript = row.transcript or ""
        duration = row.duration_sec or 0.0
        score = 0
        if transcript:
            score += 4
        if 5.0 <= duration <= 12.0:
            score += 3
        if "[cutoff]" not in transcript.lower() and "[inaudible]" not in transcript.lower():
            score += 1
        stability = -abs(duration - 8.0)
        candidates.append(((score, stability, len(transcript)), str(path)))

    candidates.sort(key=lambda item: item[0], reverse=True)
    return [path for _, path in candidates[:max_refs]]


def select_reference_audio(profile: StyleProfile) -> str | None:
    refs = select_reference_audios(profile, max_refs=1)
    return refs[0] if refs else None


def plan_variants(profile: StyleProfile, substyle: str, n_variants: int, output_dir: Path) -> list[GenerationVariant]:
    base = profile.substyles.get(substyle, profile.global_features)
    speech_rate = base.speech_rate_syllables_per_sec or 3.0
    pause_ms = base.mean_pause_ms or 90.0
    f0 = base.f0_mean_hz or 220.0

    variants: list[GenerationVariant] = []
    for index in range(n_variants):
        delta = index - (n_variants - 1) / 2
        variant = GenerationVariant(
            index=index + 1,
            substyle=substyle,
            speech_rate_scale=round(1.0 + delta * 0.06, 3),
            pause_scale=round(1.0 - delta * 0.08, 3),
            pitch_scale=round(max(0.7, min(1.3, 1.0 + (delta * 0.04) + ((f0 - 220.0) / 2200.0))), 3),
            emphasis_scale=round(max(0.7, min(1.4, 1.0 + (pause_ms / 1000.0) + (speech_rate - 3.0) * 0.03)), 3),
            output_path=str(output_dir / f"{substyle}_variant_{index + 1:02d}.wav"),
        )
        variants.append(variant)
    return variants


def load_profile(character_profile: str | Path | dict) -> StyleProfile:
    if isinstance(character_profile, dict):
        raw = character_profile
    else:
        raw = json.loads(ensure_path(character_profile).read_text(encoding="utf-8"))

    from .models import UtteranceFeatures

    global_features = UtteranceFeatures(**raw["global"])
    substyles = {name: UtteranceFeatures(**value) for name, value in raw.get("substyles", {}).items()}
    return StyleProfile(
        character=raw["character"],
        global_features=global_features,
        substyles=substyles,
        source_manifest=raw.get("source_manifest"),
        clip_count=raw.get("clip_count", 0),
    )


def sine_wave(frequency: float, duration_sec: float, amplitude: float, sample_rate: int) -> np.ndarray:
    frame_count = max(int(duration_sec * sample_rate), 1)
    timeline = np.arange(frame_count, dtype=np.float32) / sample_rate
    fade_in = np.linspace(0.0, 1.0, frame_count, dtype=np.float32)
    fade_out = np.linspace(1.0, 0.0, frame_count, dtype=np.float32)
    envelope = np.minimum(fade_in, fade_out)
    waveform = np.sin(2 * math.pi * frequency * timeline) * amplitude * envelope
    return waveform.astype(np.float32)


def write_wav(path: Path, waveform: np.ndarray, sample_rate: int) -> None:
    int_samples = np.clip(waveform * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes(int_samples.tobytes())
