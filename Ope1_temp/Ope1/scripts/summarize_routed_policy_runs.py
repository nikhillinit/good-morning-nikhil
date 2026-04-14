from __future__ import annotations

import argparse
import json

from aro_voice_style_lab.routed_policy import summarize_routed_policy_runs


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog='summarize-routed-policy-runs')
    parser.add_argument('policy_path')
    parser.add_argument('local_summary')
    parser.add_argument('worker_summary')
    parser.add_argument('worker_validation')
    parser.add_argument('out_path')
    parser.add_argument('--previous-best-summary-json', default=None)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    previous_best = json.loads(args.previous_best_summary_json) if args.previous_best_summary_json else None
    out = summarize_routed_policy_runs(
        policy_path=args.policy_path,
        local_summary_path=args.local_summary,
        worker_summary_path=args.worker_summary,
        worker_validation_path=args.worker_validation,
        out_path=args.out_path,
        previous_best_monolithic=previous_best,
    )
    print(out)


if __name__ == '__main__':
    main()
