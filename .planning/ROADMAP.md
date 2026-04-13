# Roadmap: Good Morning, Nikhil

**Version:** v1.0
**Milestone:** Video Pipeline & End-to-End Delivery
**Created:** 2026-04-12
**Phases:** 5

## Overview

| # | Phase | Goal | Requirements | Status |
|---|-------|------|--------------|--------|
| 1 | Still Standardization | Lock final stills with consistent character design | STILL-01..06 | In Progress |
| 2 | Audio Pipeline | Get real VO audio matched to caption timing | AUD-01..03 | Not Started |
| 3 | Ambient Motion Integration | Wire SceneTransition and tune ambient layers on real stills | VIS-01..05 | In Progress |
| 4 | Animatic Assembly | End-to-end playable prototype, Screen 0→10 | INT-01..06 | Not Started |
| 5 | MP4 Export | Screen-record demo reel as class deliverable | DEL-01 | Not Started |

---

## Phase 1: Still Standardization

**Goal:** Lock the final set of stills with consistent character design across all scenes.

**Requirements:** STILL-01, STILL-02, STILL-03, STILL-04, STILL-05, STILL-06

**Depends on:** Nothing

**Success criteria:**
1. All 11 PNG/WebP stills present in `public/sets/` with filenames matching `screens.ts`
2. Jeff finger-beside-chin visible in all shared scenes (Feud, Sponsor, Bachelor, Shark, Maury)
3. Steve expression matches scene (irritated→most, defeated→Maury, quiet→Survivor)
4. Podium/buzzer identical across feud-derived frames
5. No readable text in any still
6. Ink weight gradient: Maury (lightest) → Feud/Sponsor → Bachelor → Shark → Survivor (darkest)

**Tasks:**
- 1A. Cleanup passes: Sponsor (remove mic artifact, add Jeff finger, Steve expression lock) and Maury (Jeff finger, monochrome envelope, Steve defeated)
- 1B. New generations: Survivor quiet variant, Closing empty studio, Feud fade variant
- 1C. Consistency check across all 5 new/cleaned images

**Note:** Image generation is external (AI image gen tool). Placeholder PNGs already in repo.

**UI hint**: no

---

## Phase 2: Audio Pipeline

**Goal:** Get all VO audio clips into `public/vo/` with timing matched to Caption Master.

**Requirements:** AUD-01, AUD-02, AUD-03

**Depends on:** Nothing (can run parallel with Phase 1)

**Success criteria:**
1. 17 MP3 files in `public/vo/` named exactly as referenced in `screens.ts`
2. VO timing matches `GMN_Caption_Master_v2.0.md` cue points (±0.5s tolerance)
3. Audio stops cleanly on screen advance with no bleed into next screen
4. `uiRevealAt` values in `screens.ts` match Caption Master expected timing

**Tasks:**
- 2A. Generate Steve and Jeff character voices via ElevenLabs TTS
- 2B. Mix per-screen clips from script dialog
- 2C. Verify timing against Caption Master, adjust `uiRevealAt` if needed

**Note:** Silent MP3 placeholders already in repo to unblock UI testing.

**UI hint**: no

---

## Phase 3: Ambient Motion Integration

**Goal:** Verify ambient layers look correct on real stills, tune parameters, confirm SceneTransition wiring.

**Requirements:** VIS-01, VIS-02, VIS-03, VIS-04, VIS-05

**Depends on:** Phase 1 (needs real stills for visual tuning)

**Plans:** 2 plans

Plans:
- [ ] 03-01-PLAN.md — SceneTransition test suite proving VIS-01 (static on show changes) and VIS-02 (no static on within-show transitions)
- [ ] 03-02-PLAN.md — Tune all 7 ambient layer parameters and visual verification checkpoint

**Success criteria:**
1. SceneTransition fires channel static on show-segment changes (Feud→Sponsor, Sponsor→Bachelor, etc.)
2. SceneTransition does NOT fire on within-show transitions (3A→3B→3C)
3. Each scene shows correct ambient layer (dust, candle, haze, firelight, spotlight, stagelight, closing dust)
4. Paper shimmer visible (barely) on every screen
5. ambient-map resolves both .png and .webp extensions

**Tasks:**
- 3A. ~~Merge feat/ambient-motion~~ (already merged to master)
- 3B. Tune ambient parameters against real stills (paper shimmer 2-5%, haze drift calibrate, firelight position, dust mote color)
- 3C. ~~Wire SceneTransition~~ (done — wrapped ScreenPlayer in page.tsx)

**UI hint**: yes

---

## Phase 4: Animatic Assembly

**Goal:** End-to-end playable prototype — Screen 0 through 10 with audio, captions, ambient motion, UI overlays.

**Requirements:** INT-01, INT-02, INT-03, INT-04, INT-05, INT-06

**Depends on:** Phase 1, Phase 2, Phase 3

**Success criteria:**
1. Cold open plays audio, shows captions, reveals Start button at ~10.0s
2. Welcome → Relationship → Feud flows with same background
3. Show-segment transitions fire channel static; within-show transitions do not
4. Skip button works, immediately reveals UI
5. Audio stops cleanly on screen advance
6. Mobile viewport (375px width) — everything fits, 60fps
7. Resume flow: start survey, answer 3 screens, close tab, reopen → resumes at screen 4
8. `npm test` — existing flow tests pass
9. Caption band positioning matches layout spec

**Tasks:**
- 4A. Integration test checklist (run app, verify each screen)
- 4B. Timing verification — cross-reference uiRevealAt vs Caption Master
- 4C. Resume flow test
- 4D. Mobile Safari + Chrome perf check

**UI hint**: yes

---

## Phase 5: MP4 Export

**Goal:** One stitched demo reel showing the full experience as a class deliverable.

**Requirements:** DEL-01

**Depends on:** Phase 4

**Success criteria:**
1. MP4 plays cleanly in standalone player
2. Full walkthrough from Screen 0 to Credits
3. Pre-filled dummy answers so recording flows without typing pauses
4. Title card at start

**Tasks:**
- 5A. Run app locally at full resolution (1920x1080 or 1080x1920)
- 5B. Screen-record walkthrough with OBS/QuickTime
- 5C. Trim dead air, add title card in DaVinci Resolve/iMovie

**UI hint**: no
