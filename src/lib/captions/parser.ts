// SRT parser for Good Morning, Nikhil caption data

export interface CaptionLine {
  id: number;
  startMs: number;
  endMs: number;
  speaker: "steve" | "jeff" | null;
  text: string;
  variant: "normal" | "hero" | "whisper";
}

const TIMESTAMP_RE =
  /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/;

const SPEAKER_RE = /^(STEVE|JEFF):\s*/i;

const WHISPER_RE = /\[whisper\]/i;

const HERO_PHRASES = [
  "survey says",
  "the envelope goes to",
  "that's a wrap",
  "hit the music",
];

function parseTimestamp(
  h: string,
  m: string,
  s: string,
  ms: string,
): number {
  return (
    parseInt(h, 10) * 3_600_000 +
    parseInt(m, 10) * 60_000 +
    parseInt(s, 10) * 1_000 +
    parseInt(ms, 10)
  );
}

function detectVariant(
  text: string,
): "normal" | "hero" | "whisper" {
  if (WHISPER_RE.test(text)) return "whisper";

  const lower = text.toLowerCase();
  for (const phrase of HERO_PHRASES) {
    if (lower.includes(phrase)) return "hero";
  }

  return "normal";
}

export function parseSRT(srtContent: string): CaptionLine[] {
  const lines: CaptionLine[] = [];
  const blocks = srtContent
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n\n+/);

  for (const block of blocks) {
    const parts = block.trim().split("\n");
    if (parts.length < 3) continue;

    const id = parseInt(parts[0], 10);
    if (Number.isNaN(id)) continue;

    const tsMatch = parts[1].match(TIMESTAMP_RE);
    if (!tsMatch) continue;

    const startMs = parseTimestamp(
      tsMatch[1],
      tsMatch[2],
      tsMatch[3],
      tsMatch[4],
    );
    const endMs = parseTimestamp(
      tsMatch[5],
      tsMatch[6],
      tsMatch[7],
      tsMatch[8],
    );

    let rawText = parts.slice(2).join(" ").trim();

    let speaker: "steve" | "jeff" | null = null;
    const speakerMatch = rawText.match(SPEAKER_RE);
    if (speakerMatch) {
      speaker = speakerMatch[1].toLowerCase() as "steve" | "jeff";
      rawText = rawText.slice(speakerMatch[0].length).trim();
    }

    const variant = detectVariant(rawText);
    const text = rawText.replace(/\[whisper\]\s*/gi, "").trim();

    lines.push({ id, startMs, endMs, speaker, text, variant });
  }

  return lines;
}
