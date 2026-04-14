from __future__ import annotations

import argparse
import json

from .analysis import annotate_transcript, create_manifest, prepare_audio, segment_audio
from .demo import run_demo
from .generation import generate_line
from .routed_policy import generate_with_routed_policy
from .profiles import build_profile
from .scoring import score_clip
from .shot_list import compile_shot_list
from .shot_list_render import parse_speaker_profile_args, render_shot_list


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="aro-voice-style")
    subparsers = parser.add_subparsers(dest="command", required=True)

    manifest_parser = subparsers.add_parser("manifest", help="Create or refresh a character manifest CSV.")
    manifest_parser.add_argument("character_dir")

    prepare_parser = subparsers.add_parser("prepare-audio", help="Copy WAV files and optionally transcode compressed audio into processed WAVs.")
    prepare_parser.add_argument("character_dir")
    prepare_parser.add_argument("--processed-dir", default=None)
    prepare_parser.add_argument("--sample-rate", type=int, default=22050)
    prepare_parser.add_argument("--ffmpeg-path", default=None)

    segment_parser = subparsers.add_parser("segment-audio", help="Split processed WAV files into shorter profiling clips.")
    segment_parser.add_argument("character_dir")
    segment_parser.add_argument("--segmented-dir", default=None)
    segment_parser.add_argument("--min-segment-sec", type=float, default=2.0)
    segment_parser.add_argument("--max-segment-sec", type=float, default=12.0)
    segment_parser.add_argument("--min-silence-sec", type=float, default=0.35)
    segment_parser.add_argument("--padding-sec", type=float, default=0.12)

    transcript_parser = subparsers.add_parser("annotate-transcript", help="Apply a timestamped transcript to a segmented manifest.")
    transcript_parser.add_argument("character_dir")
    transcript_parser.add_argument("transcript_path")
    transcript_parser.add_argument("--manifest-path", default=None)
    transcript_parser.add_argument("--source-filter", default=None)

    shot_list_parser = subparsers.add_parser("compile-shot-list", help="Compile a markdown shot list into structured JSON and optional dialogue CSV.")
    shot_list_parser.add_argument("markdown_path")
    shot_list_parser.add_argument("--output-json", default=None)
    shot_list_parser.add_argument("--output-csv", default=None)

    render_shot_list_parser = subparsers.add_parser("render-shot-list", help="Batch-render dialogue cues from a compiled shot-list JSON.")
    render_shot_list_parser.add_argument("compiled_shot_list")
    render_shot_list_parser.add_argument("--speaker-profile", action="append", default=None, help="SPEAKER=path/to/profile.json")
    render_shot_list_parser.add_argument("--speaker-substyle", action="append", default=None, help="SPEAKER=substyle")
    render_shot_list_parser.add_argument("--output-dir", required=True)
    render_shot_list_parser.add_argument("--count", type=int, default=1)
    render_shot_list_parser.add_argument("--backend", default=None)
    render_shot_list_parser.add_argument("--project-id", default=None)
    render_shot_list_parser.add_argument("--language-code", default=None)
    render_shot_list_parser.add_argument("--voice-name", default=None)
    render_shot_list_parser.add_argument("--voice-cloning-key", default=None)
    render_shot_list_parser.add_argument("--reference-audio-path", action="append", default=None)
    render_shot_list_parser.add_argument("--consent-audio-path", default=None)
    render_shot_list_parser.add_argument("--xtts-model-name", default=None)
    render_shot_list_parser.add_argument("--xtts-device", default=None)
    render_shot_list_parser.add_argument("--xtts-worker-url", default=None)
    render_shot_list_parser.add_argument("--xtts-split-sentences", default=None)
    render_shot_list_parser.add_argument("--xtts-enable-text-splitting", default=None)
    render_shot_list_parser.add_argument("--xtts-temperature", type=float, default=None)
    render_shot_list_parser.add_argument("--xtts-length-penalty", type=float, default=None)
    render_shot_list_parser.add_argument("--xtts-repetition-penalty", type=float, default=None)
    render_shot_list_parser.add_argument("--xtts-top-k", type=int, default=None)
    render_shot_list_parser.add_argument("--xtts-top-p", type=float, default=None)
    render_shot_list_parser.add_argument("--xtts-speed", type=float, default=None)

    profile_parser = subparsers.add_parser("build-profile", help="Build a profile JSON from a character directory.")
    profile_parser.add_argument("character_dir")

    generate_parser = subparsers.add_parser("generate-line", help="Generate candidate clips from a profile.")
    generate_parser.add_argument("text")
    generate_parser.add_argument("character_profile")
    generate_parser.add_argument("--substyle", default="neutral")
    generate_parser.add_argument("--count", type=int, default=5)
    generate_parser.add_argument("--output-dir", default=None)
    generate_parser.add_argument("--backend", default=None)
    generate_parser.add_argument("--project-id", default=None)
    generate_parser.add_argument("--language-code", default=None)
    generate_parser.add_argument("--voice-name", default=None)
    generate_parser.add_argument("--voice-cloning-key", default=None)
    generate_parser.add_argument("--reference-audio-path", action="append", default=None)
    generate_parser.add_argument("--consent-audio-path", default=None)
    generate_parser.add_argument("--xtts-model-name", default=None)
    generate_parser.add_argument("--xtts-device", default=None)
    generate_parser.add_argument("--xtts-worker-url", default=None)
    generate_parser.add_argument("--xtts-split-sentences", default=None)
    generate_parser.add_argument("--xtts-enable-text-splitting", default=None)
    generate_parser.add_argument("--xtts-temperature", type=float, default=None)
    generate_parser.add_argument("--xtts-length-penalty", type=float, default=None)
    generate_parser.add_argument("--xtts-repetition-penalty", type=float, default=None)
    generate_parser.add_argument("--xtts-top-k", type=int, default=None)
    generate_parser.add_argument("--xtts-top-p", type=float, default=None)
    generate_parser.add_argument("--xtts-speed", type=float, default=None)


    routed_parser = subparsers.add_parser("generate-routed", help="Generate a clip using a routed policy artifact.")
    routed_parser.add_argument("policy_path")
    routed_parser.add_argument("bucket")
    routed_parser.add_argument("text")
    routed_parser.add_argument("--backend", default="xtts-local")
    routed_parser.add_argument("--output-dir", required=True)
    routed_parser.add_argument("--count", type=int, default=1)
    routed_parser.add_argument("--language-code", default=None)
    routed_parser.add_argument("--xtts-device", default=None)
    routed_parser.add_argument("--xtts-worker-url", default=None)

    score_parser = subparsers.add_parser("score-clip", help="Score a candidate clip against a profile.")
    score_parser.add_argument("candidate_wav")
    score_parser.add_argument("target_profile")
    score_parser.add_argument("--report-path", default=None)

    demo_parser = subparsers.add_parser("demo-run", help="Generate a synthetic demo corpus, profile, outputs, and reports.")
    demo_parser.add_argument("--project-root", default=".")
    demo_parser.add_argument("--line", default=None)
    demo_parser.add_argument("--count", type=int, default=3)
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "manifest":
        print(create_manifest(args.character_dir))
    elif args.command == "prepare-audio":
        print(json.dumps(prepare_audio(args.character_dir, args.processed_dir, args.sample_rate, args.ffmpeg_path), indent=2))
    elif args.command == "segment-audio":
        print(
            json.dumps(
                segment_audio(
                    args.character_dir,
                    segmented_dir=args.segmented_dir,
                    min_segment_sec=args.min_segment_sec,
                    max_segment_sec=args.max_segment_sec,
                    min_silence_sec=args.min_silence_sec,
                    padding_sec=args.padding_sec,
                ),
                indent=2,
            )
        )
    elif args.command == "annotate-transcript":
        print(
            json.dumps(
                annotate_transcript(
                    args.character_dir,
                    args.transcript_path,
                    manifest_path=args.manifest_path,
                    source_filter=args.source_filter,
                ),
                indent=2,
            )
        )
    elif args.command == "compile-shot-list":
        print(
            compile_shot_list(
                markdown_path=args.markdown_path,
                output_json_path=args.output_json,
                output_csv_path=args.output_csv,
            )
        )
    elif args.command == "render-shot-list":
        speaker_profiles = parse_speaker_profile_args(args.speaker_profile, args.speaker_substyle)
        print(
            render_shot_list(
                compiled_shot_list_path=args.compiled_shot_list,
                speaker_profiles=speaker_profiles,
                output_dir=args.output_dir,
                count=args.count,
                backend_name=args.backend,
                backend_options={
                    "project_id": args.project_id,
                    "language_code": args.language_code,
                    "voice_name": args.voice_name,
                    "voice_cloning_key": args.voice_cloning_key,
                    "reference_audio_path": args.reference_audio_path[0] if args.reference_audio_path else None,
                    "consent_audio_path": args.consent_audio_path,
                    "xtts_reference_audio_paths": args.reference_audio_path,
                    "xtts_model_name": args.xtts_model_name,
                    "xtts_device": args.xtts_device,
                    "xtts_worker_url": args.xtts_worker_url,
                    "xtts_split_sentences": args.xtts_split_sentences,
                    "xtts_enable_text_splitting": args.xtts_enable_text_splitting,
                    "xtts_temperature": args.xtts_temperature,
                    "xtts_length_penalty": args.xtts_length_penalty,
                    "xtts_repetition_penalty": args.xtts_repetition_penalty,
                    "xtts_top_k": args.xtts_top_k,
                    "xtts_top_p": args.xtts_top_p,
                    "xtts_speed": args.xtts_speed,
                },
            )
        )
    elif args.command == "build-profile":
        print(build_profile(args.character_dir))
    elif args.command == "generate-line":
        paths = generate_line(
            text=args.text,
            character_profile=args.character_profile,
            substyle=args.substyle,
            n_variants=args.count,
            output_dir=args.output_dir,
            backend_name=args.backend,
            backend_options={
                "project_id": args.project_id,
                "language_code": args.language_code,
                "voice_name": args.voice_name,
                "voice_cloning_key": args.voice_cloning_key,
                "reference_audio_path": args.reference_audio_path[0] if args.reference_audio_path else None,
                "consent_audio_path": args.consent_audio_path,
                "xtts_reference_audio_paths": args.reference_audio_path,
                "xtts_model_name": args.xtts_model_name,
                "xtts_device": args.xtts_device,
                "xtts_worker_url": args.xtts_worker_url,
                "xtts_split_sentences": args.xtts_split_sentences,
                "xtts_enable_text_splitting": args.xtts_enable_text_splitting,
                "xtts_temperature": args.xtts_temperature,
                "xtts_length_penalty": args.xtts_length_penalty,
                "xtts_repetition_penalty": args.xtts_repetition_penalty,
                "xtts_top_k": args.xtts_top_k,
                "xtts_top_p": args.xtts_top_p,
                "xtts_speed": args.xtts_speed,
            },
        )
        for path in paths:
            print(path)
    elif args.command == "generate-routed":
        paths = generate_with_routed_policy(
            policy_path=args.policy_path,
            bucket=args.bucket,
            text=args.text,
            backend_name=args.backend,
            backend_options={
                "language_code": args.language_code,
                "xtts_device": args.xtts_device,
                "xtts_worker_url": args.xtts_worker_url,
            },
            output_dir=args.output_dir,
            count=args.count,
        )
        for path in paths:
            print(path)
    elif args.command == "score-clip":
        print(score_clip(args.candidate_wav, args.target_profile, args.report_path))
    elif args.command == "demo-run":
        print(run_demo(args.project_root, line=args.line, n_variants=args.count))


if __name__ == "__main__":
    main()
