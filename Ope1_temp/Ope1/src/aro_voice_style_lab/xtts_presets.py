from __future__ import annotations

XTTS_PRESETS = [
    {
        "name": "balanced",
        "xtts_split_sentences": "true",
        "xtts_enable_text_splitting": "false",
        "xtts_speed": 1.0,
        "xtts_temperature": 0.75,
        "xtts_length_penalty": 1.0,
        "xtts_repetition_penalty": 10.0,
        "xtts_top_k": 50,
        "xtts_top_p": 0.85,
    },
    {
        "name": "slower_connected",
        "xtts_split_sentences": "false",
        "xtts_enable_text_splitting": "false",
        "xtts_speed": 0.92,
        "xtts_temperature": 0.75,
        "xtts_length_penalty": 1.0,
        "xtts_repetition_penalty": 9.0,
        "xtts_top_k": 50,
        "xtts_top_p": 0.88,
    },
    {
        "name": "slower_looser",
        "xtts_split_sentences": "false",
        "xtts_enable_text_splitting": "false",
        "xtts_speed": 0.88,
        "xtts_temperature": 0.82,
        "xtts_length_penalty": 1.05,
        "xtts_repetition_penalty": 8.0,
        "xtts_top_k": 60,
        "xtts_top_p": 0.90,
    },
    {
        "name": "faster_tight",
        "xtts_split_sentences": "false",
        "xtts_enable_text_splitting": "false",
        "xtts_speed": 1.08,
        "xtts_temperature": 0.68,
        "xtts_length_penalty": 0.95,
        "xtts_repetition_penalty": 11.0,
        "xtts_top_k": 40,
        "xtts_top_p": 0.82,
    },
    {
        "name": "slower_split",
        "xtts_split_sentences": "true",
        "xtts_enable_text_splitting": "false",
        "xtts_speed": 0.90,
        "xtts_temperature": 0.72,
        "xtts_length_penalty": 1.05,
        "xtts_repetition_penalty": 10.0,
        "xtts_top_k": 55,
        "xtts_top_p": 0.86,
    },
    {
        "name": "looser_pause_bias",
        "xtts_split_sentences": "false",
        "xtts_enable_text_splitting": "false",
        "xtts_speed": 0.95,
        "xtts_temperature": 0.85,
        "xtts_length_penalty": 1.1,
        "xtts_repetition_penalty": 7.5,
        "xtts_top_k": 70,
        "xtts_top_p": 0.92,
    },
]

XTTS_BENCHMARK_PRESET_NAMES = [
    "balanced",
    "faster_tight",
    "slower_looser",
    "looser_pause_bias",
]


def get_presets(names: list[str] | None = None) -> list[dict[str, object]]:
    if not names:
        return [preset.copy() for preset in XTTS_PRESETS]
    name_set = set(names)
    return [preset.copy() for preset in XTTS_PRESETS if preset["name"] in name_set]
