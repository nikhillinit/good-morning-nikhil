from __future__ import annotations

import argparse

from aro_voice_style_lab.routed_policy import compare_weak_bucket_variants


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog='compare-weak-bucket-variants')
    parser.add_argument('control_summary')
    parser.add_argument('out_path')
    parser.add_argument('--candidate', action='append', default=[])
    parser.add_argument('--bucket', action='append', default=[])
    return parser


def parse_candidate_pairs(values: list[str]) -> dict[str, str]:
    pairs: dict[str, str] = {}
    for value in values:
        if '=' not in value:
            raise ValueError(f'Invalid candidate format: {value}. Expected label=path.')
        label, path = value.split('=', 1)
        pairs[label] = path
    return pairs


def main() -> None:
    args = build_parser().parse_args()
    out = compare_weak_bucket_variants(
        control_summary_path=args.control_summary,
        candidate_summaries=parse_candidate_pairs(args.candidate),
        out_path=args.out_path,
        buckets=args.bucket,
    )
    print(out)


if __name__ == '__main__':
    main()
