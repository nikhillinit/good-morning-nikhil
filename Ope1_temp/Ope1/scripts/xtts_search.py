from __future__ import annotations

import argparse
import json
from pathlib import Path

from aro_voice_style_lab.generation import generate_line
from aro_voice_style_lab.scoring import score_clip
from aro_voice_style_lab.xtts_presets import get_presets

PRESETS = get_presets()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="xtts-search")
    parser.add_argument("text")
    parser.add_argument("character_profile")
    parser.add_argument("target_profile")
    parser.add_argument("--backend", default="xtts-local")
    parser.add_argument("--language-code", default="en")
    parser.add_argument("--xtts-device", default="cpu")
    parser.add_argument("--xtts-worker-url", default=None)
    parser.add_argument("--reference-audio-path", action="append", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--summary-path", required=True)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    output_root = Path(args.output_dir)
    output_root.mkdir(parents=True, exist_ok=True)
    results = []

    for preset in PRESETS:
        preset_dir = output_root / preset["name"]
        generated = generate_line(
            text=args.text,
            character_profile=args.character_profile,
            substyle="neutral",
            n_variants=1,
            output_dir=preset_dir,
            backend_name=args.backend,
            backend_options={
                "language_code": args.language_code,
                "xtts_device": args.xtts_device,
                "xtts_worker_url": args.xtts_worker_url,
                "xtts_reference_audio_paths": args.reference_audio_path,
                **preset,
            },
        )
        candidate = generated[0]
        report_path = Path(args.summary_path).parent / f"{preset['name']}_report.json"
        score_clip(candidate, args.target_profile, report_path)
        payload = json.loads(report_path.read_text(encoding="utf-8"))
        results.append(
            {
                "preset": preset,
                "candidate_path": str(candidate),
                "report_path": str(report_path),
                "scores": payload["scores"],
            }
        )

    results.sort(key=lambda item: item["scores"]["overall_style_score"], reverse=True)
    summary = {
        "text": args.text,
        "character_profile": args.character_profile,
        "target_profile": args.target_profile,
        "backend": args.backend,
        "reference_audio_paths": args.reference_audio_path,
        "best_candidate": results[0],
        "all_candidates": results,
    }
    Path(args.summary_path).parent.mkdir(parents=True, exist_ok=True)
    Path(args.summary_path).write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(args.summary_path)


if __name__ == "__main__":
    main()
