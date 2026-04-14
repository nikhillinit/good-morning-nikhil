from __future__ import annotations

import csv
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path


SECTION_HEADER_RE = re.compile(r"^### \*\*(.+?)\*\*$")
TOP_LEVEL_FIELD_RE = re.compile(r"^\* \*\*(.+?):\*\*\s*(.*)$")
DIALOGUE_FIELD_RE = re.compile(r"^\s*\* \*\*(.+?):\*\*\s*(.*)$")
SCREEN_TITLE_RE = re.compile(r"^(?P<screen_id>SCREEN.*?)(?:\s+[—-]\s+)(?P<title>.+)$")
TIMING_RE = re.compile(r"(\d+(?:\.\d+)?)\s*s\b", flags=re.IGNORECASE)


@dataclass(slots=True)
class DialogueCue:
    cue_id: str
    screen_id: str
    screen_title: str
    speaker: str
    text: str
    order: int

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass(slots=True)
class ScreenSection:
    screen_id: str
    title: str
    art_visual_prompt: str = ""
    total_timing_sec: float | None = None
    ui_reveal: str = ""
    audio_lines: list[DialogueCue] | None = None

    def to_dict(self) -> dict:
        payload = asdict(self)
        payload["audio_lines"] = [cue.to_dict() for cue in self.audio_lines or []]
        return payload


def compile_shot_list(
    markdown_path: str | Path,
    output_json_path: str | Path | None = None,
    output_csv_path: str | Path | None = None,
) -> Path:
    markdown_path = Path(markdown_path)
    title, screens = parse_shot_list(markdown_path)

    dialogue_cues = [cue.to_dict() for screen in screens for cue in screen.audio_lines or []]
    payload = {
        "title": title,
        "source_path": str(markdown_path),
        "screen_count": len(screens),
        "dialogue_cue_count": len(dialogue_cues),
        "screens": [screen.to_dict() for screen in screens],
        "dialogue_cues": dialogue_cues,
    }

    json_path = Path(output_json_path) if output_json_path else markdown_path.with_name(f"{markdown_path.stem}_compiled.json")
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    if output_csv_path:
        write_dialogue_csv(dialogue_cues, output_csv_path)

    return json_path


def write_dialogue_csv(dialogue_cues: list[dict], output_csv_path: str | Path) -> Path:
    csv_path = Path(output_csv_path)
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["cue_id", "screen_id", "screen_title", "speaker", "text", "order"]
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in dialogue_cues:
            writer.writerow({key: row.get(key, "") for key in fieldnames})
    return csv_path


def parse_shot_list(markdown_path: str | Path) -> tuple[str, list[ScreenSection]]:
    lines = Path(markdown_path).read_text(encoding="utf-8").splitlines()
    title = ""
    sections: list[tuple[str, list[str]]] = []
    current_header: str | None = None
    current_lines: list[str] = []

    for raw_line in lines:
        line = raw_line.rstrip()
        if not title and line.startswith("# "):
            title = clean_inline_markup(line.removeprefix("# ").strip())
            continue

        header_match = SECTION_HEADER_RE.match(line)
        if header_match:
            if current_header is not None:
                sections.append((current_header, current_lines))
            current_header = clean_inline_markup(header_match.group(1))
            current_lines = []
            continue

        if current_header is not None:
            current_lines.append(line)

    if current_header is not None:
        sections.append((current_header, current_lines))

    return title, [parse_screen_section(header, body_lines) for header, body_lines in sections]


def parse_screen_section(header: str, body_lines: list[str]) -> ScreenSection:
    screen_id, title = split_screen_header(header)
    screen = ScreenSection(screen_id=screen_id, title=title, audio_lines=[])
    current_field: str | None = None
    current_dialogue: DialogueCue | None = None

    for line in body_lines:
        top_field = TOP_LEVEL_FIELD_RE.match(line)
        if top_field:
            current_field = normalize_field_name(top_field.group(1))
            current_dialogue = None
            raw_field_value = top_field.group(2)
            field_value = clean_inline_markup(raw_field_value)
            if current_field == "art_visual_prompt":
                screen.art_visual_prompt = field_value
            elif current_field == "total_timing":
                screen.total_timing_sec = parse_timing_seconds(field_value)
            elif current_field.startswith("ui_reveal"):
                screen.ui_reveal = field_value
            elif current_field == "audio_caption_text" and raw_field_value.strip():
                current_dialogue = append_dialogue_cue(screen, raw_field_value)
            continue

        if current_field == "audio_caption_text":
            if DIALOGUE_FIELD_RE.match(line):
                current_dialogue = append_dialogue_cue(screen, line)
                continue

            if current_dialogue and line.strip():
                current_dialogue.text = join_text(current_dialogue.text, clean_inline_markup(line))
            continue

        if current_field == "art_visual_prompt" and line.strip():
            screen.art_visual_prompt = join_text(screen.art_visual_prompt, clean_inline_markup(line))
        elif current_field == "ui_reveal" and line.strip():
            screen.ui_reveal = join_text(screen.ui_reveal, clean_inline_markup(line))

    return screen


def split_screen_header(header: str) -> tuple[str, str]:
    match = SCREEN_TITLE_RE.match(header)
    if match:
        return clean_inline_markup(match.group("screen_id")), clean_inline_markup(match.group("title"))
    return clean_inline_markup(header), ""


def normalize_field_name(label: str) -> str:
    normalized = clean_inline_markup(label).lower().replace("/", "_").replace(" ", "_")
    return re.sub(r"_+", "_", normalized).strip("_")


def append_dialogue_cue(screen: ScreenSection, raw_line: str) -> DialogueCue | None:
    candidate_line = raw_line.strip().replace("\\*", "*")
    dialogue_match = DIALOGUE_FIELD_RE.match(candidate_line)
    if not dialogue_match:
        return None
    speaker = clean_inline_markup(dialogue_match.group(1)).upper()
    text = clean_inline_markup(dialogue_match.group(2))
    cue = DialogueCue(
        cue_id=f"{slugify(screen.screen_id)}_line_{len(screen.audio_lines) + 1:02d}",
        screen_id=screen.screen_id,
        screen_title=screen.title,
        speaker=speaker,
        text=text,
        order=len(screen.audio_lines) + 1,
    )
    screen.audio_lines.append(cue)
    return cue


def parse_timing_seconds(value: str) -> float | None:
    match = TIMING_RE.search(value)
    return float(match.group(1)) if match else None


def clean_inline_markup(value: str) -> str:
    cleaned = value.replace("\\*", "*").replace("\\-", "-")
    cleaned = re.sub(r"!\[\]\[[^\]]+\]", "", cleaned)
    cleaned = re.sub(r"\[(.*?)\]\([^)]+\)", r"\1", cleaned)
    cleaned = cleaned.replace("**", "")
    replacements = {
        "\u2019": "'",
        "\u2018": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2026": "...",
        "\u2014": "-",
        "\u2013": "-",
        "\u00e9": "e",
        "\u00e0": "a",
        "â€™": "'",
        "â€œ": '"',
        "â€\x9d": '"',
        "â€¦": "...",
        "Ã©": "e",
        "Ã": "a",
    }
    for source, target in replacements.items():
        cleaned = cleaned.replace(source, target)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip(' "')


def join_text(existing: str, addition: str) -> str:
    if not existing:
        return addition
    if not addition:
        return existing
    return f"{existing} {addition}".strip()


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return slug or "screen"
