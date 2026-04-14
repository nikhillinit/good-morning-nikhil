from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from .analysis import extract_features
from .generation import load_profile
from .models import ScoreBreakdown, ensure_path


def score_clip(candidate_wav: str | Path, target_profile: str | Path | dict, report_path: str | Path | None = None) -> Path:
    candidate_path = ensure_path(candidate_wav)
    profile = load_profile(target_profile)
    features = extract_features(candidate_path)

    pitch = mean_score(
        closeness(features.f0_mean_hz, profile.global_features.f0_mean_hz, 80.0),
        closeness(features.f0_std_hz, profile.global_features.f0_std_hz, 40.0),
        closeness(features.final_pitch_delta_hz, profile.global_features.final_pitch_delta_hz, 60.0),
    )
    rhythm = mean_score(
        closeness(features.speech_rate_syllables_per_sec, profile.global_features.speech_rate_syllables_per_sec, 1.5),
        closeness(features.mean_pause_ms, profile.global_features.mean_pause_ms, 140.0),
        closeness(features.pause_rate_per_min, profile.global_features.pause_rate_per_min, 18.0),
        closeness(features.long_pause_ratio, profile.global_features.long_pause_ratio, 0.5),
    )
    texture = mean_score(
        closeness(features.jitter_local, profile.global_features.jitter_local, 0.2),
        closeness(features.shimmer_local_db, profile.global_features.shimmer_local_db, 6.0),
        closeness(features.hnr_db, profile.global_features.hnr_db, 8.0),
        closeness(features.intensity_std_db, profile.global_features.intensity_std_db, 10.0),
    )
    spectral = mean_score(
        closeness(features.spectral_centroid_hz, profile.global_features.spectral_centroid_hz, 800.0),
        closeness(features.spectral_rolloff_hz, profile.global_features.spectral_rolloff_hz, 1500.0),
        vector_closeness(features.mfcc_mean, profile.global_features.mfcc_mean, 30.0),
    )

    overall = round((0.35 * rhythm) + (0.25 * pitch) + (0.20 * texture) + (0.20 * spectral), 4)
    mismatches = top_mismatches(features, profile.global_features)
    breakdown = ScoreBreakdown(
        pitch_similarity=round(pitch, 4),
        rhythm_similarity=round(rhythm, 4),
        texture_similarity=round(texture, 4),
        spectral_similarity=round(spectral, 4),
        overall_style_score=overall,
        top_mismatches=mismatches,
    )

    payload = {
        "candidate_path": str(candidate_path),
        "target_character": profile.character,
        "target_substyle": "global",
        "scores": breakdown.to_dict(),
    }
    target = ensure_path(report_path) if report_path else Path("reports") / f"{candidate_path.stem}_report.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return target


def closeness(observed: float, target: float, scale: float) -> float:
    if scale <= 0:
        return 0.0
    return max(0.0, 1.0 - (abs(observed - target) / scale))


def vector_closeness(observed: list[float], target: list[float], scale: float) -> float:
    if not observed or not target:
        return 0.0
    obs = np.asarray(observed, dtype=np.float32)
    tgt = np.asarray(target, dtype=np.float32)
    limit = min(obs.size, tgt.size)
    if limit == 0:
        return 0.0
    distance = float(np.linalg.norm(obs[:limit] - tgt[:limit]))
    return max(0.0, 1.0 - distance / scale)


def mean_score(*values: float) -> float:
    return float(np.mean(values)) if values else 0.0


def top_mismatches(observed, target) -> list[str]:
    candidates = [
        ("pitch swings too narrow", abs(observed.f0_std_hz - target.f0_std_hz)),
        ("speech rate drifted from target", abs(observed.speech_rate_syllables_per_sec - target.speech_rate_syllables_per_sec)),
        ("pause timing needs more variance", abs(observed.mean_pause_ms - target.mean_pause_ms)),
        ("spectral color is off target", abs(observed.spectral_centroid_hz - target.spectral_centroid_hz)),
        ("texture stability differs from target", abs(observed.hnr_db - target.hnr_db)),
    ]
    return [label for label, _ in sorted(candidates, key=lambda item: item[1], reverse=True)[:3]]

