from __future__ import annotations

import argparse
import json
from pathlib import Path

from aro_voice_style_lab.benchmark import load_benchmark_suite
from aro_voice_style_lab.routed_policy import run_routed_policy_benchmark


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog='run-routed-policy-benchmark')
    parser.add_argument('policy_path')
    parser.add_argument('suite_path')
    parser.add_argument('backend_name')
    parser.add_argument('output_root')
    parser.add_argument('report_root')
    parser.add_argument('--language-code', default=None)
    parser.add_argument('--xtts-device', default=None)
    parser.add_argument('--xtts-worker-url', default=None)
    parser.add_argument('--bucket', dest='buckets', action='append', default=[])
    return parser


def main() -> None:
    args = build_parser().parse_args()
    suite_override = None
    if args.buckets:
        suite = load_benchmark_suite(args.suite_path)
        bucket_set = set(args.buckets)
        suite_override = {
            **suite,
            'prompts': [prompt for prompt in suite['prompts'] if prompt['bucket'] in bucket_set],
        }
    out = run_routed_policy_benchmark(
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
        suite_override=suite_override,
    )
    print(out)


if __name__ == '__main__':
    main()
