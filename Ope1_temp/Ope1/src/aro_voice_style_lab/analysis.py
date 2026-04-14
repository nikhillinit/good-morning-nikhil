from __future__ import annotations

import csv
import json
import math
import os
import re
import shutil
import subprocess
import wave
from dataclasses import asdict
from pathlib import Path

import numpy as np

from .models import ManifestRow, UtteranceFeatures, ensure_path

SUPPORTED_AUDIO_SUFFIXES = {".wav", ".wave", ".m4a", ".mp3", ".flac"}
WAV_SUFFIXES = {".wav", ".wave"}
TIMECODE_RE = re.compile(
    r"^\s*(?P<start>\d+:\d{2}(?::\d{2})?(?:\.\d+)?)\s*-\s*(?P<end>\d+:\d{2}(?::\d{2})?(?:\.\d+)?)\s*(?P<text>.*)$"
)
EPSILON = 1e-8


class UnsupportedAudioFormatError(ValueError):
    """Raised when the MVP cannot deeply analyze a given audio format."""


def scan_character_dir(character_dir: str | Path) -> list[Path]:
    base = ensure_path(character_dir)
    return sorted(
        path for path in base.rglob("*") if path.is_file() and path.suffix.lower() in SUPPORTED_AUDIO_SUFFIXES
    )


def create_manifest(character_dir: str | Path, manifest_path: str | Path | None = None) -> Path:
    base = ensure_path(character_dir)
    character = base.name
    files = scan_character_dir(base)
    target = ensure_path(manifest_path) if manifest_path else base.parents[1] / "manifests" / f"{character}.csv"
    target.parent.mkdir(parents=True, exist_ok=True)

    with target.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=ManifestRow.csv_headers())
        writer.writeheader()
        for path in files:
            row = ManifestRow(
                file_path=str(path),
                character=character,
                source=path.stem,
                duration_sec=probe_duration(path),
            )
            writer.writerow(asdict(row))
    return target


def write_manifest(manifest_path: str | Path, rows: list[ManifestRow]) -> Path:
    path = ensure_path(manifest_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=ManifestRow.csv_headers())
        writer.writeheader()
        for row in rows:
            writer.writerow(asdict(row))
    return path


def prepare_audio(
    character_dir: str | Path,
    processed_dir: str | Path | None = None,
    sample_rate: int = 22050,
    ffmpeg_path: str | None = None,
) -> dict[str, object]:
    base = ensure_path(character_dir)
    character = base.name
    target_dir = ensure_path(processed_dir) if processed_dir else base.parents[1] / "processed" / character
    target_dir.mkdir(parents=True, exist_ok=True)

    resolved_ffmpeg = ffmpeg_path or find_ffmpeg()
    result: dict[str, object] = {
        "character": character,
        "processed_dir": str(target_dir),
        "copied": [],
        "converted": [],
        "skipped": [],
        "ffmpeg": resolved_ffmpeg,
    }

    for source in scan_character_dir(base):
        relative = source.relative_to(base)
        target = (target_dir / relative).with_suffix(".wav")
        target.parent.mkdir(parents=True, exist_ok=True)

        if source.suffix.lower() in WAV_SUFFIXES:
            shutil.copy2(source, target)
            result["copied"].append(str(target))
            continue

        if not resolved_ffmpeg:
            result["skipped"].append({"file": str(source), "reason": "ffmpeg not available for compressed audio"})
            continue

        command = [resolved_ffmpeg, "-y", "-i", str(source), "-ac", "1", "-ar", str(sample_rate), str(target)]
        completed = subprocess.run(command, capture_output=True, text=True)
        if completed.returncode == 0:
            result["converted"].append(str(target))
        else:
            result["skipped"].append(
                {
                    "file": str(source),
                    "reason": "ffmpeg conversion failed",
                    "detail": (completed.stderr or completed.stdout).strip()[:500],
                }
            )

    return result


