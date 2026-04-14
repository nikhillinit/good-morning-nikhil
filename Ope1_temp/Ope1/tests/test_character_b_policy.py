from __future__ import annotations

import json
import wave
from pathlib import Path

from aro_voice_style_lab.character_b_policy import (
    FIXED_REFPACK_SOURCE_IDS,
    annotate_delivery_tags,
    build_control_policy_artifact,
    infer_delivery_tags,
    resolve_fixed_refpack_membership,
)


def _write_silence(path: Path, sample_rate: int = 22050, frames: int = 2205) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes(b'\x00\x00' * frames)


def _profile_payload() -> dict[str, object]:
    return {
        'character': 'character_b',
        'global': {
            'f0_mean_hz': 100.0,
            'f0_median_hz': 100.0,
            'f0_std_hz': 10.0,
            'f0_range_hz': 10.0,
            'intensity_mean_db': -10.0,
            'intensity_std_db': 1.0,
            'jitter_local': 0.1,
            'shimmer_local_db': 0.1,
            'hnr_db': 1.0,
            'voiced_ratio': 0.8,
            'speech_rate_syllables_per_sec': 3.0,
            'pause_rate_per_min': 10.0,
            'mean_pause_ms': 100.0,
            'max_pause_ms': 200.0,
            'long_pause_ratio': 0.1,
            'silence_ratio': 0.2,
            'spectral_centroid_hz': 1500.0,
            'spectral_rolloff_hz': 3000.0,
            'burstiness': 0.5,
            'final_pitch_delta_hz': 0.0,
            'mfcc_mean': [0.0] * 13,
            'mfcc_std': [1.0] * 13,
        },
        'substyles': {
            'neutral': {
                'f0_mean_hz': 100.0,
                'f0_median_hz': 100.0,
                'f0_std_hz': 10.0,
                'f0_range_hz': 10.0,
                'intensity_mean_db': -10.0,
                'intensity_std_db': 1.0,
                'jitter_local': 0.1,
                'shimmer_local_db': 0.1,
                'hnr_db': 1.0,
                'voiced_ratio': 0.8,
                'speech_rate_syllables_per_sec': 3.0,
                'pause_rate_per_min': 10.0,
                'mean_pause_ms': 100.0,
                'max_pause_ms': 200.0,
                'long_pause_ratio': 0.1,
                'silence_ratio': 0.2,
                'spectral_centroid_hz': 1500.0,
                'spectral_rolloff_hz': 3000.0,
                'burstiness': 0.5,
                'final_pitch_delta_hz': 0.0,
                'mfcc_mean': [0.0] * 13,
                'mfcc_std': [1.0] * 13,
            },
        },
        'source_manifest': None,
        'clip_count': 1,
    }


def _write_manifest_with_fixed_sources(manifest: Path, root: Path) -> None:
    lines = ['file_path,character,source,duration_sec,quality_score,emotion_tag,style_tag,delivery_tags,transcript,keep_flag']
    seen: set[str] = set()
    for source_ids in FIXED_REFPACK_SOURCE_IDS.values():
        for source in source_ids:
            if source in seen:
                continue
            seen.add(source)
            wav_path = root / f'{source}.wav'
            _write_silence(wav_path)
            lines.append(f'{wav_path},character_b,{source},5.0,,unknown,neutral,,,True')
    manifest.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def test_infer_delivery_tags_identifies_delivery_signals() -> None:
    row = type('Row', (), {'transcript': "Uh, uh, good morning. One, two, three. [laughter]", 'duration_sec': 9.0})()
    tags = infer_delivery_tags(row)
    assert 'filler_heavy' in tags
    assert 'host_intro' in tags
    assert 'counting' in tags
    assert 'laughter' in tags


def test_annotate_delivery_tags_updates_manifest(tmp_path: Path) -> None:
    manifest = tmp_path / 'manifest.csv'
    manifest.write_text(
        'file_path,character,source,duration_sec,quality_score,emotion_tag,style_tag,delivery_tags,transcript,keep_flag\n'
        'a.wav,character_b,seg1,9.0,,unknown,neutral,,"Uh, good morning. [laughter]",True\n',
        encoding='utf-8',
    )
    annotate_delivery_tags(manifest)
    text = manifest.read_text(encoding='utf-8')
    assert 'host_intro' in text
    assert 'laughter' in text


def test_resolve_fixed_refpack_membership_uses_expected_sources(tmp_path: Path) -> None:
    manifest = tmp_path / 'manifest.csv'
    _write_manifest_with_fixed_sources(manifest, tmp_path)

    membership = resolve_fixed_refpack_membership(manifest)

    assert sorted(membership) == sorted(FIXED_REFPACK_SOURCE_IDS)
    assert [row.source for row in membership['pause_heavy']] == FIXED_REFPACK_SOURCE_IDS['pause_heavy']
    assert [row.source for row in membership['restart_disfluent']] == FIXED_REFPACK_SOURCE_IDS['restart_disfluent']


def test_build_control_policy_artifact_writes_fixed_refpack_policy(tmp_path: Path) -> None:
    manifest = tmp_path / 'manifest.csv'
    _write_manifest_with_fixed_sources(manifest, tmp_path)
    target_profile = tmp_path / 'target_profile.json'
    target_profile.write_text(json.dumps(_profile_payload()), encoding='utf-8')

    policy_path = build_control_policy_artifact(
        manifest_path=manifest,
        output_root=tmp_path / 'processed' / 'character_b_control_refpacks',
        target_profile=target_profile,
        out_path=tmp_path / 'character_b_routed_policy_v2_control.json',
    )
    payload = json.loads(policy_path.read_text(encoding='utf-8'))

    assert payload['policy_id'] == 'character_b_routed_policy_v2_control'
    assert payload['source_policy_id'] == 'character_b_refpack_ablation_routed_control'
    assert payload['provisional'] is False
    assert [Path(path).name for path in payload['refpacks']['pause_heavy']['files']] == [
        'jeff_prepared_seg_016.wav',
        'jeff_prepared_seg_017.wav',
        'jeff_prepared_seg_019.wav',
    ]
