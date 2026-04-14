# Good Morning Nikhil - Visual Asset Inventory

## Background Images (12 total)

All located in `/public/sets/`:

| Asset | Screen(s) | Current Style | Ambient Layer | Notes |
|-------|-----------|---------------|---------------|-------|
| `intro-retro-tv.webp` | intro-tv | Retro TV | None | Entry point, CRT boot |
| `cold-open-glitch.webp` | cold-open | Real photo | DustMotes | Glitch effect |
| `morning-desk.webp` | morning show | Real photo | DustMotes | Good Morning desk |
| `feud-board.webp` | feud-top3, feud-strongest, feud-trademark, gmn-feud-kickoff | Real photo | DustMotes | Family Feud board |
| `sponsor-pedestal.webp` | commercial-break, commercial-why | Real photo | SpotlightPulse | **Needs brand reveal video** |
| `bachelor-mansion.webp` | bachelor-roses, bachelor-eliminate | Real photo | CandleFlicker | **Steve positioning issue** |
| `limo-interior.webp` | bachelor-limo | Real photo | CandleFlicker | Has video overlay |
| `shark-warehouse.webp` | shark-invest, shark-reason | Real photo | HazeDrift | Has video overlay |
| `tribal-council.webp` | survivor | Real photo | FirelightVariation | Torch lit |
| `maury-studio.webp` | maury | Real photo | StageLightShimmer | Daytime talk show |
| `control-room.webp` | producer-notes | Real photo | DustMotes | TV control room |
| `credits-bg.webp` | credits, post-credits | Real photo | DustMotes (closing) | End credits |

## Video Assets (3 total + 1 needed)

Located in `/public/videos/`:

| Asset | Screen | Duration | Purpose | Status |
|-------|--------|----------|---------|--------|
| `feud-top3.mp4` | feud-top3 | ~5s | Board reveal animation | Exists |
| `bachelor-limo.mp4` | bachelor-limo | ~7s | Limo exit scene | Exists |
| `shark-invest.mp4` | shark-invest | ~5s | Shark Tank pitch | Exists |
| `commercial-break.mp4` | commercial-break | ~5s | Brand reveal animation | **NEEDS CREATION** |

## Texture Assets (3 total)

Located in `/public/textures/`:

| Asset | Used By | Purpose | Needs Update? |
|-------|---------|---------|---------------|
| `paper-grain-tile.png` | PaperShimmer | Paper grain overlay | Maybe - for illustrated style |
| `haze-wisp.png` | HazeDrift | Haze/fog effect | No |
| `tv-static.png` | CRT effects | TV static noise | No |

## Ambient Components (10 total)

Located in `/src/components/ambient/`:

| Component | Used For | Effect | Illustrated Compatibility |
|-----------|----------|--------|---------------------------|
| CandleFlicker | Bachelor mansion, Limo | Warm flicker | Good |
| DustMotes | Feud, Control room, Credits | Floating particles | Good |
| FirelightVariation | Tribal council | Torch firelight | Good |
| HazeDrift | Shark Tank | Fog/haze drift | Good |
| PaperShimmer | All non-CRT | Paper texture | **May need tuning** |
| SpotlightPulse | Commercial break | Spotlight beam | **Enhance for brand reveal** |
| StageLightShimmer | Maury studio | Stage lighting | Good |
| CrtOverlay | CRT screens | Scanlines | No change |
| CRTScreen | Boot sequence | CRT boot | No change |
| TelevisionFrame | All screens | TV frame | **Conditional hide** |

## Issues to Address

### Critical
1. **TV Frame** - Hide after intro screens (code change)
2. **Answer card contrast** - Increase opacity to ~80% (code change)
3. **Brand reveal video** - Create commercial-break.mp4 (new asset)
4. **Steve positioning** - Fix floating hand in bachelor-mansion (asset/layout fix)

### Recommended
5. **All backgrounds** - Convert to illustrated style (12 assets)
6. **Paper texture** - May need adjustment for illustrated backgrounds
7. **SpotlightPulse** - Enhance for brand reveal moment

### Optional
8. **Replace videos** - Could create animated versions matching illustrated style
9. **Character consistency** - Ensure Steve/characters match illustrated style

## Art Style Recommendations

For illustrated backgrounds:
- **Style**: Stylized cartoon with soft gradients (like Archer/Bob's Burgers but warmer)
- **Color palette**: Rich, saturated TV colors with dark edges for text contrast
- **Lighting**: Dramatic, match existing ambient overlays
- **Characters**: Simplified but recognizable parody versions

## Dependencies

```
Art Direction (style guide)
    |
    v
Background Illustrations (12)
    |
    +---> Ambient Effect Tuning
    |
    +---> Character Art (Steve fix)
    |
    v
Brand Reveal Video
    |
    v
Code Changes (frame, cards)
    |
    v
Visual QA & Verification
```