def segment_audio(
    character_dir: str | Path,
    segmented_dir: str | Path | None = None,
    min_segment_sec: float = 2.0,
    max_segment_sec: float = 12.0,
    min_silence_sec: float = 0.35,
    padding_sec: float = 0.12,
) -> dict[str, object]:
    base = ensure_path(character_dir)
    character = base.name
    target_dir = ensure_path(segmented_dir) if segmented_dir else base.parent / f"{character}_segments"
    target_dir.mkdir(parents=True, exist_ok=True)

    result: dict[str, object] = {
        "character": character,
        "segmented_dir": str(target_dir),
        "segments": [],
        "skipped": [],
    }

    for source in scan_character_dir(base):
        if source.suffix.lower() not in WAV_SUFFIXES:
            result["skipped"].append({"file": str(source), "reason": "segmentation expects WAV input"})
            continue

        samples, sample_rate = load_wav(source)
        windows = detect_segment_windows(
            samples,
            sample_rate,
            min_segment_sec=min_segment_sec,
            max_segment_sec=max_segment_sec,
            min_silence_sec=min_silence_sec,
            padding_sec=padding_sec,
        )
        if not windows:
            result["skipped"].append({"file": str(source), "reason": "no valid segment windows found"})
            continue

        for index, (start, stop) in enumerate(windows, start=1):
            output_path = target_dir / f"{source.stem}_seg_{index:03d}.wav"
            write_wav(output_path, samples[start:stop], sample_rate)
            payload = {
                "file": str(output_path),
                "source": str(source),
                "source_stem": source.stem,
                "start_sec": round(start / sample_rate, 3),
                "end_sec": round(stop / sample_rate, 3),
                "duration_sec": round((stop - start) / sample_rate, 3),
            }
            output_path.with_suffix(".json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
            result["segments"].append(payload)

    return result


def annotate_transcript(
    character_dir: str | Path,
    transcript_path: str | Path,
    manifest_path: str | Path | None = None,
    source_filter: str | None = None,
) -> dict[str, object]:
    base = ensure_path(character_dir)
    manifest = ensure_path(manifest_path) if manifest_path else base.parents[1] / "manifests" / f"{base.name}.csv"
    if not manifest.exists():
        create_manifest(base, manifest)

    rows = load_manifest(manifest)
    blocks = parse_timestamped_transcript(transcript_path)
    updated = 0
    for row in rows:
        sidecar = Path(row.file_path).with_suffix(".json")
        if not sidecar.exists():
            continue
        metadata = json.loads(sidecar.read_text(encoding="utf-8"))
        if source_filter and metadata.get("source_stem") != source_filter:
            continue
        transcript = transcript_for_window(blocks, float(metadata["start_sec"]), float(metadata["end_sec"]))
        if transcript:
            row.transcript = transcript
            updated += 1
    write_manifest(manifest, rows)
    return {
        "manifest_path": str(manifest),
        "transcript_path": str(ensure_path(transcript_path)),
        "updated_rows": updated,
        "block_count": len(blocks),
        "source_filter": source_filter,
    }


def parse_timestamped_transcript(transcript_path: str | Path) -> list[dict[str, object]]:
    lines = ensure_path(transcript_path).read_text(encoding="utf-8").splitlines()
    blocks: list[dict[str, object]] = []
    current: dict[str, object] | None = None
    text_lines: list[str] = []

    for line in lines:
        match = TIMECODE_RE.match(line)
        if match:
            inline_text = normalize_transcript_text(match.group("text"))
            if current is not None:
                current["text"] = normalize_transcript_text(" ".join(text_lines))
                if current["text"]:
                    blocks.append(current)
                current = None
                text_lines = []
            if inline_text:
                blocks.append(
                    {
                        "start_sec": parse_timecode(match.group("start")),
                        "end_sec": parse_timecode(match.group("end")),
                        "text": inline_text,
                    }
                )
            else:
                current = {
                    "start_sec": parse_timecode(match.group("start")),
                    "end_sec": parse_timecode(match.group("end")),
                }
            continue
        if current is None:
            continue
        if line.strip():
            text_lines.append(line.strip())
    if current is not None:
        current["text"] = normalize_transcript_text(" ".join(text_lines))
        if current["text"]:
            blocks.append(current)
    return blocks


def transcript_for_window(blocks: list[dict[str, object]], start_sec: float, end_sec: float) -> str:
    snippets: list[str] = []
    for block in blocks:
        block_start = float(block["start_sec"])
        block_end = float(block["end_sec"])
        overlap_start = max(start_sec, block_start)
        overlap_end = min(end_sec, block_end)
        if overlap_end < overlap_start:
            continue
        text = slice_transcript_words(str(block["text"]), block_start, block_end, overlap_start, overlap_end)
        if text:
            snippets.append(text)
    return normalize_transcript_text(" ".join(snippets))


def slice_transcript_words(
    text: str,
    block_start: float,
    block_end: float,
    overlap_start: float,
    overlap_end: float,
) -> str:
    words = text.split()
    if not words:
        return ""
    duration = max(block_end - block_start, EPSILON)
    if overlap_end == overlap_start:
        if block_start == overlap_start:
            return " ".join(words[:1])
        return ""
    start_ratio = max(0.0, min(1.0, (overlap_start - block_start) / duration))
    end_ratio = max(0.0, min(1.0, (overlap_end - block_start) / duration))
    start_index = min(len(words) - 1, int(math.floor(start_ratio * len(words))))
    end_index = max(start_index + 1, int(math.ceil(end_ratio * len(words))))
    return " ".join(words[start_index:end_index]).strip()


def normalize_transcript_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def parse_timecode(value: str) -> float:
    parts = value.split(":")
    if len(parts) == 2:
        minutes, seconds = parts
        return (int(minutes) * 60) + float(seconds)
    if len(parts) == 3:
        hours, minutes, seconds = parts
        return (int(hours) * 3600) + (int(minutes) * 60) + float(seconds)
    raise ValueError(f"Unsupported timecode: {value}")


def detect_segment_windows(
    samples: np.ndarray,
    sample_rate: int,
    min_segment_sec: float,
    max_segment_sec: float,
    min_silence_sec: float,
    padding_sec: float,
) -> list[tuple[int, int]]:
    frame_size = max(int(sample_rate * 0.03), 1)
    hop_size = max(int(sample_rate * 0.01), 1)
    frames = frame_signal(samples, frame_size, hop_size)
    rms = np.sqrt(np.mean(frames**2, axis=1) + EPSILON)
    threshold = max(float(np.percentile(rms, 25)), float(np.mean(rms) * 0.35), 0.008)
    voiced_mask = rms > threshold

    voiced_ranges = contiguous_true_ranges(voiced_mask)
    if not voiced_ranges:
        return fallback_windows(len(samples), sample_rate, max_segment_sec)

    merged_ranges: list[tuple[int, int]] = []
    for start_frame, end_frame in voiced_ranges:
        start_sample = max(0, start_frame * hop_size - int(padding_sec * sample_rate))
        end_sample = min(len(samples), end_frame * hop_size + int(padding_sec * sample_rate))
        if not merged_ranges:
            merged_ranges.append((start_sample, end_sample))
            continue
        gap = start_sample - merged_ranges[-1][1]
        if gap / sample_rate < min_silence_sec:
            merged_ranges[-1] = (merged_ranges[-1][0], end_sample)
        else:
            merged_ranges.append((start_sample, end_sample))

    windows: list[tuple[int, int]] = []
    min_samples = int(min_segment_sec * sample_rate)
    max_samples = int(max_segment_sec * sample_rate)
    for start_sample, end_sample in merged_ranges:
        if end_sample - start_sample < min_samples:
            continue
        cursor = start_sample
        while cursor < end_sample:
            stop = min(cursor + max_samples, end_sample)
            if stop - cursor >= min_samples:
                windows.append((cursor, stop))
            cursor = stop

    return windows if windows else fallback_windows(len(samples), sample_rate, max_segment_sec, min_segment_sec)


def fallback_windows(
    sample_count: int,
    sample_rate: int,
    max_segment_sec: float,
    min_segment_sec: float = 2.0,
) -> list[tuple[int, int]]:
    max_samples = int(max_segment_sec * sample_rate)
    min_samples = int(min_segment_sec * sample_rate)
    windows: list[tuple[int, int]] = []
    cursor = 0
    while cursor < sample_count:
        stop = min(cursor + max_samples, sample_count)
        if stop - cursor >= min_samples:
            windows.append((cursor, stop))
        cursor = stop
    return windows


def contiguous_true_ranges(mask: np.ndarray) -> list[tuple[int, int]]:
    ranges: list[tuple[int, int]] = []
    start: int | None = None
    for index, value in enumerate(mask):
        if value and start is None:
            start = index
        elif not value and start is not None:
            ranges.append((start, index))
            start = None
    if start is not None:
        ranges.append((start, len(mask)))
    return ranges


def find_ffmpeg() -> str | None:
    for env_key in ("ARO_VOICE_STYLE_FFMPEG", "FFMPEG_PATH"):
        configured = os.environ.get(env_key)
        if configured and Path(configured).exists():
            return configured

    candidate = shutil.which("ffmpeg")
    return candidate if candidate else None


def load_manifest(manifest_path: str | Path) -> list[ManifestRow]:
    path = ensure_path(manifest_path)
    rows: list[ManifestRow] = []
    with path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for raw in reader:
            rows.append(
                ManifestRow(
                    file_path=raw["file_path"],
                    character=raw["character"],
                    source=raw["source"],
                    duration_sec=_float_or_none(raw.get("duration_sec")),
                    quality_score=_float_or_none(raw.get("quality_score")),
                    emotion_tag=raw.get("emotion_tag") or "unknown",
                    style_tag=raw.get("style_tag") or "neutral",
                    delivery_tags=raw.get("delivery_tags") or "",
                    transcript=raw.get("transcript") or "",
                    keep_flag=str(raw.get("keep_flag", "true")).strip().lower() in {"1", "true", "yes", "y"},
                )
            )
    return rows


def probe_duration(audio_path: str | Path) -> float | None:
    path = ensure_path(audio_path)
    if path.suffix.lower() in WAV_SUFFIXES:
        with wave.open(str(path), "rb") as handle:
            frames = handle.getnframes()
            sample_rate = handle.getframerate()
        if sample_rate <= 0:
            return None
        return round(frames / sample_rate, 4)
    return None


def extract_features(audio_path: str | Path, transcript: str = "") -> UtteranceFeatures:
    path = ensure_path(audio_path)
    if path.suffix.lower() not in WAV_SUFFIXES:
        raise UnsupportedAudioFormatError(
            f"{path.suffix} is not deeply supported yet. Transcode to WAV or add optional audio backends."
        )

    samples, sample_rate = load_wav(path)
    if samples.size == 0:
        return UtteranceFeatures()

    frame_size = max(int(sample_rate * 0.03), 1)
    hop_size = max(int(sample_rate * 0.01), 1)
    frames = frame_signal(samples, frame_size, hop_size)
    rms = np.sqrt(np.mean(frames**2, axis=1) + EPSILON)
    intensity_db = 20.0 * np.log10(rms + EPSILON)

    energy_threshold = max(float(np.percentile(rms, 20)), 0.01)
    voiced_mask = rms > energy_threshold
    pause_mask = ~voiced_mask
    pause_lengths = contiguous_lengths(pause_mask) * hop_size / sample_rate
    pause_lengths = pause_lengths[pause_lengths >= 0.05]

    f0_values, hnr_values = estimate_f0_and_hnr(frames, sample_rate, voiced_mask)
    pitch_periods = np.divide(1.0, f0_values, out=np.zeros_like(f0_values), where=f0_values > 0)

    mean_pause_ms = float(np.mean(pause_lengths) * 1000.0) if pause_lengths.size else 0.0
    max_pause_ms = float(np.max(pause_lengths) * 1000.0) if pause_lengths.size else 0.0
    long_pause_ratio = float(np.mean(pause_lengths >= 0.35)) if pause_lengths.size else 0.0
    silence_ratio = float(np.mean(pause_mask))

    speech_rate = estimate_speech_rate(transcript, probe_duration(path) or 0.0, rms, voiced_mask)
    spectral_centroid, spectral_rolloff, mfcc_mean, mfcc_std = spectral_summary(frames, sample_rate)
    burstiness = float(np.std(rms) / (np.mean(rms) + EPSILON))

    return UtteranceFeatures(
        f0_mean_hz=float(np.mean(f0_values)) if f0_values.size else 0.0,
        f0_median_hz=float(np.median(f0_values)) if f0_values.size else 0.0,
        f0_std_hz=float(np.std(f0_values)) if f0_values.size else 0.0,
        f0_range_hz=float(np.subtract(*np.percentile(f0_values, [75, 25]))) if f0_values.size else 0.0,
        intensity_mean_db=float(np.mean(intensity_db[voiced_mask])) if np.any(voiced_mask) else 0.0,
        intensity_std_db=float(np.std(intensity_db[voiced_mask])) if np.any(voiced_mask) else 0.0,
        jitter_local=estimate_jitter(pitch_periods),
        shimmer_local_db=estimate_shimmer(rms[voiced_mask]),
        hnr_db=float(np.mean(hnr_values)) if hnr_values.size else 0.0,
        voiced_ratio=float(np.mean(voiced_mask)),
        speech_rate_syllables_per_sec=speech_rate,
        pause_rate_per_min=float((pause_lengths.size / max(probe_duration(path) or 1.0, 1e-6)) * 60.0),
        mean_pause_ms=mean_pause_ms,
        max_pause_ms=max_pause_ms,
        long_pause_ratio=long_pause_ratio,
        silence_ratio=silence_ratio,
        spectral_centroid_hz=spectral_centroid,
        spectral_rolloff_hz=spectral_rolloff,
        burstiness=burstiness,
        final_pitch_delta_hz=estimate_final_pitch_delta(f0_values),
        mfcc_mean=mfcc_mean,
        mfcc_std=mfcc_std,
    )


def load_wav(audio_path: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(audio_path), "rb") as handle:
        sample_rate = handle.getframerate()
        sample_width = handle.getsampwidth()
        n_channels = handle.getnchannels()
        raw = handle.readframes(handle.getnframes())

    if sample_width != 2:
        raise ValueError("The MVP expects 16-bit PCM WAV files.")

    samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32)
    if n_channels > 1:
        samples = samples.reshape(-1, n_channels).mean(axis=1)
    samples /= 32768.0
    return samples, sample_rate


