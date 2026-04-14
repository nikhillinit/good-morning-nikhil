from __future__ import annotations

import csv
import hashlib
import json
import time
from copy import deepcopy
from pathlib import Path
from typing import Any

from .benchmark import load_benchmark_suite
from .character_b_policy import render_prompt_variant
from .generation import create_backend, generate_line, load_profile
from .scoring import score_clip

DEFAULT_WEAK_BUCKET_CANDIDATES = {
    'reaction_short': ['restart_disfluent', 'clipped_low_latency', 'rambling'],
    'clipped_question': ['clipped_low_latency', 'pause_heavy'],
    'calm_low_energy': ['pause_heavy', 'rambling'],
    'interruption_restart': ['restart_disfluent', 'staccato'],
}
MANDATORY_RESCUE_BUCKETS = ('reaction_short', 'clipped_question')


def render_prompt(policy: dict[str, Any], bucket: str, text: str) -> tuple[str, str]:
    bucket_policy = policy['bucket_policies'].get(bucket, {'ref_pack': None, 'prompt_variant': 'base'})
    variant_id = bucket_policy.get('prompt_variant', 'base')
    rendered = render_prompt_variant(bucket, text, variant_id)
    return rendered, variant_id


def _stable_json(payload: Any) -> str:
    return json.dumps(payload, sort_keys=True, separators=(',', ':'), ensure_ascii=True)


def _hash_payload(payload: Any) -> str:
    return hashlib.sha256(_stable_json(payload).encode('utf-8')).hexdigest()


def _mean(rows: list[dict[str, Any]], key: str) -> float:
    if not rows:
        return 0.0
    return round(sum(float(row.get(key, 0.0)) for row in rows) / len(rows), 4)


def _lineage_payload(policy: dict[str, Any], suite: dict[str, Any], rows: list[dict[str, Any]]) -> dict[str, str]:
    refpack_manifest = {
        name: {
            'files': list(payload.get('files', [])),
            'profile_path': payload.get('profile_path'),
        }
        for name, payload in sorted(policy.get('refpacks', {}).items())
    }
    prompt_payload = {
        'prompt_variants': policy.get('prompt_variants', {}),
        'bucket_variants': {
            bucket: cfg.get('prompt_variant', 'base')
            for bucket, cfg in sorted(policy.get('bucket_policies', {}).items())
        },
    }
    rendered_prompts = [
        {
            'prompt_id': row['prompt_id'],
            'bucket': row['bucket'],
            'text': row['text'],
            'rendered_text': row['rendered_text'],
            'prompt_variant': row['prompt_variant'],
        }
        for row in rows
    ]
    xtts_preset = policy.get('xtts_preset', {})
    return {
        'policy_hash': _hash_payload(policy),
        'refpack_manifest_hash': _hash_payload(refpack_manifest),
        'prompt_variant_hash': _hash_payload(prompt_payload),
        'benchmark_suite_hash': _hash_payload(suite),
        'xtts_preset_hash': _hash_payload(xtts_preset),
        'rendered_prompt_hash': _hash_payload(rendered_prompts),
    }


def _bucket_backend_options(
    policy: dict[str, Any],
    bucket: str,
    refpack: dict[str, Any],
    backend_options: dict[str, Any],
) -> dict[str, Any]:
    bucket_policy = policy['bucket_policies'].get(bucket, {})
    preset_overrides = bucket_policy.get('xtts_preset_overrides', {})
    return {
        **backend_options,
        **policy.get('xtts_preset', {}),
        **preset_overrides,
        'xtts_reference_audio_paths': refpack['files'],
    }


def generate_with_routed_policy(
    policy_path: str | Path,
    bucket: str,
    text: str,
    backend_name: str,
    backend_options: dict[str, Any],
    output_dir: str | Path,
    count: int = 1,
) -> list[Path]:
    policy = json.loads(Path(policy_path).read_text(encoding='utf-8'))
    bucket_policy = policy['bucket_policies'][bucket]
    ref_pack = bucket_policy['ref_pack']
    refpack = policy['refpacks'][ref_pack]
    character_profile = refpack['profile_path']
    backend = create_backend(
        load_profile(character_profile),
        backend_name=backend_name,
        backend_options=_bucket_backend_options(policy, bucket, refpack, backend_options),
    )
    rendered_text, _ = render_prompt(policy, bucket, text)
    return generate_line(
        text=rendered_text,
        character_profile=character_profile,
        substyle='neutral',
        n_variants=count,
        output_dir=output_dir,
        backend=backend,
    )


