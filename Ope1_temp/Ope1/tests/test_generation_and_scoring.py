from __future__ import annotations

import base64
import json
from pathlib import Path

from aro_voice_style_lab.demo import run_demo
from aro_voice_style_lab.generation import create_backend, generate_line, load_profile, select_reference_audio, select_reference_audios
from aro_voice_style_lab.scoring import score_clip
from aro_voice_style_lab.vertex_tts import (
    VertexTTSBackend,
    VertexTTSConfig,
    apply_pause_markup,
    build_synthesize_request,
    build_voice_cloning_key_request,
)
from aro_voice_style_lab.xtts_backend import XTTSConfig, XTTSWorkerBackend, build_xtts_worker_request


def test_generate_line_and_score_clip(tmp_path: Path) -> None:
    profile_path = tmp_path / "profiles" / "character_a_profile.json"
    profile_path.parent.mkdir(parents=True)
    profile_path.write_text(
        json.dumps(
            {
                "character": "character_a",
                "global": {
                    "f0_mean_hz": 210.0,
                    "f0_median_hz": 208.0,
                    "f0_std_hz": 24.0,
                    "f0_range_hz": 30.0,
                    "intensity_mean_db": -12.0,
                    "intensity_std_db": 4.0,
                    "jitter_local": 0.04,
                    "shimmer_local_db": 1.8,
                    "hnr_db": 7.5,
                    "voiced_ratio": 0.74,
                    "speech_rate_syllables_per_sec": 3.3,
                    "pause_rate_per_min": 14.0,
                    "mean_pause_ms": 110.0,
                    "max_pause_ms": 240.0,
                    "long_pause_ratio": 0.22,
                    "silence_ratio": 0.24,
                    "spectral_centroid_hz": 1450.0,
                    "spectral_rolloff_hz": 3120.0,
                    "burstiness": 0.38,
                    "final_pitch_delta_hz": -18.0,
                    "mfcc_mean": [0.3] * 13,
                    "mfcc_std": [0.1] * 13
                },
                "substyles": {
                    "neutral": {
                        "f0_mean_hz": 205.0,
                        "f0_median_hz": 203.0,
                        "f0_std_hz": 22.0,
                        "f0_range_hz": 28.0,
                        "intensity_mean_db": -12.0,
                        "intensity_std_db": 4.0,
                        "jitter_local": 0.04,
                        "shimmer_local_db": 1.8,
                        "hnr_db": 7.5,
                        "voiced_ratio": 0.74,
                        "speech_rate_syllables_per_sec": 3.1,
                        "pause_rate_per_min": 13.0,
                        "mean_pause_ms": 120.0,
                        "max_pause_ms": 260.0,
                        "long_pause_ratio": 0.25,
                        "silence_ratio": 0.24,
                        "spectral_centroid_hz": 1450.0,
                        "spectral_rolloff_hz": 3120.0,
                        "burstiness": 0.38,
                        "final_pitch_delta_hz": -16.0,
                        "mfcc_mean": [0.25] * 13,
                        "mfcc_std": [0.12] * 13
                    }
                },
                "source_manifest": str(tmp_path / "data" / "manifests" / "character_a.csv"),
                "clip_count": 2
            }
        ),
        encoding="utf-8",
    )

    output_dir = tmp_path / "outputs" / "character_a"
    paths = generate_line(
        "This is only a placeholder rendering for pipeline verification.",
        profile_path,
        substyle="neutral",
        n_variants=3,
        output_dir=output_dir,
    )
    assert len(paths) == 3
    assert all(path.exists() for path in paths)

    report_path = score_clip(paths[0], profile_path, tmp_path / "reports" / "candidate_report.json")
    payload = json.loads(report_path.read_text(encoding="utf-8"))
    assert payload["target_character"] == "character_a"
    assert 0.0 <= payload["scores"]["overall_style_score"] <= 1.0
    assert len(payload["scores"]["top_mismatches"]) == 3


def test_run_demo_creates_summary_and_outputs(tmp_path: Path) -> None:
    summary_path = run_demo(tmp_path, n_variants=2)
    payload = json.loads(summary_path.read_text(encoding="utf-8"))

    assert summary_path.exists()
    assert len(payload["output_paths"]) == 2
    assert len(payload["report_paths"]) == 2
    assert all(Path(path).exists() for path in payload["output_paths"])
    assert all(Path(path).exists() for path in payload["report_paths"])


