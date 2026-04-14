from __future__ import annotations

import csv
import json
import math
import wave
from pathlib import Path

import numpy as np

from aro_voice_style_lab.analysis import annotate_transcript, create_manifest, prepare_audio, segment_audio
from aro_voice_style_lab.profiles import build_profile


def test_build_profile_creates_profile_json(tmp_path: Path) -> None:
    raw_dir = tmp_path / "data" / "raw" / "character_a"
    manifest_dir = tmp_path / "data" / "manifests"
    profiles_dir = tmp_path / "profiles"
    raw_dir.mkdir(parents=True)
    manifest_dir.mkdir(parents=True)
    profiles_dir.mkdir(parents=True)

    wav_path = raw_dir / "line_01.wav"
    make_test_wav(wav_path, base_frequency=205.0)

    manifest_path = manifest_dir / "character_a.csv"
    with manifest_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "file_path",
                "character",
                "source",
                "duration_sec",
                "quality_score",
                "emotion_tag",
                "style_tag",
                "transcript",
                "keep_flag",
            ],
        )
        writer.writeheader()
        writer.writerow(
            {
                "file_path": str(wav_path),
                "character": "character_a",
                "source": "unit_test",
                "duration_sec": 1.4,
                "quality_score": 0.95,
                "emotion_tag": "neutral",
                "style_tag": "neutral",
                "transcript": "This synthetic line gives the profile builder something to count.",
                "keep_flag": True,
            }
        )

    profile_path = build_profile(raw_dir)
    payload = json.loads(profile_path.read_text(encoding="utf-8"))

    assert payload["character"] == "character_a"
    assert payload["clip_count"] == 1
    assert payload["global"]["f0_mean_hz"] > 0
    assert payload["global"]["speech_rate_syllables_per_sec"] > 0
    assert "neutral" in payload["substyles"]


def test_create_manifest_writes_rows_for_audio_files(tmp_path: Path) -> None:
    raw_dir = tmp_path / "data" / "raw" / "character_a"
    raw_dir.mkdir(parents=True)
    wav_path = raw_dir / "source.wav"
    make_test_wav(wav_path, base_frequency=220.0)

    manifest_path = create_manifest(raw_dir)
    rows = manifest_path.read_text(encoding="utf-8").strip().splitlines()

    assert len(rows) == 2
    assert "source.wav" in rows[1]


def test_prepare_audio_copies_wav_without_ffmpeg(tmp_path: Path) -> None:
    raw_dir = tmp_path / "data" / "raw" / "character_a"
    raw_dir.mkdir(parents=True)
    wav_path = raw_dir / "source.wav"
    make_test_wav(wav_path, base_frequency=220.0)

    result = prepare_audio(raw_dir)

    copied = [Path(path) for path in result["copied"]]
    assert len(copied) == 1
    assert copied[0].exists()
    assert copied[0].suffix == ".wav"
    assert result["skipped"] == []


def test_segment_audio_splits_long_file_on_silence(tmp_path: Path) -> None:
    processed_dir = tmp_path / "data" / "processed" / "character_a"
    processed_dir.mkdir(parents=True)
    wav_path = processed_dir / "long_take.wav"
    make_segmentable_wav(wav_path)

    result = segment_audio(processed_dir, min_segment_sec=1.0, max_segment_sec=4.0, min_silence_sec=0.3)

    assert len(result["segments"]) >= 2
    assert all(Path(item["file"]).exists() for item in result["segments"])
    assert all(Path(item["file"]).with_suffix('.json').exists() for item in result["segments"])


def test_annotate_transcript_updates_manifest(tmp_path: Path) -> None:
    processed_dir = tmp_path / "data" / "processed" / "character_b"
    processed_dir.mkdir(parents=True)
    wav_path = processed_dir / "sample.wav"
    make_segmentable_wav(wav_path)

    segment_audio(processed_dir, min_segment_sec=1.0, max_segment_sec=3.0, min_silence_sec=0.3)
    segmented_dir = tmp_path / "data" / "processed" / "character_b_segments"
    manifest_path = create_manifest(segmented_dir)
    transcript_path = tmp_path / "JeffTranscript.md"
    transcript_path.write_text(
        "0:00 - 0:03\nalpha beta gamma delta epsilon zeta\n\n0:03 - 0:06\neta theta iota kappa lambda mu\n",
        encoding="utf-8",
    )

    result = annotate_transcript(segmented_dir, transcript_path, manifest_path=manifest_path, source_filter="sample")
    rows = manifest_path.read_text(encoding="utf-8")

    assert result["updated_rows"] >= 1
    assert "alpha" in rows or "eta" in rows


def test_annotate_transcript_supports_inline_granular_lines(tmp_path: Path) -> None:
    processed_dir = tmp_path / "data" / "processed" / "character_b"
    processed_dir.mkdir(parents=True)
    wav_path = processed_dir / "sample.wav"
    make_segmentable_wav(wav_path)

    segment_audio(processed_dir, min_segment_sec=1.0, max_segment_sec=3.0, min_silence_sec=0.3)
    segmented_dir = tmp_path / "data" / "processed" / "character_b_segments"
    manifest_path = create_manifest(segmented_dir)
    transcript_path = tmp_path / "JeffGranular.txt"
    transcript_path.write_text(
        "00:00.00 - 00:01.50\talpha beta gamma\n00:01.50 - 00:03.00\tdelta epsilon zeta\n",
        encoding="utf-8",
    )

    result = annotate_transcript(segmented_dir, transcript_path, manifest_path=manifest_path, source_filter="sample")
    rows = manifest_path.read_text(encoding="utf-8")

    assert result["block_count"] == 2
    assert result["updated_rows"] >= 1
    assert "alpha" in rows or "delta" in rows


def make_test_wav(path: Path, base_frequency: float) -> None:
    sample_rate = 22050
    duration_sec = 1.4
    timeline = np.arange(int(sample_rate * duration_sec), dtype=np.float32) / sample_rate
    waveform = 0.35 * np.sin(2 * math.pi * base_frequency * timeline)
    waveform[int(sample_rate * 0.45) : int(sample_rate * 0.55)] = 0.0
    waveform[int(sample_rate * 0.95) : int(sample_rate * 1.02)] = 0.0
    write_wav(path, waveform, sample_rate)


def make_segmentable_wav(path: Path) -> None:
    sample_rate = 22050
    parts = []
    for frequency in (180.0, 220.0, 205.0):
        timeline = np.arange(int(sample_rate * 1.5), dtype=np.float32) / sample_rate
        speech = 0.3 * np.sin(2 * math.pi * frequency * timeline)
        silence = np.zeros(int(sample_rate * 0.45), dtype=np.float32)
        parts.extend([speech, silence])
    waveform = np.concatenate(parts)
    write_wav(path, waveform, sample_rate)


def write_wav(path: Path, waveform: np.ndarray, sample_rate: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = np.clip(waveform * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes(pcm.tobytes())
