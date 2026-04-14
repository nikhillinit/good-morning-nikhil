from __future__ import annotations

from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any


@dataclass(slots=True)
class ManifestRow:
    file_path: str
    character: str
    source: str
    duration_sec: float | None = None
    quality_score: float | None = None
    emotion_tag: str = "unknown"
    style_tag: str = "neutral"
    delivery_tags: str = ""
    transcript: str = ""
    keep_flag: bool = True

    @classmethod
    def csv_headers(cls) -> list[str]:
        return [
            "file_path",
            "character",
            "source",
            "duration_sec",
            "quality_score",
            "emotion_tag",
            "style_tag",
            "delivery_tags",
            "transcript",
            "keep_flag",
        ]


@dataclass(slots=True)
class UtteranceFeatures:
    f0_mean_hz: float = 0.0
    f0_median_hz: float = 0.0
    f0_std_hz: float = 0.0
    f0_range_hz: float = 0.0
    intensity_mean_db: float = 0.0
    intensity_std_db: float = 0.0
    jitter_local: float = 0.0
    shimmer_local_db: float = 0.0
    hnr_db: float = 0.0
    voiced_ratio: float = 0.0
    speech_rate_syllables_per_sec: float = 0.0
    pause_rate_per_min: float = 0.0
    mean_pause_ms: float = 0.0
    max_pause_ms: float = 0.0
    long_pause_ratio: float = 0.0
    silence_ratio: float = 0.0
    spectral_centroid_hz: float = 0.0
    spectral_rolloff_hz: float = 0.0
    burstiness: float = 0.0
    final_pitch_delta_hz: float = 0.0
    mfcc_mean: list[float] = field(default_factory=list)
    mfcc_std: list[float] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class StyleProfile:
    character: str
    global_features: UtteranceFeatures
    substyles: dict[str, UtteranceFeatures] = field(default_factory=dict)
    source_manifest: str | None = None
    clip_count: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "character": self.character,
            "global": self.global_features.to_dict(),
            "substyles": {name: features.to_dict() for name, features in self.substyles.items()},
            "source_manifest": self.source_manifest,
            "clip_count": self.clip_count,
        }


@dataclass(slots=True)
class GenerationVariant:
    index: int
    substyle: str
    speech_rate_scale: float
    pause_scale: float
    pitch_scale: float
    emphasis_scale: float
    output_path: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class ScoreBreakdown:
    pitch_similarity: float
    rhythm_similarity: float
    texture_similarity: float
    spectral_similarity: float
    overall_style_score: float
    top_mismatches: list[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def ensure_path(value: str | Path) -> Path:
    return value if isinstance(value, Path) else Path(value)

