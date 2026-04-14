from __future__ import annotations

import csv
import json
from pathlib import Path

from aro_voice_style_lab.shot_list import compile_shot_list, parse_shot_list


def test_parse_shot_list_extracts_screens_and_dialogue(tmp_path: Path) -> None:
    markdown_path = tmp_path / "shot_list.md"
    markdown_path.write_text(
        """# **GOOD MORNING, NIKHIL: Master Shot List**

### **SCREEN 0 - COLD OPEN**

* **Art/Visual Prompt:** A loud logo lands on screen.
* **Total Timing:** 10.0s (Fast cuts)
* **Audio / Caption Text:** \\* **STEVE:** "All right, final round."
  * **JEFF:** "Ahhh... you can use the computer for secrets."
  * **STEVE:** "![][image1]
    Oh my God. Wrong again!"
* **UI Reveal (at 10.0s):** Start Episode button appears.

### **SCREEN 1 - WELCOME**

* **Art/Visual Prompt:** Morning desk, cheap lighting.
* **Total Timing:** 4.0s
* **Audio / Caption Text:**
  * **STEVE:** "Welcome to Good Morning, Nikhil."
  * **JEFF:** "I had another thought, Stevie."
* **UI Reveal (at 4.0s):** Continue button.
""",
        encoding="utf-8",
    )

    title, screens = parse_shot_list(markdown_path)

    assert title == "GOOD MORNING, NIKHIL: Master Shot List"
    assert len(screens) == 2
    assert screens[0].screen_id == "SCREEN 0"
    assert screens[0].title == "COLD OPEN"
    assert screens[0].total_timing_sec == 10.0
    assert screens[0].audio_lines[0].speaker == "STEVE"
    assert screens[0].audio_lines[0].text == "All right, final round."
    assert screens[0].audio_lines[2].text == "Oh my God. Wrong again!"
    assert screens[1].ui_reveal == "Continue button."


def test_compile_shot_list_writes_json_and_csv(tmp_path: Path) -> None:
    markdown_path = tmp_path / "shot_list.md"
    json_path = tmp_path / "compiled.json"
    csv_path = tmp_path / "dialogue.csv"
    markdown_path.write_text(
        """# **Sample**

### **SCREEN 2 - TEST**

* **Art/Visual Prompt:** Zoom on Steve.
* **Total Timing:** 3.0s
* **Audio / Caption Text:**
  * **STEVE:** "First things first."
  * **JEFF:** "Family, foe, witness, or lover."
* **UI Reveal (at 3.0s):** Multiple choice options.
""",
        encoding="utf-8",
    )

    result = compile_shot_list(markdown_path, output_json_path=json_path, output_csv_path=csv_path)

    assert result == json_path
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    assert payload["screen_count"] == 1
    assert payload["dialogue_cue_count"] == 2
    assert payload["screens"][0]["screen_id"] == "SCREEN 2"
    assert payload["dialogue_cues"][1]["speaker"] == "JEFF"

    with csv_path.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))

    assert len(rows) == 2
    assert rows[0]["cue_id"] == "screen_2_line_01"
    assert rows[1]["text"] == "Family, foe, witness, or lover."
