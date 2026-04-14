from __future__ import annotations

import json
from pathlib import Path

from aro_voice_style_lab.routed_policy import (
    generate_with_routed_policy,
    run_routed_policy_benchmark,
    run_weak_bucket_ablation,
)


DUMMY_PROFILE = {
    'character': 'demo',
    'global': {
        'f0_mean_hz': 210.0,
        'f0_median_hz': 208.0,
        'f0_std_hz': 24.0,
        'f0_range_hz': 30.0,
        'intensity_mean_db': -12.0,
        'intensity_std_db': 4.0,
        'jitter_local': 0.04,
        'shimmer_local_db': 1.8,
        'hnr_db': 7.5,
        'voiced_ratio': 0.74,
        'speech_rate_syllables_per_sec': 3.3,
        'pause_rate_per_min': 14.0,
        'mean_pause_ms': 110.0,
        'max_pause_ms': 240.0,
        'long_pause_ratio': 0.22,
        'silence_ratio': 0.24,
        'spectral_centroid_hz': 1450.0,
        'spectral_rolloff_hz': 3120.0,
        'burstiness': 0.38,
        'final_pitch_delta_hz': -18.0,
        'mfcc_mean': [0.3] * 13,
        'mfcc_std': [0.1] * 13,
    },
    'substyles': {
        'neutral': {
            'f0_mean_hz': 205.0,
            'f0_median_hz': 203.0,
            'f0_std_hz': 22.0,
            'f0_range_hz': 28.0,
            'intensity_mean_db': -12.0,
            'intensity_std_db': 4.0,
            'jitter_local': 0.04,
            'shimmer_local_db': 1.8,
            'hnr_db': 7.5,
            'voiced_ratio': 0.74,
            'speech_rate_syllables_per_sec': 3.1,
            'pause_rate_per_min': 13.0,
            'mean_pause_ms': 120.0,
            'max_pause_ms': 260.0,
            'long_pause_ratio': 0.25,
            'silence_ratio': 0.24,
            'spectral_centroid_hz': 1450.0,
            'spectral_rolloff_hz': 3120.0,
            'burstiness': 0.38,
            'final_pitch_delta_hz': -16.0,
            'mfcc_mean': [0.25] * 13,
            'mfcc_std': [0.12] * 13,
        },
    },
    'source_manifest': None,
    'clip_count': 1,
}


def _write_profile(path: Path) -> Path:
    path.write_text(json.dumps(DUMMY_PROFILE), encoding='utf-8')
    return path


def _build_policy(path: Path, profile: Path, refs: dict[str, list[str]]) -> Path:
    payload = {
        'policy_id': 'policy_v1',
        'source_policy_id': 'policy_v1',
        'target_profile': str(profile),
        'xtts_preset': {'name': 'test'},
        'refpacks': {name: {'files': files, 'profile_path': str(profile)} for name, files in refs.items()},
        'prompt_variants': {
            'reaction_short': {'base': 'Use the prompt as-is.', 'hesitant_v1': 'Preserve semantics.'},
            'clipped_question': {'base': 'Use the prompt as-is.'},
        },
        'bucket_policies': {
            'reaction_short': {'ref_pack': 'rambling', 'prompt_variant': 'hesitant_v1'},
            'clipped_question': {'ref_pack': 'pause_heavy', 'prompt_variant': 'base'},
        },
    }
    path.write_text(json.dumps(payload), encoding='utf-8')
    return path


def test_run_routed_policy_benchmark_with_placeholder_includes_lineage(tmp_path: Path) -> None:
    suite = tmp_path / 'suite.json'
    suite.write_text(json.dumps({'suite_id': 'suite', 'prompts': [{'id': 'p1', 'bucket': 'reaction_short', 'text': "Well. That's unexpected."}]}), encoding='utf-8')
    profile = _write_profile(tmp_path / 'profile.json')
    ref_dir = tmp_path / 'refs'
    ref_dir.mkdir()
    dummy = ref_dir / 'dummy.wav'
    dummy.write_bytes(b'RIFF')
    policy = _build_policy(tmp_path / 'policy.json', profile, {'rambling': [str(dummy)], 'pause_heavy': [str(dummy)]})

    out = run_routed_policy_benchmark(policy, suite, 'placeholder', {}, tmp_path / 'out', tmp_path / 'reports')
    payload = json.loads(out.read_text(encoding='utf-8'))

    assert payload['results'][0]['prompt_variant'] == 'hesitant_v1'
    assert payload['results'][0]['ref_pack'] == 'rambling'
    assert payload['mean_overall_style_score'] >= 0.0
    assert sorted(payload['lineage']) == sorted([
        'benchmark_suite_hash',
        'policy_hash',
        'prompt_variant_hash',
        'refpack_manifest_hash',
        'rendered_prompt_hash',
        'xtts_preset_hash',
    ])


def test_generate_with_routed_policy_placeholder(tmp_path: Path) -> None:
    profile = _write_profile(tmp_path / 'profile.json')
    ref_dir = tmp_path / 'refs'
    ref_dir.mkdir()
    dummy = ref_dir / 'dummy.wav'
    dummy.write_bytes(b'RIFF')
    policy = _build_policy(tmp_path / 'policy.json', profile, {'rambling': [str(dummy)], 'pause_heavy': [str(dummy)]})

    outputs = generate_with_routed_policy(policy, 'reaction_short', "Well. That's unexpected.", 'placeholder', {}, tmp_path / 'out')
    assert len(outputs) == 1
    assert outputs[0].exists()


def test_run_weak_bucket_ablation_produces_summary(tmp_path: Path) -> None:
    suite = tmp_path / 'suite.json'
    suite.write_text(
        json.dumps(
            {
                'suite_id': 'suite',
                'prompts': [
                    {'id': 'p1', 'bucket': 'reaction_short', 'text': "Well. That's unexpected."},
                    {'id': 'p2', 'bucket': 'clipped_question', 'text': 'And now what?'},
                ],
            }
        ),
        encoding='utf-8',
    )
    profile = _write_profile(tmp_path / 'profile.json')
    ref_dir = tmp_path / 'refs'
    ref_dir.mkdir()
    refs = {}
    for name in ['rambling', 'pause_heavy', 'staccato', 'restart_disfluent', 'clipped_low_latency']:
        dummy = ref_dir / f'{name}.wav'
        dummy.write_bytes(b'RIFF')
        refs[name] = [str(dummy)]
    policy = _build_policy(tmp_path / 'policy.json', profile, refs)

    out = run_weak_bucket_ablation(
        policy_path=policy,
        suite_path=suite,
        backend_name='placeholder',
        backend_options={},
        output_root=tmp_path / 'ablation_out',
        report_root=tmp_path / 'ablation_reports',
        bucket_candidates={
            'reaction_short': ['restart_disfluent'],
            'clipped_question': ['clipped_low_latency'],
        },
        repeats=2,
    )
    payload = json.loads(out.read_text(encoding='utf-8'))

    assert payload['mandatory_rescue_buckets'] == ['reaction_short', 'clipped_question']
    assert sorted(payload['bucket_reports']) == ['clipped_question', 'reaction_short']
    assert payload['bucket_reports']['reaction_short']['control']['pack'] == 'rambling'
    assert len(payload['bucket_reports']['reaction_short']['comparisons'][0]['runs']) == 2
