from __future__ import annotations

import base64
import json
import os
import subprocess
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

DEFAULT_CONSENT_SCRIPT = (
    "I am the owner of this voice and I consent to Google using this voice to create a synthetic voice model."
)


@dataclass(slots=True)
class VertexTTSConfig:
    project_id: str
    language_code: str = "en-US"
    audio_encoding: str = "LINEAR16"
    voice_name: str | None = "en-US-Chirp3-HD-Charon"
    voice_cloning_key: str | None = None
    reference_audio_path: str | None = None
    consent_audio_path: str | None = None
    consent_script: str = DEFAULT_CONSENT_SCRIPT
    access_token: str | None = None
    api_base_url: str = "https://texttospeech.googleapis.com"


class VertexTTSBackend:
    def __init__(self, config: VertexTTSConfig) -> None:
        self.config = config
        self.backend_name = "vertex-instant-custom" if self.uses_voice_clone else "vertex-chirp"

    @property
    def uses_voice_clone(self) -> bool:
        return bool(
            self.config.voice_cloning_key
            or (self.config.reference_audio_path and self.config.consent_audio_path)
        )

    def describe(self) -> dict[str, Any]:
        return {
            "backend": self.backend_name,
            "project_id": self.config.project_id,
            "language_code": self.config.language_code,
            "voice_name": self.config.voice_name,
            "uses_voice_clone": self.uses_voice_clone,
            "reference_audio_path": self.config.reference_audio_path,
            "consent_audio_path": self.config.consent_audio_path,
        }

    def synthesize_bytes(self, text: str, speaking_rate: float, pause_scale: float) -> bytes:
        access_token = resolve_access_token(self.config.access_token)
        voice_cloning_key = self._resolve_voice_cloning_key(access_token)
        body = build_synthesize_request(
            text=text,
            language_code=self.config.language_code,
            audio_encoding=self.config.audio_encoding,
            speaking_rate=speaking_rate,
            pause_scale=pause_scale,
            voice_name=self.config.voice_name,
            voice_cloning_key=voice_cloning_key,
        )
        endpoint = (
            f"{self.config.api_base_url}/v1beta1/text:synthesize"
            if voice_cloning_key
            else f"{self.config.api_base_url}/v1/text:synthesize"
        )
        payload = post_json(endpoint, body, access_token, self.config.project_id)
        audio_content = payload.get("audioContent")
        if not audio_content:
            raise RuntimeError("Vertex response did not include audioContent.")
        return base64.b64decode(audio_content)

    def _resolve_voice_cloning_key(self, access_token: str) -> str | None:
        if self.config.voice_cloning_key:
            return self.config.voice_cloning_key
        if not (self.config.reference_audio_path and self.config.consent_audio_path):
            return None
        body = build_voice_cloning_key_request(
            reference_audio_path=self.config.reference_audio_path,
            consent_audio_path=self.config.consent_audio_path,
            language_code=self.config.language_code,
            consent_script=self.config.consent_script,
        )
        endpoint = f"{self.config.api_base_url}/v1beta1/voices:generateVoiceCloningKey"
        payload = post_json(endpoint, body, access_token, self.config.project_id)
        voice_cloning_key = payload.get("voiceCloningKey")
        if not voice_cloning_key:
            raise RuntimeError("Vertex response did not include voiceCloningKey.")
        self.config.voice_cloning_key = voice_cloning_key
        return voice_cloning_key


def build_synthesize_request(
    text: str,
    language_code: str,
    audio_encoding: str,
    speaking_rate: float,
    pause_scale: float,
    voice_name: str | None = None,
    voice_cloning_key: str | None = None,
) -> dict[str, Any]:
    request: dict[str, Any] = {
        "input": build_input_payload(text, pause_scale),
        "audioConfig": {
            "audioEncoding": audio_encoding,
            "speakingRate": round(clamp(speaking_rate, 0.25, 2.0), 3),
        },
    }
    if voice_cloning_key:
        request["voice"] = {
            "languageCode": language_code,
            "voiceClone": {"voiceCloningKey": voice_cloning_key},
        }
    else:
        if not voice_name:
            raise ValueError("voice_name is required for non-custom Vertex synthesis.")
        request["voice"] = {
            "languageCode": language_code,
            "name": voice_name,
        }
    return request


def build_voice_cloning_key_request(
    reference_audio_path: str,
    consent_audio_path: str,
    language_code: str,
    consent_script: str,
) -> dict[str, Any]:
    reference_path = Path(reference_audio_path)
    consent_path = Path(consent_audio_path)
    return {
        "reference_audio": {
            "audio_config": {"audio_encoding": infer_audio_encoding(reference_path)},
            "content": base64.b64encode(reference_path.read_bytes()).decode("ascii"),
        },
        "voice_talent_consent": {
            "audio_config": {"audio_encoding": infer_audio_encoding(consent_path)},
            "content": base64.b64encode(consent_path.read_bytes()).decode("ascii"),
        },
        "consent_script": consent_script,
        "language_code": language_code,
    }


def build_input_payload(text: str, pause_scale: float) -> dict[str, str]:
    markup = apply_pause_markup(text, pause_scale)
    if markup != text:
        return {"markup": markup}
    return {"text": text}


def apply_pause_markup(text: str, pause_scale: float) -> str:
    if pause_scale >= 1.08:
        tag = "[pause long]"
    elif pause_scale <= 0.92:
        tag = "[pause short]"
    elif abs(pause_scale - 1.0) >= 0.04:
        tag = "[pause]"
    else:
        return text

    updated = text.replace(", ", f", {tag} ").replace("; ", f"; {tag} ")
    updated = updated.replace(". ", f". {tag} ").replace("? ", f"? {tag} ").replace("! ", f"! {tag} ")
    return updated


def infer_audio_encoding(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".wav", ".wave"}:
        return "LINEAR16"
    if suffix == ".mp3":
        return "MP3"
    if suffix == ".m4a":
        return "M4A"
    return "PCM"


def resolve_access_token(preferred: str | None = None) -> str:
    if preferred:
        return preferred
    for key in ("ARO_VERTEX_ACCESS_TOKEN", "GOOGLE_ACCESS_TOKEN", "CLOUDSDK_AUTH_ACCESS_TOKEN"):
        value = os.environ.get(key)
        if value:
            return value

    for command in (
        ["gcloud", "auth", "application-default", "print-access-token"],
        ["gcloud", "auth", "print-access-token"],
    ):
        try:
            completed = subprocess.run(command, capture_output=True, text=True, check=False, timeout=20)
        except (FileNotFoundError, OSError, subprocess.SubprocessError):
            continue
        if completed.returncode == 0 and completed.stdout.strip():
            return completed.stdout.strip()
    raise RuntimeError(
        "No Google access token available. Set ARO_VERTEX_ACCESS_TOKEN or authenticate with gcloud ADC."
    )


def post_json(url: str, body: dict[str, Any], access_token: str, project_id: str) -> dict[str, Any]:
    encoded = json.dumps(body).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=encoded,
        headers={
            "Authorization": f"Bearer {access_token}",
            "x-goog-user-project": project_id,
            "Content-Type": "application/json; charset=utf-8",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Vertex request failed: {exc.code} {detail}") from exc


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))
