# AI Video Generation — Design Spec

**Date:** 2026-04-12
**Project:** Good Morning, Nikhil
**Status:** Approved

## Goal

Replace static WebP set backgrounds with short AI-generated video clips on 9 of 17 screens. Video is progressive enhancement — stills remain the fallback. The experience must not regress mobile UX, particularly around autoplay behavior and input legibility.

## Constraints

- Mobile-first (phone browsers, 10-20 users via shared link)
- Class deliverable timeline (weeks, not months)
- WebP stills at 85% quality already exist for all sets
- Audio autoplay is a known critical UX risk (SYNTHETIC-USER-TEST.md:323)
- Question prompts vanish after audio (SYNTHETIC-USER-TEST.md:326)

## Screen Classification

### Video screens (9) — atmosphere/setup, VO sets the scene

| Screen ID | Set Background | Shot | Angle | Movement | Duration |
|---|---|---|---|---|---|
| `cold-open` | cold-open-glitch.webp | WS | Eye level | Slow zoom in | ~12s |
| `welcome` | morning-desk.webp | MS | Eye level | Slow pan right | ~8s |
| `feud-top3` | feud-board.webp | WS | Eye level | Static to slow dolly in | ~6s |
| `bachelor-roses` | bachelor-mansion.webp | WS | Low angle | Slow crane up | ~6s |
| `bachelor-limo` | limo-interior.webp | MS | Eye level | Slow truck left | ~5s |
| `shark-invest` | shark-warehouse.webp | WS | Slight low angle | Slow dolly in | ~6s |
| `survivor` | tribal-council.webp | MS | Eye level | Slow push in | ~6s |
| `maury` | maury-studio.webp | MS | Eye level | Static to slow pan | ~8s |
| `credits` | credits-bg.webp | WS | Eye level | Slow pull out | ~8s |

### Still-only screens (8) — user is focused on answering

| Screen ID | Set Background | Reason |
|---|---|---|
| `relationship` | morning-desk.webp | Quick picker, no scene-setting needed |
| `feud-strongest` | feud-board.webp | Follow-up text input, same set |
| `feud-trademark` | feud-board.webp | Follow-up text input, same set |
| `sponsor-brand` | sponsor-pedestal.webp | Short text input |
| `sponsor-why` | sponsor-pedestal.webp | Follow-up text input |
| `bachelor-eliminate` | bachelor-mansion.webp | Quick select, same set |
| `shark-reason` | shark-warehouse.webp | Follow-up text input |
| `producer-notes` | control-room.webp | Long text input, focus mode |

## Generation Pipeline

### Tool: inference.sh CLI (`infsh`)

Primary model: **Wan 2.5+ I2V** (`falai/wan-2-5-i2v`) — image-to-video using existing WebP stills as first frame.

Fallback model: **Veo 3.1** (`google/veo-3-1`) — for screens where Wan produces insufficient camera control.

Post-processing:
- **Topaz upscaler** (`falai/topaz-video-upscaler`) — optional quality polish
- **Media merger** (`infsh/media-merger`) — stitch clips for screens exceeding single-gen duration
- **Foley** (`infsh/hunyuanvideo-foley`) — optional ambient sound (not in initial scope)

### Shared style suffix

All prompts append: `TV game show production, saturated studio lighting, 16:9 broadcast aspect ratio, shallow depth of field, cinematic color grade`

### Compression

```bash
ffmpeg -i input.mp4 -vcodec libx264 -crf 23 -vf scale=1280:720 -movflags +faststart -an output.mp4
```

- Format: MP4 H.264 (universal hardware decode on all mobile devices)
- Resolution: 720p (1280x720) — matches mobile viewport, `object-fit: cover` crops sides in portrait
- `-an`: strip audio (VO is separate via Howler.js)
- `-movflags +faststart`: move moov atom to file start for progressive download
- Per-clip budget: **1.5MB hard cap**
- Total budget: ~13.5MB across 9 clips

