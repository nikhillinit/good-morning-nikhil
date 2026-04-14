from __future__ import annotations

import argparse

from aro_voice_style_lab.routed_policy import compare_routed_policy_candidates


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog='compare-routed-policy-candidates')
    parser.add_argument('control_summary')
    parser.add_argument('out_path')
    parser.add_argument('candidate_summaries', nargs='+')
    parser.add_argument('--bucket', dest='buckets', action='append', default=[])
    return parser


def main() -> None:
    args = build_parser().parse_args()
    out = compare_routed_policy_candidates(
        control_summary_path=args.control_summary,
        candidate_summary_paths=args.candidate_summaries,
        out_path=args.out_path,
        buckets=args.buckets,
    )
    print(out)


if __name__ == '__main__':
    main()