def run_routed_policy_benchmark(
    policy_path: str | Path,
    suite_path: str | Path,
    backend_name: str,
    backend_options: dict[str, Any],
    output_root: str | Path,
    report_root: str | Path,
    suite_override: dict[str, Any] | None = None,
    selected_buckets: list[str] | None = None,
) -> Path:
    policy_path = Path(policy_path)
    policy = json.loads(policy_path.read_text(encoding='utf-8'))
    suite = suite_override or load_benchmark_suite(suite_path)
    output_root = Path(output_root)
    report_root = Path(report_root)
    output_root.mkdir(parents=True, exist_ok=True)
    report_root.mkdir(parents=True, exist_ok=True)

    rows = []
    bucket_filter = set(selected_buckets or [])
    prompts = [prompt for prompt in suite['prompts'] if not bucket_filter or prompt['bucket'] in bucket_filter]
    if suite_override is None and bucket_filter:
        suite = {
            **suite,
            'prompts': prompts,
        }

    for prompt in prompts:
        bucket = prompt['bucket']
        bucket_policy = policy['bucket_policies'][bucket]
        ref_pack = bucket_policy['ref_pack']
        refpack = policy['refpacks'][ref_pack]
        rendered_text, variant_id = render_prompt(policy, bucket, prompt['text'])
        character_profile = refpack['profile_path']
        backend = create_backend(
            load_profile(character_profile),
            backend_name=backend_name,
            backend_options=_bucket_backend_options(policy, bucket, refpack, backend_options),
        )
        prompt_dir = output_root / prompt['id']
        start = time.perf_counter()
        generated = generate_line(
            text=rendered_text,
            character_profile=character_profile,
            substyle='neutral',
            n_variants=1,
            output_dir=prompt_dir,
            backend=backend,
        )
        elapsed = round(time.perf_counter() - start, 3)
        candidate = generated[0]
        report_path = report_root / f"{prompt['id']}_report.json"
        score_clip(candidate, policy['target_profile'], report_path)
        report_payload = json.loads(report_path.read_text(encoding='utf-8'))
        rows.append({
            'prompt_id': prompt['id'],
            'bucket': bucket,
            'text': prompt['text'],
            'rendered_text': rendered_text,
            'prompt_variant': variant_id,
            'ref_pack': ref_pack,
            'candidate_path': str(candidate),
            'report_path': str(report_path),
            'generation_seconds': elapsed,
            **report_payload['scores'],
        })

    summary = {
        'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'policy_path': str(policy_path),
        'policy_id': policy.get('policy_id'),
        'source_policy_id': policy.get('source_policy_id', policy.get('policy_id')),
        'suite_id': suite['suite_id'],
        'backend_name': backend_name,
        'backend_options': backend_options,
        'xtts_preset': policy.get('xtts_preset', {}),
        'mean_overall_style_score': _mean(rows, 'overall_style_score'),
        'mean_rhythm_similarity': _mean(rows, 'rhythm_similarity'),
        'lineage': _lineage_payload(policy, suite, rows),
        'results': rows,
    }
    summary_path = report_root / 'summary.json'
    summary_path.write_text(json.dumps(summary, indent=2), encoding='utf-8')

    csv_path = report_root / 'leaderboard.csv'
    with csv_path.open('w', newline='', encoding='utf-8') as handle:
        writer = csv.DictWriter(handle, fieldnames=[
            'prompt_id', 'bucket', 'prompt_variant', 'ref_pack', 'generation_seconds', 'overall_style_score',
            'pitch_similarity', 'rhythm_similarity', 'texture_similarity', 'spectral_similarity',
            'candidate_path', 'report_path'
        ])
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key) for key in writer.fieldnames})
    return summary_path


def _ordered_candidate_packs(control_pack: str, candidates: list[str]) -> list[str]:
    ordered: list[str] = []
    for pack in [control_pack, *candidates]:
        if pack not in ordered:
            ordered.append(pack)
    return ordered


def _aggregate_ablation_runs(
    bucket: str,
    pack_name: str,
    control_pack: str,
    runs: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        'bucket': bucket,
        'pack': pack_name,
        'control_pack': control_pack,
        'runs': runs,
        'mean_overall_style_score': _mean(runs, 'overall_style_score'),
        'mean_rhythm_similarity': _mean(runs, 'rhythm_similarity'),
        'mean_pitch_similarity': _mean(runs, 'pitch_similarity'),
        'mean_spectral_similarity': _mean(runs, 'spectral_similarity'),
        'mean_texture_similarity': _mean(runs, 'texture_similarity'),
    }


