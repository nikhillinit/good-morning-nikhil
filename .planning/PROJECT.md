# Good Morning, Nikhil

## What This Is

A comedic TV-show-themed survey app that collects "Selling Yourself & Ideas" personal brand feedback from peers. Built as a Next.js web app with animated screens (Family Feud, The Bachelor, Shark Tank, Survivor, Maury), voiceover audio, timed captions, ambient motion layers, and Supabase persistence. Class deliverable for Kellogg Spring 2026.

## Core Value

Respondents complete the full survey — engagement through entertainment is the ONE thing. If the TV-show conceit doesn't hold attention, the feedback data is worthless.

## Requirements

### Validated

- ✓ Screen-based survey flow (18 screens, 11 unique scenes) — existing
- ✓ Audio playback with timed caption reveal — existing
- ✓ UI input types (text, multi-select, invest-or-pass, etc.) — existing
- ✓ Supabase session + answer persistence — existing
- ✓ Resume flow (tab close → reopen) — existing
- ✓ Review screen before submit — existing
- ✓ Ambient motion system (7 components + 3 textures) — existing
- ✓ Scene transition static overlay — existing

### Active

- [ ] Finalized character-consistent stills for all 11 backgrounds
- [ ] Real VO audio for all 13 screen clips (ElevenLabs TTS or recorded)
- [ ] WebP conversion pipeline for still optimization
- [ ] SceneTransition wired into app flow (channel static between shows)
- [ ] Ambient motion tuned against real stills
- [ ] End-to-end integration test (Screen 0→10 playable)
- [ ] MP4 export as class deliverable hedge

### Out of Scope

- Remotion programmatic export — screen recording is sufficient for v1
- AI-generated voice cloning of real Steve Harvey/Jeff Goldblum — TTS with character voices
- Mobile native app — web-only, responsive design sufficient
- Real-time collaboration features — single respondent at a time
- Analytics dashboard — raw Supabase data export

## Context

- Kellogg MBA "Selling Yourself & Ideas" course, Spring 2026
- Steve Harvey (host) and Jeff Goldblum (recurring guest) are illustrated cartoon characters
- Art style: hand-drawn ink illustration, varying line weight by scene
- Stills generated via AI image gen with consistency constraints (Jeff finger-beside-chin, podium shape, etc.)
- Backend (Supabase) built in parallel, mostly operational
- Branch `feat/ambient-motion` merged to master with ambient layer system

## Constraints

- **Timeline**: Class deliverable, weeks not months
- **Still consistency**: 2 cleanup passes + 3 new generations max — no exploration
- **VO approach**: ElevenLabs TTS preferred, human recording fallback
- **Tech stack**: Next.js 16 + React 19 + Tailwind v4 + Framer Motion + Howler.js + Supabase
- **Image budget**: WebP at 85% quality to keep page weight manageable

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Reuse feud still for cold-open/morning-desk/control-room | Same set, CSS overlays for variety | — Pending |
| Reuse bachelor still for limo with CSS filter | brightness(0.6) is enough, no new gen | — Pending |
| Screen recording over Remotion for MP4 | Simpler, Remotion only if frequent re-export needed | — Pending |
| Silent MP3 placeholders to unblock UI testing | Real VO can be swapped in later | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-12 after initialization*
