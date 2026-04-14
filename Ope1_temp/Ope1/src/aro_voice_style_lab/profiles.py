from __future__ import annotations

import json
from dataclasses import fields
from pathlib import Path

import numpy as np

from .analysis import create_manifest, extract_features, load_manifest, scan_character_dir
from .models import ManifestRow, StyleProfile, UtteranceFeatures, ensure_path


def build_profile(character_dir: str | Path, profile_path: str | Path | None = None) -> Path:
    base = ensure_path(character_dir)
    character = base.name
    manifest_path = base.parents[1] / "manifests" / f"{character}.csv"
    if not manifest_path.exists():
        create_manifest(base, manifest_path)

    rows = [row for row in load_manifest(manifest_path) if row.keep_flag]
    if not rows and scan_character_dir(base):
        create_manifest(base, manifest_path)
        rows = [row for row in load_manifest(manifest_path) if row.keep_flag]

    collected: list[tuple[ManifestRow, UtteranceFeatures]] = []
    for row in rows:
        audio_path = Path(row.file_path)
        if not audio_path.exists() or audio_path.suffix.lower() not in {".wav", ".wave"}:
            continue
        collected.append((row, extract_features(audio_path, transcript=row.transcript)))

    global_features = aggregate_features([features for _, features in collected])
    substyles = {
        style_name: aggregate_features([features for row, features in collected if row.style_tag == style_name])
        for style_name in sorted({row.style_tag for row, _ in collected})
    }
    profile = StyleProfile(
        character=character,
        global_features=global_features,
        substyles=substyles,
        source_manifest=str(manifest_path),
        clip_count=len(collected),
    )

    target = ensure_path(profile_path) if profile_path else base.parents[2] / "profiles" / f"{character}_profile.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", encoding="utf-8") as handle:
        json.dump(profile.to_dict(), handle, indent=2)
    return target


def aggregate_features(features_list: list[UtteranceFeatures]) -> UtteranceFeatures:
    if not features_list:
        return UtteranceFeatures()

    aggregated: dict[str, object] = {}
    for field in fields(UtteranceFeatures):
        values = [getattr(features, field.name) for features in features_list]
        if field.name in {"mfcc_mean", "mfcc_std"}:
            vectors = [np.asarray(value, dtype=np.float32) for value in values if value]
            aggregated[field.name] = (
                np.mean(np.stack(vectors, axis=0), axis=0).round(6).tolist() if vectors else []
            )
        else:
            aggregated[field.name] = float(np.mean(values))
    return UtteranceFeatures(**aggregated)