def _best_candidate(control_pack: str, comparisons: list[dict[str, Any]]) -> dict[str, Any] | None:
    candidates = [item for item in comparisons if item['pack'] != control_pack]
    if not candidates:
        return None
    return max(
        candidates,
        key=lambda item: (
            item['mean_rhythm_similarity'],
            item['mean_overall_style_score'],
            item['mean_spectral_similarity'],
            item['mean_pitch_similarity'],
        ),
    )


def run_weak_bucket_ablation(
    policy_path: str | Path,
    suite_path: str | Path,
    backend_name: str,
    backend_options: dict[str, Any],
    output_root: str | Path,
    report_root: str | Path,
    bucket_candidates: dict[str, list[str]] | None = None,
    repeats: int = 1,
) -> Path:
    policy_path = Path(policy_path)
    policy = json.loads(policy_path.read_text(encoding='utf-8'))
    suite = load_benchmark_suite(suite_path)
    output_root = Path(output_root)
    report_root = Path(report_root)
    output_root.mkdir(parents=True, exist_ok=True)
    report_root.mkdir(parents=True, exist_ok=True)
    temp_root = report_root / '_tmp'
    temp_root.mkdir(parents=True, exist_ok=True)
    prompt_by_bucket = {prompt['bucket']: prompt for prompt in suite['prompts']}
    bucket_candidates = bucket_candidates or DEFAULT_WEAK_BUCKET_CANDIDATES

    bucket_reports: dict[str, Any] = {}
    for bucket, candidates in bucket_candidates.items():
        if bucket not in prompt_by_bucket:
            raise ValueError(f'Benchmark suite is missing bucket: {bucket}')
        prompt = prompt_by_bucket[bucket]
        control_pack = policy['bucket_policies'][bucket]['ref_pack']
        comparisons: list[dict[str, Any]] = []
        for pack_name in _ordered_candidate_packs(control_pack, candidates):
            runs: list[dict[str, Any]] = []
            for iteration in range(1, repeats + 1):
                scenario_policy = deepcopy(policy)
                scenario_policy['source_policy_id'] = policy.get('policy_id', 'character_b_routed_policy')
                scenario_policy['policy_id'] = f"{scenario_policy['source_policy_id']}__{bucket}__{pack_name}__run{iteration:02d}"
                scenario_policy['bucket_policies'][bucket] = {
                    **scenario_policy['bucket_policies'][bucket],
                    'ref_pack': pack_name,
                }
                scenario_policy_path = temp_root / f'{bucket}__{pack_name}__run{iteration:02d}__policy.json'
                scenario_policy_path.write_text(json.dumps(scenario_policy, indent=2), encoding='utf-8')
                scenario_suite = {
                    'suite_id': f"{suite['suite_id']}__{bucket}",
                    'prompts': [prompt],
                }
                scenario_output_root = output_root / bucket / pack_name / f'run_{iteration:02d}'
                scenario_report_root = report_root / bucket / pack_name / f'run_{iteration:02d}'
                summary_path = run_routed_policy_benchmark(
                    policy_path=scenario_policy_path,
                    suite_path=suite_path,
                    backend_name=backend_name,
                    backend_options=backend_options,
                    output_root=scenario_output_root,
                    report_root=scenario_report_root,
                    suite_override=scenario_suite,
                )
                summary = json.loads(summary_path.read_text(encoding='utf-8'))
                row = summary['results'][0]
                runs.append({
                    'iteration': iteration,
                    'summary_path': str(summary_path),
                    'prompt_id': row['prompt_id'],
                    'bucket': row['bucket'],
                    'pack': pack_name,
                    'prompt_variant': row['prompt_variant'],
                    'ref_pack': row['ref_pack'],
                    'overall_style_score': row['overall_style_score'],
                    'rhythm_similarity': row['rhythm_similarity'],
                    'pitch_similarity': row['pitch_similarity'],
                    'spectral_similarity': row['spectral_similarity'],
                    'texture_similarity': row['texture_similarity'],
                    'generation_seconds': row['generation_seconds'],
                    'candidate_path': row['candidate_path'],
                    'report_path': row['report_path'],
                    'lineage': summary['lineage'],
                })
            comparisons.append(_aggregate_ablation_runs(bucket, pack_name, control_pack, runs))

        control = next(item for item in comparisons if item['pack'] == control_pack)
        winner = _best_candidate(control_pack, comparisons)
        bucket_reports[bucket] = {
            'bucket': bucket,
            'prompt_id': prompt['id'],
            'text': prompt['text'],
            'control': control,
            'comparisons': comparisons,
            'best_candidate': winner,
            'control_pack': control_pack,
            'mandatory_rescue': bucket in MANDATORY_RESCUE_BUCKETS,
        }
        if winner is not None:
            bucket_reports[bucket]['deltas_vs_control'] = {
                'overall_style_score': round(winner['mean_overall_style_score'] - control['mean_overall_style_score'], 4),
                'rhythm_similarity': round(winner['mean_rhythm_similarity'] - control['mean_rhythm_similarity'], 4),
                'pitch_similarity': round(winner['mean_pitch_similarity'] - control['mean_pitch_similarity'], 4),
                'spectral_similarity': round(winner['mean_spectral_similarity'] - control['mean_spectral_similarity'], 4),
            }

    payload = {
        'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'policy_path': str(policy_path),
        'policy_id': policy.get('policy_id'),
        'source_policy_id': policy.get('source_policy_id', policy.get('policy_id')),
        'suite_id': suite['suite_id'],
        'backend_name': backend_name,
        'repeats': repeats,
        'mandatory_rescue_buckets': list(MANDATORY_RESCUE_BUCKETS),
        'bucket_reports': bucket_reports,
    }
    summary_path = report_root / 'summary.json'
    summary_path.write_text(json.dumps(payload, indent=2), encoding='utf-8')
    return summary_path


