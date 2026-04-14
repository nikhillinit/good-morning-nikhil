from __future__ import annotations

import argparse

from aro_voice_style_lab.routed_policy import run_weak_bucket_ablation


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog='run-character-b-weak-bucket-ablation')
    parser.add_argument('policy_path')
    parser.add_argument('suite_path')
    parser.add_argument('backend_name')
    parser.add_argument('output_root')
    parser.add_argument('report_root')
    parser.add_argument('--repeats', type=int, default=1)
    parser.add_argument('--language-code', default=None)
    parser.add_argument('--xtts-device', default=None)
    parser.add_argument('--xtts-worker-url', default=None)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    out = run_weak_bucket_ablation(
        policy_path=args.policy_path,
        suite_path=args.suite_path,
        backend_name=args.backend_name,
        backend_options={
            'language_code': args.language_code,
            'xtts_device': args.xtts_device,
            'xtts_worker_url': args.xtts_worker_url,
        },
        output_root=args.output_root,
        report_root=args.report_root,
        repeats=args.repeats,
    )
    print(out)


if __name__ == '__main__':
    main()
