from __future__ import annotations

import argparse

from aro_voice_style_lab.benchmark import compare_benchmark_runs


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="compare-benchmarks")
    parser.add_argument("local_summary")
    parser.add_argument("worker_summary")
    parser.add_argument("out_path")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    out = compare_benchmark_runs(args.local_summary, args.worker_summary, args.out_path)
    print(out)


if __name__ == "__main__":
    main()