def compare_weak_bucket_runs(
    control_summary_path: str | Path,
    candidate_summary_paths: Iterable[str | Path],
    out_path: str | Path,
    buckets: Iterable[str] | None = None,
) -> Path:
    control_summary = json.loads(Path(control_summary_path).read_text(encoding='utf-8'))
    selected_buckets = sorted(set(buckets or []))
    control_rows = {
        row['bucket']: row
        for row in control_summary['results']
        if not selected_buckets or row['bucket'] in selected_buckets
    }

    bucket_payload: dict[str, Any] = {}
    for candidate_path in candidate_summary_paths:
        candidate_summary = json.loads(Path(candidate_path).read_text(encoding='utf-8'))
        for row in candidate_summary['results']:
            bucket = row['bucket']
            if selected_buckets and bucket not in selected_buckets:
                continue
            control_row = control_rows.get(bucket)
            if control_row is None:
                continue
            delta = _build_bucket_delta(control_row, row, candidate_summary_path=candidate_path)
            candidate_payload = {
                'policy_id': candidate_summary.get('policy_id'),
                'policy_hash': candidate_summary.get('policy_hash'),
                'delta_overall_style_score': delta['overall_delta'],
                'delta_rhythm_similarity': delta['rhythm_delta'],
                'delta_pitch_similarity': delta['pitch_delta'],
                'delta_spectral_similarity': delta['spectral_delta'],
                'ref_pack': delta['candidate_ref_pack'],
                'prompt_variant': delta['candidate_prompt_variant'],
                'summary_path': str(candidate_path),
            }
            current = bucket_payload.get(bucket, {}).get('best_candidate')
            if current is None or (
                candidate_payload['delta_rhythm_similarity'],
                candidate_payload['delta_overall_style_score'],
            ) > (
                current['delta_rhythm_similarity'],
                current['delta_overall_style_score'],
            ):
                bucket_payload[bucket] = {
                    'control_policy_id': control_summary.get('policy_id'),
                    'best_candidate': candidate_payload,
                }

    payload = {
        'control_summary_path': str(control_summary_path),
        'control_policy_id': control_summary.get('policy_id'),
        'selected_buckets': selected_buckets,
        'buckets': bucket_payload,
    }
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2), encoding='utf-8')
    return out