def test_build_synthesize_request_uses_voice_clone_and_markup() -> None:
    body = build_synthesize_request(
        text="Hello, world.",
        language_code="en-US",
        audio_encoding="LINEAR16",
        speaking_rate=1.25,
        pause_scale=1.15,
        voice_cloning_key="voice-key-123",
    )

    assert body["voice"]["voiceClone"]["voiceCloningKey"] == "voice-key-123"
    assert body["audioConfig"]["audioEncoding"] == "LINEAR16"
    assert body["audioConfig"]["speakingRate"] == 1.25
    assert "markup" in body["input"]
    assert "[pause long]" in body["input"]["markup"]


def test_build_voice_cloning_key_request_encodes_audio(tmp_path: Path) -> None:
    reference = tmp_path / "ref.wav"
    consent = tmp_path / "consent.wav"
    reference.write_bytes(b"RIFFref")
    consent.write_bytes(b"RIFFconsent")

    body = build_voice_cloning_key_request(
        reference_audio_path=str(reference),
        consent_audio_path=str(consent),
        language_code="en-US",
        consent_script="I consent.",
    )

    assert body["language_code"] == "en-US"
    assert body["consent_script"] == "I consent."
    assert base64.b64decode(body["reference_audio"]["content"]) == b"RIFFref"
    assert base64.b64decode(body["voice_talent_consent"]["content"]) == b"RIFFconsent"


def test_select_reference_audio_prefers_transcripted_segment(tmp_path: Path) -> None:
    manifest_path = tmp_path / "data" / "manifests" / "character_b_segments.csv"
    manifest_path.parent.mkdir(parents=True)
    processed_dir = tmp_path / "data" / "processed" / "character_b_segments"
    processed_dir.mkdir(parents=True)
    weak = processed_dir / "weak.wav"
    strong = processed_dir / "strong.wav"
    extra = processed_dir / "extra.wav"
    weak.write_bytes(b"RIFFweak")
    strong.write_bytes(b"RIFFstrong")
    extra.write_bytes(b"RIFFextra")

    manifest_path.write_text(
        "file_path,character,source,duration_sec,quality_score,emotion_tag,style_tag,transcript,keep_flag\n"
        f"{weak},character_b_segments,weak,2.0,,unknown,neutral,,True\n"
        f"{strong},character_b_segments,strong,8.0,,unknown,neutral,clear transcript line,True\n"
        f"{extra},character_b_segments,extra,7.5,,unknown,neutral,another transcript line,True\n",
        encoding="utf-8",
    )
    profile = load_profile(
        {
            "character": "character_b_segments",
            "global": {k: 0 for k in [
                "f0_mean_hz", "f0_median_hz", "f0_std_hz", "f0_range_hz", "intensity_mean_db", "intensity_std_db",
                "jitter_local", "shimmer_local_db", "hnr_db", "voiced_ratio", "speech_rate_syllables_per_sec",
                "pause_rate_per_min", "mean_pause_ms", "max_pause_ms", "long_pause_ratio", "silence_ratio",
                "spectral_centroid_hz", "spectral_rolloff_hz", "burstiness", "final_pitch_delta_hz"
            ]} | {"mfcc_mean": [], "mfcc_std": []},
            "substyles": {},
            "source_manifest": str(manifest_path),
            "clip_count": 3,
        }
    )

    selected_one = select_reference_audio(profile)
    selected_many = select_reference_audios(profile, max_refs=2)
    assert selected_one == str(strong)
    assert selected_many == [str(strong), str(extra)]


def test_xtts_worker_request_encodes_refs_and_text_variation(tmp_path: Path) -> None:
    ref1 = tmp_path / "a.wav"
    ref2 = tmp_path / "b.wav"
    ref1.write_bytes(b"RIFFa")
    ref2.write_bytes(b"RIFFb")
    config = XTTSConfig(language_code="en", speaker_wav_paths=[str(ref1), str(ref2)], worker_url="http://worker")

    payload = build_xtts_worker_request("Hello, world.", 1.15, config)
    assert payload["language_code"] == "en"
    assert len(payload["speaker_wav_refs"]) == 2
    assert base64.b64decode(payload["speaker_wav_refs"][0]["content_base64"]) == b"RIFFa"
    assert "..." in payload["text"]




