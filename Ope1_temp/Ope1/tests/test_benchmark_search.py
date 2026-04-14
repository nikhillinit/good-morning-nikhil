from __future__ import annotations

import json
from pathlib import Path

from aro_voice_style_lab.benchmark_search import run_benchmark_search


def test_run_benchmark_search(tmp_path: Path) -> None:
    suite_path = tmp_path / "suite.json"
    suite_path.write_text(
        json.dumps(
            {
                "suite_id": "suite",
                "prompts": [
                    {"id": "p1", "bucket": "short", "text": "Hello there."},
                    {"id": "p2", "bucket": "question", "text": "What are we doing?"},
                ],
            }
        ),
        encoding="utf-8",
    )
    profile_path = tmp_path / "profile.json"
    profile_path.write_text(
        json.dumps(
            {
                "character": "demo",
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
                    "mfcc_std": [0.1] * 13,
                },
                "substyles": {"neutral": {
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
                    "mfcc_std": [0.12] * 13,
                }},
                "source_manifest": None,
                "clip_count": 1,
            }
        ),
        encoding="utf-8",
    )
    out = run_benchmark_search(
        suite_path,
        profile_path,
        profile_path,
        "placeholder",
        {},
        tmp_path / "out",
        tmp_path / "reports",
    )
    payload = json.loads(out.read_text(encoding="utf-8"))
    assert payload["best_preset"]["preset"]["name"]
    assert len(payload["all_presets"]) >= 1
