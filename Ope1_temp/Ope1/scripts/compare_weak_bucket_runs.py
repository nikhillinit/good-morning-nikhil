from __future__ import annotations

import argparse

from aro_voice_style_lab.routed_policy import compare_weak_bucket_runs


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog='compare-weak-bucket-runs')
    parser.add_argument('control_summary')
    parser.add_argument('out_path')
    parser.add_argument('candidate_summaries', nargs='+')
    return parser


def main() -> None:
    args = build_parser().parse_args()
    out = compare_weak_bucket_runs(args.control_summary, args.candidate_summaries, args.out_path)
    print(out)


if __name__ == '__main__':
    main()