def test_create_backend_passes_xtts_tuning_options(tmp_path: Path) -> None:
    ref = tmp_path / "ref.wav"
    ref.write_bytes(b"RIFFref")
    manifest_path = tmp_path / "manifest.csv"
    manifest_path.write_text(
        "file_path,character,source,duration_sec,quality_score,emotion_tag,style_tag,transcript,keep_flag\n"
        f"{ref},character,ref,8.0,,unknown,neutral,hello world,True\n",
        encoding="utf-8",
    )
    profile = load_profile(
        {
            "character": "character",
            "global": {k: 0 for k in [
                "f0_mean_hz", "f0_median_hz", "f0_std_hz", "f0_range_hz", "intensity_mean_db", "intensity_std_db",
                "jitter_local", "shimmer_local_db", "hnr_db", "voiced_ratio", "speech_rate_syllables_per_sec",
                "pause_rate_per_min", "mean_pause_ms", "max_pause_ms", "long_pause_ratio", "silence_ratio",
                "spectral_centroid_hz", "spectral_rolloff_hz", "burstiness", "final_pitch_delta_hz"
            ]} | {"mfcc_mean": [], "mfcc_std": []},
            "substyles": {},
            "source_manifest": str(manifest_path),
            "clip_count": 1,
        }
    )

    backend = create_backend(
        profile,
        backend_name="xtts-worker",
        backend_options={
            "xtts_worker_url": "http://worker",
            "xtts_reference_audio_paths": [str(ref)],
            "xtts_speed": 0.91,
            "xtts_temperature": 0.81,
            "xtts_split_sentences": "false",
            "xtts_enable_text_splitting": "true",
            "xtts_top_p": 0.9,
            "xtts_top_k": 65,
        },
    )
    assert backend.config.speed == 0.91
    assert backend.config.temperature == 0.81
    assert backend.config.split_sentences is False
    assert backend.config.enable_text_splitting is True
    assert backend.config.top_p == 0.9
    assert backend.config.top_k == 65

def test_xtts_worker_backend_writes_audio_from_fake_transport(tmp_path: Path, monkeypatch) -> None:
    ref = tmp_path / "ref.wav"
    ref.write_bytes(b"RIFFref")
    config = XTTSConfig(worker_url="http://worker", speaker_wav_paths=[str(ref)])
    backend = XTTSWorkerBackend(config)

    def fake_post_json(url, body, timeout_sec):
        assert url == "http://worker/synthesize"
        return {"audioContent": base64.b64encode(b"RIFFxttswav").decode("ascii")}

    monkeypatch.setattr("aro_voice_style_lab.xtts_backend.post_json", fake_post_json)
    variant = type("Variant", (), {"output_path": str(tmp_path / "xtts.wav"), "pause_scale": 1.0})()
    profile = type("Profile", (), {})()
    output = backend.synthesize("Hello world.", variant, profile)
    assert output.read_bytes() == b"RIFFxttswav"


def test_create_backend_selects_xtts_worker(tmp_path: Path) -> None:
    ref = tmp_path / "ref.wav"
    ref.write_bytes(b"RIFFref")
    manifest_path = tmp_path / "manifest.csv"
    manifest_path.write_text(
        "file_path,character,source,duration_sec,quality_score,emotion_tag,style_tag,transcript,keep_flag\n"
        f"{ref},character,ref,8.0,,unknown,neutral,hello world,True\n",
        encoding="utf-8",
    )
    profile = load_profile(
        {
            "character": "character",
            "global": {k: 0 for k in [
                "f0_mean_hz", "f0_median_hz", "f0_std_hz", "f0_range_hz", "intensity_mean_db", "intensity_std_db",
                "jitter_local", "shimmer_local_db", "hnr_db", "voiced_ratio", "speech_rate_syllables_per_sec",
                "pause_rate_per_min", "mean_pause_ms", "max_pause_ms", "long_pause_ratio", "silence_ratio",
                "spectral_centroid_hz", "spectral_rolloff_hz", "burstiness", "final_pitch_delta_hz"
            ]} | {"mfcc_mean": [], "mfcc_std": []},
            "substyles": {},
            "source_manifest": str(manifest_path),
            "clip_count": 1,
        }
    )

    backend = create_backend(profile, backend_name="xtts-worker", backend_options={"xtts_worker_url": "http://worker"})
    assert backend.backend_name == "xtts-worker"
