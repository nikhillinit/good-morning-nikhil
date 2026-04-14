from __future__ import annotations

import json
from pathlib import Path

from aro_voice_style_lab.shot_list_render import SpeakerRenderConfig, parse_speaker_profile_args, render_shot_list


def build_profile_fixture(profile_path: Path, character: str) -> None:
    profile_path.write_text(
        json.dumps(
            {
                "character": character,
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
                        "mfcc_std": [0.12] * 13,
                    }
                },
                "source_manifest": None,
                "clip_count": 1,
            }
        ),
        encoding="utf-8",
    )


def test_parse_speaker_profile_args_builds_mapping() -> None:
    mapping = parse_speaker_profile_args(
        ["STEVE=C:\\profiles\\steve.json", "JEFF=C:\\profiles\\jeff.json"],
        ["JEFF=rambling_pitch"],
    )

    assert mapping["STEVE"].profile_path == "C:\\profiles\\steve.json"
    assert mapping["STEVE"].substyle == "neutral"
    assert mapping["JEFF"].substyle == "rambling_pitch"


def test_render_shot_list_renders_mapped_speakers_and_skips_missing(tmp_path: Path) -> None:
    compiled_path = tmp_path / "compiled.json"
    output_dir = tmp_path / "renders"
    steve_profile = tmp_path / "steve_profile.json"
    jeff_profile = tmp_path / "jeff_profile.json"
    build_profile_fixture(steve_profile, "steve")
    build_profile_fixture(jeff_profile, "jeff")
    compiled_path.write_text(
        json.dumps(
            {
                "dialogue_cues": [
                    {
                        "cue_id": "screen_0_line_01",
                        "screen_id": "SCREEN 0",
                        "speaker": "STEVE",
                        "text": "All right, final round.",
                    },
                    {
                        "cue_id": "screen_0_line_02",
                        "screen_id": "SCREEN 0",
                        "speaker": "JEFF",
                        "text": "I have a thought, Stevie.",
                    },
                    {
                        "cue_id": "screen_0_line_03",
                        "screen_id": "SCREEN 0",
                        "speaker": "AUDIENCE",
                        "text": "Laughter.",
                    },
                ]
            }
        ),
        encoding="utf-8",
    )

    summary_path = render_shot_list(
        compiled_shot_list_path=compiled_path,
        speaker_profiles={
            "STEVE": SpeakerRenderConfig(profile_path=str(steve_profile)),
            "JEFF": SpeakerRenderConfig(profile_path=str(jeff_profile), substyle="neutral"),
        },
        output_dir=output_dir,
        count=1,
    )

    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    assert summary["rendered_count"] == 2
    assert summary["skipped_count"] == 1
    assert summary["skipped_cues"][0]["speaker"] == "AUDIENCE"
    for cue in summary["rendered_cues"]:
        for output_path in cue["output_paths"]:
            assert Path(output_path).exists()