## Storage

**`public/videos/`** — MP4s committed to repo, served via Vercel's edge CDN automatically.

No manifest file. No Vercel Blob. Direct paths referenced in `screens.ts`.

Rationale: 13.5MB total is negligible for deploy times. Vercel CDN-serves everything in `public/` with regional distribution. Blob adds unnecessary complexity for baked assets served to 10-20 users.

## Schema Change

```ts
// screens.ts
export interface Screen {
  // ...existing fields...
  video?: string; // path to video in /public/videos/
}
```

Video screens get `video: "/videos/cold-open.mp4"`. Still-only screens omit the field.

## Integration Architecture

### Player behavior

1. `ScreenPlayer` checks `screen.video`
2. If present: render `<video muted autoPlay playsInline poster={screen.bg}>` behind captions/UI
3. Call `video.play().catch()` — on failure (iOS Low Power Mode, Data Saver), fall through to WebP still
4. On video end: freeze on last frame (no loop)
5. **Pause/freeze video when `showUI` becomes true** — prevents motion distraction during text input
6. Overlay increases from `bg-black/50` to `bg-black/60` on video screens for caption legibility

### Preload policy

- **Metadata-only** preload for the next screen's video: `<link rel="preload" as="video" type="video/mp4">` with `preload="metadata"`
- No full eager preload on mobile — respect bandwidth constraints
- Connection-aware: skip preload entirely on `navigator.connection.saveData === true`

### Fallback cascade

1. Video loads and autoplays -> video background
2. Autoplay blocked (Low Power Mode, Data Saver) -> WebP still (existing behavior, no degradation)
3. Video fails to load -> WebP still via `poster` attribute (instant, no flash)
4. `prefers-reduced-motion` -> skip video, show still

## Phased Rollout

### Phase 0 — Media consent gate (prerequisite)

**Why first:** Audio auto-play is the #1 abandonment risk (SYNTHETIC-USER-TEST.md:323). Adding autoplay video before fixing this makes mobile UX worse. Fixing it also satisfies browser autoplay policy — user interaction on the consent screen unlocks both audio and muted video.

- Add "This episode has sound" interstitial on cold-open screen
- "Start Episode" button becomes the audio trigger (no auto-play on mount)
- Add persistent mute toggle visible on all screens

### Phase 1 — Persistent question prompts (prerequisite)

**Why second:** Question prompts vanish after audio ends (SYNTHETIC-USER-TEST.md:326). If users can't read the question, adding video behind the input makes legibility worse.

- Every input screen shows question text above the input, not only in captions
- Follow the `LongTextWithAudio` pattern (already renders `config.prompt` as visible text)

### Phase 2 — Video media layer

- Add `video?: string` to `Screen` interface
- Implement video background in `ScreenPlayer`:
  - `<video>` element behind overlay
  - Autoplay failure fallback
  - Pause on `showUI`
  - Increased overlay opacity for video screens
- Metadata-only preloading with connection awareness

### Phase 3 — Controlled bakeoff (3 clips)

Test across 3 representative scene classes:

| Class | Still | Challenge |
|---|---|---|
| Glitch/effects | cold-open-glitch.webp | Visual artifacts + motion coherence |
| Static presenter set | feud-board.webp | Game show stage, sweeping lights |
| Organic/flicker | tribal-council.webp | Torches, jungle, firelight |

Run each through **both** Wan 2.5+ I2V and Veo 3.1 I2V (apples-to-apples, both from stills). Compare: motion coherence, camera control, first-frame fidelity, cost.

### Phase 4 — Batch generation

- Generate remaining 6 clips with winning model
- Compress with ffmpeg (see Compression section)
- Drop into `public/videos/`
- Add `video` field to 9 screens in `screens.ts`

### Phase 5 — Mobile validation

