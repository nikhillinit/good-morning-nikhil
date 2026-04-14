from __future__ import annotations

import base64
import json
import os
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from aro_voice_style_lab.xtts_backend import XTTS_DEFAULT_MODEL_NAME, xtts_runtime_patches

_TTS_INSTANCE = None
_TTS_MODEL_NAME = None


def get_tts(model_name: str, device: str):
    global _TTS_INSTANCE, _TTS_MODEL_NAME
    if _TTS_INSTANCE is not None and _TTS_MODEL_NAME == model_name:
        return _TTS_INSTANCE
    try:
        from TTS.api import TTS
    except ImportError as exc:
        raise RuntimeError("XTTS worker requires the TTS package inside the worker runtime.") from exc

    with xtts_runtime_patches():
        tts = TTS(model_name)
        if hasattr(tts, "to"):
            tts = tts.to(device)
    _TTS_INSTANCE = tts
    _TTS_MODEL_NAME = model_name
    return _TTS_INSTANCE


class XTTSRequestHandler(BaseHTTPRequestHandler):
    server_version = "ARO-XTTS-Worker/0.1"

    def do_GET(self):
        if self.path == "/health":
            self._send_json(200, {"ok": True, "service": "xtts-worker"})
            return
        self._send_json(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/synthesize":
            self._send_json(404, {"error": "not found"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            audio_content = synthesize_payload(payload)
            self._send_json(200, {"audioContent": audio_content, "backend": "xtts-worker"})
        except Exception as exc:  # noqa: BLE001
            self._send_json(500, {"error": str(exc)})

    def log_message(self, format, *args):  # noqa: A003
        return

    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def synthesize_payload(payload: dict) -> str:
    text = payload["text"]
    language_code = payload.get("language_code", "en")
    model_name = payload.get("model_name", XTTS_DEFAULT_MODEL_NAME)
    device = payload.get("device", os.environ.get("ARO_XTTS_DEVICE", "cuda"))
    split_sentences = bool(payload.get("split_sentences", True))
    enable_text_splitting = bool(payload.get("enable_text_splitting", False))
    refs = payload.get("speaker_wav_refs", [])
    if not refs:
        raise ValueError("speaker_wav_refs is required")

    with tempfile.TemporaryDirectory() as tmpdir:
        ref_paths = []
        tmp = Path(tmpdir)
        for index, item in enumerate(refs, start=1):
            name = item.get("filename") or f"ref_{index:02d}.wav"
            path = tmp / name
            path.write_bytes(base64.b64decode(item["content_base64"]))
            ref_paths.append(str(path))
        output_path = tmp / "output.wav"
        tts = get_tts(model_name, device)
        with xtts_runtime_patches():
            tts.tts_to_file(
                text=text,
                file_path=str(output_path),
                speaker_wav=ref_paths,
                language=language_code,
                split_sentences=split_sentences,
                enable_text_splitting=enable_text_splitting,
                speed=float(payload.get("speed", 1.0)),
                temperature=float(payload.get("temperature", 0.75)),
                length_penalty=float(payload.get("length_penalty", 1.0)),
                repetition_penalty=float(payload.get("repetition_penalty", 10.0)),
                top_k=int(payload.get("top_k", 50)),
                top_p=float(payload.get("top_p", 0.85)),
            )
        return base64.b64encode(output_path.read_bytes()).decode("ascii")


def main() -> None:
    host = os.environ.get("ARO_XTTS_HOST", "0.0.0.0")
    port = int(os.environ.get("ARO_XTTS_PORT", "8000"))
    server = ThreadingHTTPServer((host, port), XTTSRequestHandler)
    print(f"xtts-worker listening on {host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
