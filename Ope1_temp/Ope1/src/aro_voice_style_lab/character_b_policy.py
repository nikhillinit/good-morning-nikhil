from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

from .analysis import load_manifest, write_manifest
from .models import ManifestRow

DEFAULT_XTTS_PRESET = {
    'name': 'looser_pause_bias',
    'xtts_split_sentences': 'false',
    'xtts_enable_text_splitting': 'false',
    'xtts_speed': 0.95,
    'xtts_temperature': 0.85,
    'xtts_length_penalty': 1.1,
    'xtts_repetition_penalty': 7.5,
    'xtts_top_k': 70,
    'xtts_top_p': 0.92,
}

DEFAULT_BUCKET_TO_PACK = {
    'reaction_short': 'rambling',
    'neutral_declarative': 'staccato',
    'question_rising': 'staccato',
    'punchline_pause': 'staccato',
    'wandering_sentence': 'staccato',
    'interruption_restart': 'staccato',
    'emphasis_heavy': 'rambling',
    'calm_low_energy': 'pause_heavy',
    'host_intro': 'pause_heavy',
    'counting_list': 'rambling',
    'clause_heavy': 'rambling',
    'clipped_question': 'pause_heavy',
}

PROMPT_VARIANT_METADATA = {
    'reaction_short': {
        'base': 'Use the prompt as-is.',
        'hesitant_v1': 'Preserve semantics but replace the initial hard stop with a more hesitant ellipsis.',
    },
    'clipped_question': {
        'base': 'Use the prompt as-is.',
        'hesitant_v1': 'Preserve semantics but lengthen the onset with a clipped hesitation.',
    },
    'interruption_restart': {
        'base': 'Use the prompt as-is.',
        'restart_v1': 'Preserve semantics while adding a restart pattern and a stronger interruption mark.',
    },
    'calm_low_energy': {
        'base': 'Use the prompt as-is.',
        'calm_v1': 'Preserve semantics while inserting a slower, softer clause break.',
    },
}

PROVISIONAL_BUCKET_VARIANTS = {
    'reaction_short': 'base',
    'clipped_question': 'base',
    'interruption_restart': 'base',
    'calm_low_energy': 'base',
}

FIXED_REFPACK_SOURCE_IDS = {
    'pause_heavy': ['jeff_prepared_seg_016', 'jeff_prepared_seg_017', 'jeff_prepared_seg_019'],
    'rambling': ['jeff_prepared_seg_004', 'jeff_prepared_seg_006', 'jeff_prepared_seg_008'],
    'staccato': ['jeff_prepared_seg_002', 'jeff_prepared_seg_005', 'jeff_prepared_seg_020'],
    'restart_disfluent': ['jeff_prepared_seg_002', 'jeff_prepared_seg_016', 'jeff_prepared_seg_018'],
    'clipped_low_latency': ['jeff_prepared_seg_002', 'jeff_prepared_seg_014', 'jeff_prepared_seg_018'],
}

PACK_RULES = {
    'pause_heavy': {'pause_heavy', 'host_intro', 'laughter', 'low_energy'},
    'rambling': {'rambling', 'counting', 'filler_heavy'},
    'staccato': {'restart', 'cutoff', 'clipped', 'question_rise', 'short_burst'},
    'restart_disfluent': {'restart', 'cutoff', 'filler_heavy', 'laughter'},
    'clipped_low_latency': {'clipped', 'cutoff', 'question_rise', 'short_burst'},
}


