from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from .generation import generate_line


@dataclass(slots=True)
class SpeakerRenderConfig:
    profile_path: str
    substyle: str = "neutral"


def render_shot_list(
    compiled_shot_list_path: str | Path,
    speaker_profiles: dict[str, SpeakerRenderConfig],
    output_dir: str | Path,
    *,
    backend_name: str | None = None,
    backend_options: dict | None = None,
    count: int = 1,
) -> Path:
    compiled_shot_list_path = Path(compiled_shot_list_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    payload = json.loads(compiled_shot_list_path.read_text(encoding="utf-8"))
    rendered_cues: list[dict] = []
    skipped_cues: list[dict] = []

    for cue in payload.get("dialogue_cues", []):
        speaker = str(cue["speaker"]).upper()
        config = speaker_profiles.get(speaker)
        if config is None:
            skipped_cues.append(
                {
                    "cue_id": cue["cue_id"],
                    "speaker": speaker,
                    "reason": "missing speaker mapping",
                }
            )
            continue

        cue_output_dir = output_dir / sanitize_segment(cue["screen_id"]) / cue["cue_id"]
        paths = generate_line(
            text=cue["text"],
            character_profile=config.profile_path,
            substyle=config.substyle,
            n_variants=count,
            output_dir=cue_output_dir,
            backend_name=backend_name,
            backend_options=backend_options,
        )
        rendered_cues.append(
            {
                "cue_id": cue["cue_id"],
                "screen_id": cue["screen_id"],
                "speaker": speaker,
                "text": cue["text"],
                "substyle": config.substyle,
                "output_paths": [str(path) for path in paths],
            }
        )

    summary = {
        "source_path": str(compiled_shot_list_path),
        "output_dir": str(output_dir),
        "rendered_count": len(rendered_cues),
        "skipped_count": len(skipped_cues),
        "rendered_cues": rendered_cues,
        "skipped_cues": skipped_cues,
    }
    summary_path = output_dir / "render_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return summary_path


def parse_speaker_profile_args(
    speaker_profile_args: list[str] | None,
    speaker_substyle_args: list[str] | None,
) -> dict[str, SpeakerRenderConfig]:
    profile_map: dict[str, SpeakerRenderConfig] = {}
    for raw_entry in speaker_profile_args or []:
        speaker, value = split_mapping_arg(raw_entry)
        profile_map[speaker.upper()] = SpeakerRenderConfig(profile_path=value)

    for raw_entry in speaker_substyle_args or []:
        speaker, substyle = split_mapping_arg(raw_entry)
        speaker = speaker.upper()
        if speaker not in profile_map:
            raise ValueError(f"Speaker substyle provided without profile mapping: {speaker}")
        profile_map[speaker].substyle = substyle

    return profile_map


def split_mapping_arg(raw_entry: str) -> tuple[str, str]:
    if "=" not in raw_entry:
        raise ValueError(f"Expected KEY=VALUE mapping, got: {raw_entry}")
    key, value = raw_entry.split("=", 1)
    key = key.strip()
    value = value.strip()
    if not key or not value:
        raise ValueError(f"Expected non-empty KEY=VALUE mapping, got: {raw_entry}")
    return key, value


def sanitize_segment(value: str) -> str:
    return "".join(character.lower() if character.isalnum() else "_" for character in value).strip("_")
