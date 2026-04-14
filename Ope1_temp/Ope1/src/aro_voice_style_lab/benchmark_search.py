from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .benchmark import run_benchmark
from .xtts_presets import XTTS_BENCHMARK_PRESET_NAMES, get_presets

PRESETS = get_presets(XTTS_BENCHMARK_PRESET_NAMES)


def run_benchmark_search(
    suite_path: str | Path,
    character_profile: str | Path,
    target_profile: str | Path,
    backend_name: str,
    shared_backend_options: dict[str, Any],
    output_root: str | Path,
    report_root: str | Path,
) -> Path:
    output_root = Path(output_root)
    report_root = Path(report_root)
    output_root.mkdir(parents=True, exist_ok=True)
    report_root.mkdir(parents=True, exist_ok=True)

    results = []
    for preset in PRESETS:
        preset_output = output_root / preset["name"]
        preset_report = report_root / preset["name"]
        summary_path = run_benchmark(
            suite_path=suite_path,
            character_profile=character_profile,
            target_profile=target_profile,
            backend_name=backend_name,
            backend_options={**shared_backend_options, **preset},
            output_root=preset_output,
            report_root=preset_report,
        )
        payload = json.loads(summary_path.read_text(encoding="utf-8"))
        scores = [row["overall_style_score"] for row in payload["results"]]
        rhythm = [row["rhythm_similarity"] for row in payload["results"]]
        results.append(
            {
                "preset": preset,
                "summary_path": str(summary_path),
                "mean_overall_style_score": round(sum(scores) / len(scores), 4),
                "mean_rhythm_similarity": round(sum(rhythm) / len(rhythm), 4),
            }
        )

    results.sort(key=lambda item: (item["mean_rhythm_similarity"], item["mean_overall_style_score"]), reverse=True)
    summary = {
        "suite_path": str(suite_path),
        "character_profile": str(character_profile),
        "target_profile": str(target_profile),
        "backend_name": backend_name,
        "shared_backend_options": shared_backend_options,
        "best_preset": results[0],
        "all_presets": results,
    }
    out = report_root / "summary.json"
    out.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return out