def infer_delivery_tags(row: ManifestRow) -> list[str]:
    text = (row.transcript or '').lower()
    tags: set[str] = set()

    if '[cutoff]' in text or re.search(r'\b\w+-\b', text):
        tags.update({'cutoff', 'clipped'})
    if '[laughter]' in text:
        tags.add('laughter')
    if re.search(r'\buh\b', text) or re.search(r'\bmaybe\b', text) or text.count(',') >= 3:
        tags.add('filler_heavy')
    if re.search(r'\b(\w+)\s+\1\b', text) or 'is is' in text or 'my, my' in text or 'maybe i can, maybe' in text:
        tags.add('restart')
    if re.search(r'\b\d+,', text) or 'one, two, three' in text or 'count' in text:
        tags.add('counting')
    if 'good morning' in text or 'good evening' in text or 'welcome back' in text or 'new host' in text:
        tags.update({'host_intro', 'pause_heavy'})
    if row.duration_sec and row.duration_sec < 4.5:
        tags.update({'short_burst', 'clipped'})
    if '?' in text or text.startswith('and now what') or text.startswith('do you'):
        tags.add('question_rise')
    if (row.duration_sec and row.duration_sec >= 8.0) or text.count(',') >= 4:
        tags.add('rambling')
    if text.count('.') >= 2 or '...' in text:
        tags.add('pause_heavy')
    if "it's fine" in text or 'tomorrow' in text:
        tags.add('low_energy')
    return sorted(tags)


def render_prompt_variant(bucket: str, text: str, variant_id: str) -> str:
    if variant_id == 'base':
        return text
    if bucket == 'reaction_short' and variant_id == 'hesitant_v1':
        if text.startswith('Well.'):
            return text.replace('Well.', 'Well...', 1)
        return f'Well... {text}'
    if bucket == 'clipped_question' and variant_id == 'hesitant_v1':
        if text.startswith('And now what?'):
            return 'And... now what?'
        return text.replace('?', ' ... ?', 1) if '?' in text else text
    if bucket == 'interruption_restart' and variant_id == 'restart_v1':
        updated = text
        updated = updated.replace('No, wait,', 'No, wait --', 1)
        updated = updated.replace("that's not exactly what I meant.", "that's not, that's not exactly what I meant.", 1)
        return updated
    if bucket == 'calm_low_energy' and variant_id == 'calm_v1':
        return text.replace("It's fine.", "It's fine...", 1)
    return text


def annotate_delivery_tags(manifest_path: str | Path) -> Path:
    path = Path(manifest_path)
    rows = load_manifest(path)
    updated: list[ManifestRow] = []
    for row in rows:
        row.delivery_tags = ','.join(infer_delivery_tags(row))
        updated.append(row)
    write_manifest(path, updated)
    return path


def _primary_pack(row: ManifestRow) -> str:
    tags = set(filter(None, (row.delivery_tags or '').split(',')))
    if tags & {'host_intro', 'pause_heavy', 'low_energy', 'laughter'}:
        return 'pause_heavy'
    if tags & {'restart', 'cutoff', 'clipped', 'question_rise', 'short_burst'}:
        return 'staccato'
    return 'rambling'


def _rows_by_source(rows: list[ManifestRow]) -> dict[str, ManifestRow]:
    return {row.source: row for row in rows if row.keep_flag}


def resolve_fixed_refpack_membership(
    manifest_path: str | Path,
    refpack_sources: dict[str, list[str]] | None = None,
) -> dict[str, list[ManifestRow]]:
    rows = [row for row in load_manifest(manifest_path) if row.keep_flag]
    by_source = _rows_by_source(rows)
    membership: dict[str, list[ManifestRow]] = {}
    missing: dict[str, list[str]] = {}

    for pack_name, sources in (refpack_sources or FIXED_REFPACK_SOURCE_IDS).items():
        selected: list[ManifestRow] = []
        missing_sources: list[str] = []
        for source in sources:
            row = by_source.get(source)
            if row is None:
                missing_sources.append(source)
                continue
            selected.append(row)
        if missing_sources:
            missing[pack_name] = missing_sources
        membership[pack_name] = selected

    if missing:
        details = '; '.join(f"{pack}: {', '.join(sources)}" for pack, sources in sorted(missing.items()))
        raise ValueError(f'Manifest is missing fixed refpack sources: {details}')
    return membership


