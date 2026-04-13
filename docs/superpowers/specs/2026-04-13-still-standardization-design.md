# Still Standardization Design

**Date:** 2026-04-13
**Phase:** 1 (Still Standardization)
**Status:** Approved (revised after red team review)

## Problem

11 stills in `public/sets/` serve as scene backgrounds. Currently 5 of them are duplicates of the same Feud stage image. Each show segment needs a visually distinct set that communicates "you're watching a different show now" while maintaining consistent character design across all scenes.

## Architecture: Style-Anchored Full-Scene Generation

Each still is a complete scene — characters and background together in one image. Character consistency is achieved through **style anchoring**: using existing stills as composition and style references during generation, not through layer compositing.

### Why Full-Scene Over Compositing

The original design proposed extracting a character plate and compositing over separate backgrounds. Red team review identified this as a showstopper:
- Ink sketches on parchment have soft edges and texture bleed — alpha extraction produces visible seams at ground contact points
- AI inpainting tools fill regions, they don't cut clean alpha channels
- Parchment texture must be continuous across the image or compositing looks pasted-on

Full-scene generation with style anchoring avoids all of these problems while achieving the same goal: every screen looks like a different show, characters stay recognizable.

### How Style Anchoring Works

1. Pick the best existing still as a **style + composition reference** (e.g., `shark-warehouse.webp` for character pose/proportions, `tribal-council.webp` for ink/parchment aesthetic)
2. Generate new scenes with these references guiding the model — Steve and Jeff appear in consistent poses because the reference image shows them that way
3. Minor character variation across scenes reads as "hand-drawn" charm, not inconsistency — the ink sketch style absorbs small differences naturally

## Character Consistency Spec

Per ROADMAP requirements:
- Jeff: finger-beside-chin gesture visible in all shared scenes
- Steve: bald, mustache, light suit, irritated expression (default across all scenes)
- Podium/buzzer framing consistent across Feud-derived scenes

Steve's expression does NOT vary per scene. The irritated default works everywhere — "defeated" and "quiet" variants are cut from the spec. The ink sketch style doesn't convey subtle expression differences at the scale characters are rendered, and the inference budget is better spent on backgrounds.

## Stills Inventory

### Keep As-Is (5 stills — already distinct)

| File | Show | Iconic Elements |
|------|------|----------------|
| `feud-board.webp` | Family Feud | Lit answer board, buzzers, studio spots |
| `bachelor-mansion.webp` | The Bachelor | Candelabras, velvet drapes, roses on pedestal |
| `shark-warehouse.webp` | Shark Tank | Spotlit chair, warehouse depth, industrial haze |
| `tribal-council.webp` | Survivor | Bamboo walls, torchlight, tribal textures |
| `credits-bg.webp` | Credits | Empty Feud stage, podium, marquee board (no characters) |

### Cleanup via Inpainting (2 passes)

| File | Show | Changes |
|------|------|---------|
| `sponsor-pedestal.webp` | Sponsor Break | Remove mic artifact, adjust set dressing to differentiate from Feud stage |
| `maury-studio.webp` | Maury | Monochrome envelope (currently tan), lighter ink weight overall |

### New Full-Scene Generation (3 passes)

| File | Show | Iconic Elements | Style Reference |
|------|------|----------------|-----------------|
| `morning-desk.webp` | Welcome / Relationship | News desk, coffee mug, monitors, warm morning light, Steve + Jeff at podiums | `shark-warehouse.webp` (composition), `bachelor-mansion.webp` (ink style) |
| `control-room.webp` | Control Room | Bank of monitors, switcher board, dim blue glow, Steve + Jeff at podiums | `shark-warehouse.webp` (composition), `tribal-council.webp` (ink weight) |
| `limo-interior.webp` | The Bachelor (confessional) | Leather backseat, car window, night exterior, Steve + Jeff in intimate framing | `bachelor-mansion.webp` (style + character reference) |

### CRT Static (1 quick gen)

`cold-open-glitch.webp` — Not a show set. This is the TV turning on: CRT static, scan lines, warm phosphor glow. No characters.

Generated as a single inference pass: "CRT television static, scan lines, warm phosphor noise, parchment paper texture, 16:9". One flat WebP, no code changes, no runtime generation.

## Generation Workflow

### Step 1: Generate New Scenes
1. Feed existing stills as style + composition references
2. Prompt structure: `[scene description], ink sketch on aged parchment, two men at podiums — bald mustached man in light suit (left), tall man with glasses in dark jacket (right), 16:9, 2752x1536`
3. Generate `morning-desk`, `control-room`, `limo-interior` — 3 passes

