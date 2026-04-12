# Requirements: Good Morning, Nikhil

**Defined:** 2026-04-12
**Core Value:** Respondents complete the full survey — engagement through entertainment

## v1 Requirements

Requirements for visual content pipeline and end-to-end delivery.

### Stills

- [ ] **STILL-01**: All 11 background stills present in `public/sets/` matching `screens.ts` bg paths
- [ ] **STILL-02**: Character consistency — Jeff finger-beside-chin in all shared scenes
- [ ] **STILL-03**: Character consistency — Steve expression matches scene context
- [ ] **STILL-04**: Podium/buzzer shape identical across feud-derived frames
- [ ] **STILL-05**: No readable text in any still
- [ ] **STILL-06**: Ink weight gradient from lightest (Maury) to darkest (Survivor)

### Audio

- [ ] **AUD-01**: All VO clips present in `public/vo/` matching `screens.ts` audio paths
- [ ] **AUD-02**: VO timing aligns with Caption Master v2.0 cue points
- [ ] **AUD-03**: Audio stops cleanly on screen advance (no bleed)

### Visual Pipeline

- [ ] **VIS-01**: SceneTransition component wired — channel static fires on show-segment changes
- [ ] **VIS-02**: SceneTransition does NOT fire static on within-show transitions (3A→3B)
- [ ] **VIS-03**: Ambient layers render per-scene (dust for Feud, candle for Bachelor, etc.)
- [ ] **VIS-04**: Paper shimmer visible on every screen
- [ ] **VIS-05**: WebP conversion available; ambient-map handles both .png and .webp

### Integration

- [ ] **INT-01**: Cold open plays audio, shows captions, reveals Start button at ~10s
- [ ] **INT-02**: Full flow Screen 0→10 completes without errors
- [ ] **INT-03**: Skip button works — immediately reveals UI
- [ ] **INT-04**: Resume flow — close tab at screen 4, reopen → resumes at screen 4
- [ ] **INT-05**: Mobile viewport (375px) — everything fits, 60fps, no jank
- [ ] **INT-06**: Caption band positioning matches layout geometry spec

### Deliverable

- [ ] **DEL-01**: MP4 demo reel of full walkthrough (screen recording or Remotion)

## v2 Requirements

### Analytics

- **ANAL-01**: Dashboard showing response aggregates per question
- **ANAL-02**: Word cloud from free-text responses

### Polish

- **POL-01**: Remotion-based repeatable MP4 export
- **POL-02**: Sound effects (buzzer, applause) for transitions

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real celebrity voice cloning | Legal/ethical, TTS character voices sufficient |
| Native mobile app | Web responsive is enough for class context |
| Real-time multiplayer survey | Single respondent, no collaboration needed |
| AI analysis of responses | Manual review for class assignment |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| STILL-01 | Phase 1 | In Progress |
| STILL-02 | Phase 1 | Pending |
| STILL-03 | Phase 1 | Pending |
| STILL-04 | Phase 1 | Pending |
| STILL-05 | Phase 1 | Pending |
| STILL-06 | Phase 1 | Pending |
| AUD-01 | Phase 2 | In Progress |
| AUD-02 | Phase 2 | Pending |
| AUD-03 | Phase 2 | Pending |
| VIS-01 | Phase 3 | Complete |
| VIS-02 | Phase 3 | Pending |
| VIS-03 | Phase 3 | Complete |
| VIS-04 | Phase 3 | Complete |
| VIS-05 | Phase 3 | Complete |
| INT-01 | Phase 4 | Pending |
| INT-02 | Phase 4 | Pending |
| INT-03 | Phase 4 | Pending |
| INT-04 | Phase 4 | Pending |
| INT-05 | Phase 4 | Pending |
| INT-06 | Phase 4 | Pending |
| DEL-01 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-12*
*Last updated: 2026-04-12 after initialization*