def summarize_routed_policy_runs(
    policy_path: str | Path,
    local_summary_path: str | Path,
    worker_summary_path: str | Path,
    worker_validation_path: str | Path,
    out_path: str | Path,
    previous_best_monolithic: dict[str, Any] | None = None,
) -> Path:
    local_summary = json.loads(Path(local_summary_path).read_text(encoding='utf-8'))
    worker_summary = json.loads(Path(worker_summary_path).read_text(encoding='utf-8'))
    worker_validation = json.loads(Path(worker_validation_path).read_text(encoding='utf-8'))
    local_lineage = _extract_lineage(local_summary)
    worker_lineage = _extract_lineage(worker_summary)
    lineage_match = local_lineage == worker_lineage if local_lineage and worker_lineage else None

    conclusions = []
    if lineage_match:
        conclusions.append('Local and worker routed summaries share the same lineage.')
    else:
        conclusions.append('Local and worker routed summaries do not share the same lineage.')

    payload = {
        'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'policy_path': str(policy_path),
        'policy_id': local_summary.get('policy_id') or worker_summary.get('policy_id'),
        'source_policy_id': local_summary.get('source_policy_id') or worker_summary.get('source_policy_id'),
        'local': {
            'mean_overall_style_score': local_summary.get('mean_overall_style_score', _mean(local_summary.get('results', []), 'overall_style_score')),
            'mean_rhythm_similarity': local_summary.get('mean_rhythm_similarity', _mean(local_summary.get('results', []), 'rhythm_similarity')),
            'summary_path': str(local_summary_path),
        },
        'worker': {
            'mean_overall_style_score': worker_summary.get('mean_overall_style_score', _mean(worker_summary.get('results', []), 'overall_style_score')),
            'mean_rhythm_similarity': worker_summary.get('mean_rhythm_similarity', _mean(worker_summary.get('results', []), 'rhythm_similarity')),
            'summary_path': str(worker_summary_path),
        },
        'previous_best_monolithic': previous_best_monolithic,
        'worker_validation': {
            'mean_delta': worker_validation.get('mean_delta', 0.0),
            'max_abs_delta': worker_validation.get('max_abs_delta', 0.0),
            'local_lineage': worker_validation.get('local_lineage', local_lineage),
            'worker_lineage': worker_validation.get('worker_lineage', worker_lineage),
            'lineage_match': worker_validation.get('lineage_match', lineage_match),
            'validation_path': str(worker_validation_path),
        },
        'conclusion': conclusions,
    }
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2), encoding='utf-8')
    return out


def _extract_lineage(summary: dict[str, Any]) -> dict[str, Any]:
    lineage = summary.get('lineage') or {}
    keys = ('policy_hash', 'refpack_manifest_hash', 'prompt_variant_hash', 'benchmark_suite_hash', 'xtts_preset_hash', 'rendered_prompt_hash')
    extracted = {key: lineage.get(key, summary.get(key)) for key in keys if lineage.get(key, summary.get(key)) is not None}
    return extracted


def _build_bucket_delta(
    control_row: dict[str, Any],
    candidate_row: dict[str, Any],
    *,
    candidate_summary_path: str | Path,
    candidate_label: str | None = None,
) -> dict[str, Any]:
    return {
        'bucket': candidate_row.get('bucket', control_row.get('bucket')),
        'candidate_label': candidate_label,
        'control_ref_pack': control_row.get('ref_pack'),
        'candidate_ref_pack': candidate_row.get('ref_pack'),
        'control_prompt_variant': control_row.get('prompt_variant'),
        'candidate_prompt_variant': candidate_row.get('prompt_variant'),
        'control_overall_style_score': control_row.get('overall_style_score'),
        'candidate_overall_style_score': candidate_row.get('overall_style_score'),
        'overall_delta': round(float(candidate_row.get('overall_style_score', 0.0)) - float(control_row.get('overall_style_score', 0.0)), 4),
        'control_rhythm_similarity': control_row.get('rhythm_similarity'),
        'candidate_rhythm_similarity': candidate_row.get('rhythm_similarity'),
        'rhythm_delta': round(float(candidate_row.get('rhythm_similarity', 0.0)) - float(control_row.get('rhythm_similarity', 0.0)), 4),
        'control_pitch_similarity': control_row.get('pitch_similarity'),
        'candidate_pitch_similarity': candidate_row.get('pitch_similarity'),
        'pitch_delta': round(float(candidate_row.get('pitch_similarity', 0.0)) - float(control_row.get('pitch_similarity', 0.0)), 4),
        'control_spectral_similarity': control_row.get('spectral_similarity'),
        'candidate_spectral_similarity': candidate_row.get('spectral_similarity'),
        'spectral_delta': round(float(candidate_row.get('spectral_similarity', 0.0)) - float(control_row.get('spectral_similarity', 0.0)), 4),
        'control_candidate_path': control_row.get('candidate_path'),
        'candidate_path': candidate_row.get('candidate_path'),
        'candidate_summary_path': str(candidate_summary_path),
        'candidate_policy_hash': candidate_row.get('policy_hash'),
    }