### Step 2: Cleanup Existing Scenes
1. `sponsor-pedestal.webp` — inpaint to remove mic artifact, adjust set props
2. `maury-studio.webp` — inpaint envelope to monochrome, reduce overall ink weight

### Step 3: Generate CRT Static
1. Single gen: CRT static texture, no characters
2. Replace `cold-open-glitch.webp`

### Step 4: Ink Weight Post-Processing
Apply curves adjustment per scene to achieve gradient:
- Maury (lightest) → Sponsor → Morning → Feud → Bachelor → Shark → Tribal (darkest)

### Step 5: Export
1. All outputs at 2752x1536 WebP, 85% quality
2. Drop into `public/sets/` — filenames unchanged
3. Verify file sizes stay under 800 KB each

### Step 6: Validation
1. All 11 WebP stills present in `public/sets/` with filenames matching `screens.ts`
2. Jeff finger-beside-chin visible in all character scenes
3. Steve recognizable across all scenes (bald, mustache, light suit, irritated)
4. No readable text in any still
5. Ink weight gradient visible across the show progression
6. Each scene visually distinct — no more duplicate backgrounds
7. `npm test` passes (ambient-map tests verify .webp extension handling)

## Budget

| Type | Count | Items |
|------|-------|-------|
| New full-scene generations | 3 | morning-desk, control-room, limo-interior |
| Cleanup inpainting passes | 2 | sponsor-pedestal, maury-studio |
| CRT static generation | 1 | cold-open-glitch |
| **Total** | **6 inference calls** | Within budget (5 scene + 1 static) |

## Screen-to-Asset Mapping

| Screen ID | Background File | Characters? | Show |
|-----------|----------------|-------------|------|
| cold-open | cold-open-glitch.webp | No (CRT static) | Cold Open |
| welcome | morning-desk.webp | Yes | Welcome |
| relationship | morning-desk.webp | Yes | Meet Our Audience |
| feud-top3 | feud-board.webp | Yes | Family Feud |
| feud-strongest | feud-board.webp | Yes | Family Feud |
| feud-weakness | feud-board.webp | Yes | Family Feud |
| sponsor-brands | sponsor-pedestal.webp | Yes | Sponsor Break |
| sponsor-pitch | sponsor-pedestal.webp | Yes | Sponsor Break |
| bachelor-first | bachelor-mansion.webp | Yes | The Bachelor |
| bachelor-final | bachelor-mansion.webp | Yes | The Bachelor |
| limo-ride | limo-interior.webp | Yes | The Bachelor |
| shark-strengths | shark-warehouse.webp | Yes | Shark Tank |
| shark-invest | shark-warehouse.webp | Yes | Shark Tank |
| survivor | tribal-council.webp | Yes | Survivor |
| maury | maury-studio.webp | Yes | Maury |
| control-room | control-room.webp | Yes | Behind the Scenes |
| credits | credits-bg.webp | No (empty stage) | Credits |

## Video Basis

The still images serve as the base frame for the eventual MP4 pipeline:
- Ambient motion (dust, haze, firelight per `ambient-map.ts`) animates over the still
- SceneTransition channel static fires between shows (already wired)
- Cold-open: CRT static image → SceneTransition resolves to first scene
- No video generation needed — stills + ambient layers + Ken Burns = sufficient motion

## Files Changed

- `public/sets/morning-desk.webp` — replaced (currently Feud duplicate)
- `public/sets/control-room.webp` — replaced (currently Feud duplicate)
- `public/sets/limo-interior.webp` — replaced (currently Bachelor duplicate)
- `public/sets/cold-open-glitch.webp` — replaced (currently Feud duplicate)
- `public/sets/sponsor-pedestal.webp` — cleaned up in place
- `public/sets/maury-studio.webp` — cleaned up in place
- No code changes. All filenames preserved. `screens.ts` paths unchanged.

## Dependencies

- None on other phases (Phase 2 audio, Phase 3 motion are independent)
- Ambient motion system (`ambient-map.ts`) already handles .webp extension
- `screens.ts` bg paths unchanged

## Red Team Mitigations Applied

| Risk | Original Design | Revised Design |
|------|----------------|----------------|
| Alpha extraction seams (showstopper) | Character plate compositing | Full-scene generation, no compositing |
| Expression variant budget (high priority) | 2-3 face inpainting variants | Cut — default expression works everywhere |
| CRT code change contradiction (high priority) | Procedural runtime option | Single gen as flat WebP, no code changes |
| Budget overrun (high priority) | ~8 inference calls | 6 inference calls, within budget |
