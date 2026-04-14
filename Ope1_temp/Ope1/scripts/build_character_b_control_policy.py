from __future__ import annotations

import argparse

from aro_voice_style_lab.character_b_policy import build_control_policy_artifact


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog='build-character-b-control-policy')
    parser.add_argument('manifest_path')
    parser.add_argument('output_root')
    parser.add_argument('target_profile')
    parser.add_argument('policy_out')
    return parser


def main() -> None:
    args = build_parser().parse_args()
    out = build_control_policy_artifact(
        manifest_path=args.manifest_path,
        output_root=args.output_root,
        target_profile=args.target_profile,
        out_path=args.policy_out,
    )
    print(out)


if __name__ == '__main__':
    main()