def write_wav(path: Path, waveform: np.ndarray, sample_rate: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = np.clip(waveform * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes(pcm.tobytes())


def frame_signal(samples: np.ndarray, frame_size: int, hop_size: int) -> np.ndarray:
    if samples.size < frame_size:
        padding = np.zeros(frame_size - samples.size, dtype=np.float32)
        return np.concatenate([samples, padding])[None, :]
    count = 1 + (samples.size - frame_size) // hop_size
    return np.stack([samples[i * hop_size : i * hop_size + frame_size] for i in range(count)])


def contiguous_lengths(mask: np.ndarray) -> np.ndarray:
    lengths: list[int] = []
    current = 0
    for value in mask:
        if value:
            current += 1
        elif current:
            lengths.append(current)
            current = 0
    if current:
        lengths.append(current)
    return np.asarray(lengths, dtype=np.float32)


def estimate_f0_and_hnr(frames: np.ndarray, sample_rate: int, voiced_mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    f0_values: list[float] = []
    hnr_values: list[float] = []
    min_lag = max(int(sample_rate / 400), 1)
    max_lag = max(int(sample_rate / 60), min_lag + 1)

    for frame, voiced in zip(frames, voiced_mask, strict=False):
        if not voiced:
            continue
        centered = frame - np.mean(frame)
        if np.allclose(centered, 0.0):
            continue
        autocorr = np.correlate(centered, centered, mode="full")[centered.size - 1 :]
        window = autocorr[min_lag:max_lag]
        if window.size == 0:
            continue
        best_index = int(np.argmax(window))
        best_value = float(window[best_index])
        lag = best_index + min_lag
        if best_value <= 0.0 or lag <= 0:
            continue
        f0_values.append(sample_rate / lag)
        zero_lag = float(autocorr[0]) + EPSILON
        ratio = max(min(best_value / zero_lag, 0.999999), EPSILON)
        hnr_values.append(10.0 * math.log10(ratio / (1.0 - ratio)))

    return np.asarray(f0_values, dtype=np.float32), np.asarray(hnr_values, dtype=np.float32)


def estimate_jitter(periods: np.ndarray) -> float:
    if periods.size < 2:
        return 0.0
    diffs = np.abs(np.diff(periods))
    denom = np.maximum(periods[:-1], EPSILON)
    return float(np.mean(diffs / denom))


def estimate_shimmer(rms: np.ndarray) -> float:
    if rms.size < 2:
        return 0.0
    ratios = np.maximum(rms[1:], EPSILON) / np.maximum(rms[:-1], EPSILON)
    return float(np.mean(np.abs(20.0 * np.log10(ratios))))


def estimate_speech_rate(
    transcript: str,
    duration_sec: float,
    rms: np.ndarray,
    voiced_mask: np.ndarray,
) -> float:
    if duration_sec <= 0.0:
        return 0.0
    cleaned = transcript.strip()
    if cleaned:
        syllables = count_syllables(cleaned)
        return syllables / duration_sec if duration_sec else 0.0

    threshold = float(np.mean(rms[voiced_mask])) if np.any(voiced_mask) else float(np.mean(rms))
    onsets = np.diff((rms > threshold).astype(int), prepend=0)
    onset_count = int(np.sum(onsets > 0))
    return max(onset_count / duration_sec, 0.0)


def count_syllables(text: str) -> int:
    vowels = "aeiouy"
    count = 0
    previous_vowel = False
    for character in text.lower():
        is_vowel = character in vowels
        if is_vowel and not previous_vowel:
            count += 1
        previous_vowel = is_vowel
    return max(count, 1)


def spectral_summary(frames: np.ndarray, sample_rate: int) -> tuple[float, float, list[float], list[float]]:
    spectrum = np.abs(np.fft.rfft(frames, axis=1))
    freqs = np.fft.rfftfreq(frames.shape[1], d=1.0 / sample_rate)
    energy = np.maximum(np.sum(spectrum, axis=1, keepdims=True), EPSILON)
    centroid = np.sum(spectrum * freqs[None, :], axis=1) / energy[:, 0]

    cdf = np.cumsum(spectrum, axis=1)
    rolloff_threshold = cdf[:, -1][:, None] * 0.85
    rolloff_index = np.argmax(cdf >= rolloff_threshold, axis=1)
    rolloff = freqs[rolloff_index]

    band_count = 26
    coeff_count = 13
    bands = np.array_split(spectrum, band_count, axis=1)
    band_energy = np.stack([np.log(np.mean(band, axis=1) + EPSILON) for band in bands], axis=1)
    basis = dct_basis(band_count, coeff_count)
    coeffs = band_energy @ basis.T
    return (
        float(np.mean(centroid)),
        float(np.mean(rolloff)),
        np.mean(coeffs, axis=0).round(6).tolist(),
        np.std(coeffs, axis=0).round(6).tolist(),
    )


def dct_basis(input_size: int, output_size: int) -> np.ndarray:
    x = np.arange(input_size, dtype=np.float32)
    k = np.arange(output_size, dtype=np.float32)[:, None]
    return np.cos((math.pi / input_size) * (x + 0.5) * k)


def estimate_final_pitch_delta(f0_values: np.ndarray) -> float:
    if f0_values.size < 6:
        return 0.0
    head = np.mean(f0_values[: max(1, f0_values.size // 3)])
    tail = np.mean(f0_values[-max(1, f0_values.size // 3) :])
    return float(tail - head)


def _float_or_none(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    return float(value)
