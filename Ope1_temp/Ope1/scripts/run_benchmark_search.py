from __future__ import annotations

import argparse

from aro_voice_style_lab.benchmark_search import run_benchmark_search


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="run-benchmark-search")
    parser.add_argument("suite_path")
    parser.add_argument("character_profile")
    parser.add_argument("target_profile")
    parser.add_argument("backend_name")
    parser.add_argument("output_root")
    parser.add_argument("report_root")
    parser.add_argument("--language-code", default=None)
    parser.add_argument("--xtts-device", default=None)
    parser.add_argument("--xtts-worker-url", default=None)
    parser.add_argument("--reference-audio-path", action="append", required=True)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    out = run_benchmark_search(
        suite_path=args.suite_path,
        character_profile=args.character_profile,
        target_profile=args.target_profile,
        backend_name=args.backend_name,
        shared_backend_options={
            "language_code": args.language_code,
            "xtts_device": args.xtts_device,
            "xtts_worker_url": args.xtts_worker_url,
            "xtts_reference_audio_paths": args.reference_audio_path,
        },
        output_root=args.output_root,
        report_root=args.report_root,
    )
    print(out)


if __name__ == "__main__":
    main()
