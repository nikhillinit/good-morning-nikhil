from __future__ import annotations

import argparse

from aro_voice_style_lab.benchmark import run_benchmark


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="run-benchmark")
    parser.add_argument("suite_path")
    parser.add_argument("character_profile")
    parser.add_argument("target_profile")
    parser.add_argument("backend_name")
    parser.add_argument("output_root")
    parser.add_argument("report_root")
    parser.add_argument("--language-code", default=None)
    parser.add_argument("--xtts-device", default=None)
    parser.add_argument("--xtts-worker-url", default=None)
    parser.add_argument("--reference-audio-path", action="append", default=None)
    parser.add_argument("--xtts-split-sentences", default=None)
    parser.add_argument("--xtts-enable-text-splitting", default=None)
    parser.add_argument("--xtts-temperature", type=float, default=None)
    parser.add_argument("--xtts-length-penalty", type=float, default=None)
    parser.add_argument("--xtts-repetition-penalty", type=float, default=None)
    parser.add_argument("--xtts-top-k", type=int, default=None)
    parser.add_argument("--xtts-top-p", type=float, default=None)
    parser.add_argument("--xtts-speed", type=float, default=None)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    summary = run_benchmark(
        suite_path=args.suite_path,
        character_profile=args.character_profile,
        target_profile=args.target_profile,
        backend_name=args.backend_name,
        backend_options={
            "language_code": args.language_code,
            "xtts_device": args.xtts_device,
            "xtts_worker_url": args.xtts_worker_url,
            "xtts_reference_audio_paths": args.reference_audio_path,
            "xtts_split_sentences": args.xtts_split_sentences,
            "xtts_enable_text_splitting": args.xtts_enable_text_splitting,
            "xtts_temperature": args.xtts_temperature,
            "xtts_length_penalty": args.xtts_length_penalty,
            "xtts_repetition_penalty": args.xtts_repetition_penalty,
            "xtts_top_k": args.xtts_top_k,
            "xtts_top_p": args.xtts_top_p,
            "xtts_speed": args.xtts_speed,
        },
        output_root=args.output_root,
        report_root=args.report_root,
    )
    print(summary)


if __name__ == "__main__":
    main()
