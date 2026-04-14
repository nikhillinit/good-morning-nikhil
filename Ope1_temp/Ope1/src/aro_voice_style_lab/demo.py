from __future__ import annotations

import csv
import json
import math
import wave
from pathlib import Path

import numpy as np

from .generation import generate_line
from .profiles import build_profile
from .scoring import score_clip


def run_demo(project_root: str | Path, line: str | None = None, n_variants: int = 3) -> Path:
    root = Path(project_root)
    character = "demo_character"
    raw_dir = root / "data" / "raw" / character
    manifest_path = root / "data" / "manifests" / f"{character}.csv"
    profile_path = root / "profiles" / f"{character}_profile.json"
    output_dir = root / "outputs" / character
    reports_dir = root / "reports"
    summary_path = reports_dir / f"{character}_demo_summary.json"

    raw_dir.mkdir(parents=True, exist_ok=True)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    clips = [
        {
            "name": "neutral_01.wav",
            "style_tag": "neutral",
            "transcript": "Measured pauses matter more than polished generic speech.",
            "base_frequency": 208.0,
            "pause_windows": [(0.42, 0.10), (0.95, 0.08)],
            "amplitude": 0.34,
        },
        {
            "name": "neutral_02.wav",
            "style_tag": "neutral",
            "transcript": "This synthetic corpus gives the pipeline a target profile to learn.",
            "base_frequency": 216.0,
            "pause_windows": [(0.36, 0.12), (1.02, 0.06)],
            "amplitude": 0.31,
        },
        {
            "name": "amped_01.wav",
            "style_tag": "amped",
            "transcript": "Punchier lines show bigger peaks and shorter pauses.",
            "base_frequency": 232.0,
            "pause_windows": [(0.28, 0.06), (0.72, 0.05)],
            "amplitude": 0.42,
        },
    ]

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
        for clip in clips:
            path = raw_dir / clip["name"]
            duration_sec = write_demo_clip(
                path,
                base_frequency=clip["base_frequency"],
                pause_windows=clip["pause_windows"],
                amplitude=clip["amplitude"],
            )
            writer.writerow(
                {
                    "file_path": str(path),
                    "character": character,
                    "source": path.stem,
                    "duration_sec": round(duration_sec, 4),
                    "quality_score": 0.95,
                    "emotion_tag": "synthetic",
                    "style_tag": clip["style_tag"],
                    "transcript": clip["transcript"],
                    "keep_flag": True,
                }
            )

    built_profile = build_profile(raw_dir, profile_path)
    rendered_line = line or "This is a demo rendering for evaluating the pipeline output."
    outputs = generate_line(rendered_line, built_profile, substyle="neutral", n_variants=n_variants, output_dir=output_dir)
    reports = [score_clip(output, built_profile, reports_dir / f"{Path(output).stem}_report.json") for output in outputs]

    summary = {
        "profile_path": str(built_profile),
        "output_paths": [str(path) for path in outputs],
        "report_paths": [str(path) for path in reports],
        "notes": [
            "Demo outputs are synthetic placeholder renderings.",
            "Use prepare-audio plus a permitted voice corpus before real evaluation.",
        ],
    }
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return summary_path


def write_demo_clip(
    path: Path,
    base_frequency: float,
    pause_windows: list[tuple[float, float]],
    amplitude: float,
    sample_rate: int = 22050,
    duration_sec: float = 1.5,
) -> float:
    timeline = np.arange(int(sample_rate * duration_sec), dtype=np.float32) / sample_rate
    glide = 1.0 + 0.04 * np.sin(2 * math.pi * 1.1 * timeline)
    waveform = amplitude * np.sin(2 * math.pi * base_frequency * glide * timeline)

    for start_sec, pause_length in pause_windows:
        start = int(start_sec * sample_rate)
        stop = int((start_sec + pause_length) * sample_rate)
        waveform[start:stop] = 0.0

    envelope = np.linspace(0.15, 1.0, waveform.size, dtype=np.float32)
    waveform = (waveform * envelope).astype(np.float32)
    write_wav(path, waveform, sample_rate)
    return duration_sec


def write_wav(path: Path, waveform: np.ndarray, sample_rate: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = np.clip(waveform * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes(pcm.tobytes())
