from __future__ import annotations

import argparse
from pathlib import Path

from aro_voice_style_lab.character_b_policy import (
    annotate_delivery_tags,
    attach_profiles,
    build_policy_artifact,
    build_refpack_membership_from_manifest,
    load_named_refpack_file_map,
    materialize_named_refpacks,
    materialize_refpacks,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog='productize-character-b-policy')
    parser.add_argument('manifest_path')
    parser.add_argument('output_root')
    parser.add_argument('target_profile')
    parser.add_argument('policy_out')
    parser.add_argument('--fixed-refpacks-manifest', default=None)
    parser.add_argument('--policy-id', default='character_b_routed_policy_v1')
    parser.add_argument('--source-policy-id', default=None)
    parser.add_argument('--final', action='store_true')
    return parser


def main() -> None:
    args = build_parser().parse_args()
    if args.fixed_refpacks_manifest:
        refpacks = materialize_named_refpacks(load_named_refpack_file_map(args.fixed_refpacks_manifest), args.output_root)
    else:
        annotate_delivery_tags(args.manifest_path)
        membership = build_refpack_membership_from_manifest(args.manifest_path)
        refpacks = materialize_refpacks(membership, args.output_root)
    profiles_root = Path(args.output_root).parent.parent / 'profiles'
    attach_profiles(refpacks, profiles_root)
    policy_path = build_policy_artifact(
        refpacks,
        args.target_profile,
        args.policy_out,
        policy_id=args.policy_id,
        source_policy_id=args.source_policy_id,
        provisional=not args.final,
        refpack_manifest_path=args.fixed_refpacks_manifest,
    )
    print(policy_path)


if __name__ == '__main__':
    main()