def build_refpack_membership_from_manifest(manifest_path: str | Path) -> dict[str, list[ManifestRow]]:
    rows = [row for row in load_manifest(manifest_path) if row.keep_flag]
    packs: dict[str, list[ManifestRow]] = {name: [] for name in PACK_RULES}
    for row in rows:
        primary = _primary_pack(row)
        packs[primary].append(row)
        row_tags = set(filter(None, (row.delivery_tags or '').split(',')))
        if row_tags & PACK_RULES['restart_disfluent']:
            packs['restart_disfluent'].append(row)
        if row_tags & PACK_RULES['clipped_low_latency']:
            packs['clipped_low_latency'].append(row)

    by_source = _rows_by_source(rows)
    for pack_name, sources in FIXED_REFPACK_SOURCE_IDS.items():
        if packs[pack_name]:
            continue
        packs[pack_name] = [by_source[source] for source in sources if source in by_source]
    return packs


def materialize_refpacks(membership: dict[str, list[ManifestRow]], output_root: str | Path) -> dict[str, dict[str, object]]:
    root = Path(output_root)
    root.mkdir(parents=True, exist_ok=True)
    artifact: dict[str, dict[str, object]] = {}
    for pack_name, rows in membership.items():
        pack_dir = root / pack_name
        pack_dir.mkdir(parents=True, exist_ok=True)
        files: list[str] = []
        for row in rows:
            source = Path(row.file_path)
            target = pack_dir / source.name
            if source.exists() and source.resolve() != target.resolve():
                shutil.copy2(source, target)
            files.append(str(target))
        artifact[pack_name] = {
            'reference_dir': str(pack_dir),
            'files': files,
        }
    return artifact


def build_policy_artifact(
    refpacks: dict[str, dict[str, object]],
    target_profile: str | Path,
    out_path: str | Path,
    *,
    policy_id: str = 'character_b_routed_policy_v1',
    source_policy_id: str | None = None,
    provisional: bool = True,
    xtts_preset: dict[str, object] | None = None,
    bucket_to_pack: dict[str, str] | None = None,
    bucket_prompt_variants: dict[str, str] | None = None,
    prompt_variants: dict[str, dict[str, str]] | None = None,
) -> Path:
    bucket_policies = {}
    for bucket, pack in (bucket_to_pack or DEFAULT_BUCKET_TO_PACK).items():
        bucket_policies[bucket] = {
            'ref_pack': pack,
            'prompt_variant': (bucket_prompt_variants or PROVISIONAL_BUCKET_VARIANTS).get(bucket, 'base'),
        }

    payload = {
        'policy_id': policy_id,
        'source_policy_id': source_policy_id or policy_id,
        'character': 'character_b',
        'provisional': provisional,
        'target_profile': str(target_profile),
        'xtts_preset': xtts_preset or DEFAULT_XTTS_PRESET,
        'refpacks': refpacks,
        'prompt_variants': prompt_variants or PROMPT_VARIANT_METADATA,
        'bucket_policies': bucket_policies,
    }
    path = Path(out_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding='utf-8')
    return path


def build_control_policy_artifact(
    manifest_path: str | Path,
    output_root: str | Path,
    target_profile: str | Path,
    out_path: str | Path,
) -> Path:
    from .profiles import build_profile

    membership = resolve_fixed_refpack_membership(manifest_path)
    refpacks = materialize_refpacks(membership, output_root)
    profiles_root = Path(output_root).parent.parent / 'profiles'
    profiles_root.mkdir(parents=True, exist_ok=True)
    for pack_name, payload in refpacks.items():
        profile_path = profiles_root / f'character_b_{pack_name}_profile.json'
        build_profile(payload['reference_dir'], profile_path)
        payload['profile_path'] = str(profile_path)

    return build_policy_artifact(
        refpacks,
        target_profile,
        out_path,
        policy_id='character_b_routed_policy_v2_control',
        source_policy_id='character_b_refpack_ablation_routed_control',
        provisional=False,
        xtts_preset=DEFAULT_XTTS_PRESET,
        bucket_to_pack=DEFAULT_BUCKET_TO_PACK,
        bucket_prompt_variants={bucket: 'base' for bucket in DEFAULT_BUCKET_TO_PACK},
    )