- Real iPhone: Low Power Mode on/off, silent mode on/off
- Real Android: Data Saver on/off
- Verify fallback-to-still works in all degraded modes
- Test with `prefers-reduced-motion` enabled
- Verify caption legibility over video backgrounds

## Prompt Bible

Each video screen maps to an `infsh` command:

```bash
# Shared
STYLE="TV game show production, saturated studio lighting, 16:9 broadcast, shallow depth of field, cinematic color grade"

# cold-open (~12s, may need 2 gens stitched)
infsh app run falai/wan-2-5-i2v --input "{
  \"image_url\": \"./public/sets/cold-open-glitch.webp\",
  \"prompt\": \"wide shot, slow zoom in, glitchy game show stage powering on, lights flickering to life, board illuminating, $STYLE\"
}"

# welcome (~8s)
infsh app run falai/wan-2-5-i2v --input "{
  \"image_url\": \"./public/sets/morning-desk.webp\",
  \"prompt\": \"medium shot, slow pan right, morning show desk, studio lights warming up, subtle camera drift, $STYLE\"
}"

# feud-top3 (~6s)
infsh app run falai/wan-2-5-i2v --input "{
  \"image_url\": \"./public/sets/feud-board.webp\",
  \"prompt\": \"wide shot, static then slow dolly in, Family Feud board center stage, answer slots visible, stage lights sweep, $STYLE\"
}"

# bachelor-roses (~6s)
infsh app run falai/wan-2-5-i2v --input "{
  \"image_url\": \"./public/sets/bachelor-mansion.webp\",
  \"prompt\": \"wide shot, low angle, slow crane up, mansion interior, candelabras, rose petals catching light, $STYLE\"
}"

# bachelor-limo (~5s)
infsh app run falai/wan-2-5-i2v --input "{
  \"image_url\": \"./public/sets/limo-interior.webp\",
  \"prompt\": \"medium shot, slow truck left, limo interior, city lights streaming past windows, moody blue tones, $STYLE\"
}"

# shark-invest (~6s)
infsh app run falai/wan-2-5-i2v --input "{
  \"image_url\": \"./public/sets/shark-warehouse.webp\",
  \"prompt\": \"wide shot, slight low angle, slow dolly in, warehouse set, shark chairs visible, dramatic top-lighting, $STYLE\"
}"

# survivor (~6s)
infsh app run falai/wan-2-5-i2v --input "{
  \"image_url\": \"./public/sets/tribal-council.webp\",
  \"prompt\": \"medium shot, slow push in, tribal council, torches flickering, jungle ambiance, intimate confessional, $STYLE\"
}"

# maury (~8s)
infsh app run falai/wan-2-5-i2v --input "{
  \"image_url\": \"./public/sets/maury-studio.webp\",
  \"prompt\": \"medium shot, static then slow pan, talk show studio, audience seats, dramatic envelope lighting, $STYLE\"
}"

# credits (~8s)
infsh app run falai/wan-2-5-i2v --input "{
  \"image_url\": \"./public/sets/credits-bg.webp\",
  \"prompt\": \"wide shot, slow pull out, empty studio, lights dimming one by one, wrap-up energy, $STYLE\"
}"
```

## Risks

| Risk | Mitigation |
|---|---|
| iOS Low Power Mode blocks autoplay | `.play().catch()` falls back to still — zero degradation |
| Video motion reduces caption legibility | Increased overlay opacity + pause-on-input |
| Wan 2.5 camera control insufficient | Bakeoff in Phase 3 with Veo 3.1 fallback |
| Clips exceed 1.5MB budget | ffmpeg CRF tuning (raise to 26-28 if needed) |
| 12s cold-open exceeds single gen limit | Stitch 2 clips via `infsh/media-merger` with fade transition |
| 16:9 crops awkwardly on some phones | `object-fit: cover` (same as current stills) — acceptable |
| Git repo bloat from committed MP4s | 13.5MB total — acceptable for class project lifecycle |
