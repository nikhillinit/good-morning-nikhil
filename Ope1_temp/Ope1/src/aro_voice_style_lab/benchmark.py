from __future__ import annotations

import csv
import json
import time
from pathlib import Path
from typing import Any

from .generation import create_backend, generate_line, load_profile
from .scoring import score_clip

LINEAGE_KEYS = (
    'policy_id',
    'source_policy_id',
    'policy_hash',
    'refpack_manifest_hash',
    'prompt_variant_hash',
    'benchmark_suite_hash',
)


def load_benchmark_suite(path: str | Path) -> dict[str, Any]:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def _extract_lineage(summary: dict[str, Any]) -> dict[str, Any]:
    payload = {key: summary.get(key) for key in LINEAGE_KEYS if summary.get(key) is not None}
    if summary.get('selected_buckets') is not None:
        payload['selected_buckets'] = summary.get('selected_buckets')
    return payload


def run_benchmark(
    suite_path: str | Path,
    character_profile: str | Path,
    target_profile: str | Path,
    backend_name: str,
    backend_options: dict[str, Any],
    output_root: str | Path,
    report_root: str | Path,
) -> Path:
    suite = load_benchmark_suite(suite_path)
    profile = load_profile(character_profile)
    backend = create_backend(profile, backend_name=backend_name, backend_options=backend_options)
    output_root = Path(output_root)
    report_root = Path(report_root)
    output_root.mkdir(parents=True, exist_ok=True)
    report_root.mkdir(parents=True, exist_ok=True)

    rows = []
    for prompt in suite["prompts"]:
        prompt_dir = output_root / prompt["id"]
        start = time.perf_counter()
        generated = generate_line(
            text=prompt["text"],
            character_profile=character_profile,
            substyle="neutral",
            n_variants=1,
            output_dir=prompt_dir,
            backend=backend,
        )
        elapsed = round(time.perf_counter() - start, 3)
        candidate = generated[0]
        report_path = report_root / f"{prompt['id']}_report.json"
        score_clip(candidate, target_profile, report_path)
        report_payload = json.loads(report_path.read_text(encoding="utf-8"))
        rows.append(
            {
                "prompt_id": prompt["id"],
                "bucket": prompt["bucket"],
                "text": prompt["text"],
                "candidate_path": str(candidate),
                "report_path": str(report_path),
                "generation_seconds": elapsed,
                **report_payload["scores"],
            }
        )

    summary = {
        "suite_id": suite["suite_id"],
        "character_profile": str(character_profile),
        "target_profile": str(target_profile),
        "backend_name": backend_name,
        "backend_options": backend_options,
        "results": rows,
    }
    summary_path = report_root / "summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    csv_path = report_root / "leaderboard.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "prompt_id",
                "bucket",
                "generation_seconds",
                "overall_style_score",
                "pitch_similarity",
                "rhythm_similarity",
                "texture_similarity",
                "spectral_similarity",
                "candidate_path",
                "report_path",
            ],
        )
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key) for key in writer.fieldnames})

    return summary_path


def compare_benchmark_runs(local_summary_path: str | Path, worker_summary_path: str | Path, out_path: str | Path) -> Path:
    local_summary = json.loads(Path(local_summary_path).read_text(encoding="utf-8"))
    worker_summary = json.loads(Path(worker_summary_path).read_text(encoding="utf-8"))

    local_rows = {row["prompt_id"]: row for row in local_summary["results"]}
    worker_rows = {row["prompt_id"]: row for row in worker_summary["results"]}
    prompt_ids = sorted(set(local_rows) & set(worker_rows))

    comparisons = []
    for prompt_id in prompt_ids:
        local = local_rows[prompt_id]
        worker = worker_rows[prompt_id]
        comparisons.append(
            {
                "prompt_id": prompt_id,
                "bucket": local["bucket"],
                "local_score": local["overall_style_score"],
                "worker_score": worker["overall_style_score"],
                "delta": round(worker["overall_style_score"] - local["overall_style_score"], 4),
                "local_seconds": local["generation_seconds"],
                "worker_seconds": worker["generation_seconds"],
            }
        )

    if comparisons:
        mean_delta = round(sum(item["delta"] for item in comparisons) / len(comparisons), 4)
        max_abs_delta = round(max(abs(item["delta"]) for item in comparisons), 4)
    else:
        mean_delta = 0.0
        max_abs_delta = 0.0

    local_lineage = _extract_lineage(local_summary)
    worker_lineage = _extract_lineage(worker_summary)
    payload = {
        "local_summary_path": str(local_summary_path),
        "worker_summary_path": str(worker_summary_path),
        "prompt_count": len(comparisons),
        "mean_delta": mean_delta,
        "max_abs_delta": max_abs_delta,
        "comparisons": comparisons,
        "local_lineage": local_lineage,
        "worker_lineage": worker_lineage,
        "lineage_match": local_lineage == worker_lineage if local_lineage and worker_lineage else None,
    }
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return out
