# Brand Reveal Video Specification

**File**: `public/videos/commercial-break.mp4`  
**Duration**: 5 seconds (150 frames at 30fps)  
**Resolution**: 1920x1080  
**Codec**: H.264 (web-optimized)

---

## Creative Direction

This video serves as the transition into sponsor acknowledgment moments. It evokes premium commercial production—think Super Bowl ad polish, Apple product reveal drama, and luxury brand sophistication. The animation builds anticipation before the brand name appears.

---

## Color Palette (from style guide - Commercial Break)

| Role | Hex | Usage |
|------|-----|-------|
| Luxury Black | `#0A0A0A` | Primary backdrop |
| Spotlight White | `#FAFAFA` | Light cone, text |
| Premium Gold | `#B8860B` | "SPONSORED BY" text, accents |
| Deep Blue | `#000033` | Depth gradient in darkness |
| Silver Chrome | `#C0C0C0` | Subtle edge highlights |
| Warm Highlight | `#FFF5E1` | Soft light spill |

---

## Keyframe Breakdown

### Frame 0-30 (0:00 - 1:00) — DARKNESS ESTABLISHES

**Visual**: Pure black frame with barely perceptible deep blue gradient at center.

**Animation**:
- Frame 0-15: Absolute black (#0A0A0A)
- Frame 16-30: Subtle deep blue (#000033) begins breathing in center, opacity 0% → 10%

**Effects**:
- Minimal film grain (3% opacity)
- No other elements

**Audio Sync Point**: 
- 0:00 — Silence or low rumble begins (20Hz sub-bass fade in)

---

### Frame 30-60 (1:00 - 2:00) — SMOKE EMERGES

**Visual**: Wispy smoke tendrils begin rising from bottom frame, backlit by unseen source below.

**Animation**:
- Frame 30-45: First smoke particles appear at frame bottom
- Frame 45-60: Smoke rises organically, spreading across lower third
- Smoke velocity: ~50px per second upward
- Smoke opacity: 15% → 40%

**Effects**:
- Volumetric smoke simulation (After Effects Particular or similar)
- Subtle internal smoke illumination (edge lighting)
- Film grain continues (3% opacity)

**Audio Sync Point**:
- 1:00 — Soft whoosh/air movement begins
- 1:15 — Sub-bass builds slightly

---

### Frame 60-90 (2:00 - 3:00) — SPOTLIGHT IGNITES

**Visual**: A dramatic overhead spotlight snaps on, creating a visible cone of light through the smoke. The light illuminates a circular area on an implied floor surface.

**Animation**:
- Frame 60-65: Spotlight SNAPS on (2-frame attack)
- Frame 65-75: Light cone fully establishes, smoke becomes dramatically visible
- Frame 75-90: Light stabilizes, gentle flicker (2% variation)

**Spotlight Specs**:
- Cone angle: 25 degrees
- Source: Top center frame, 20% above visible area
- Floor pool: 400px diameter circle, soft falloff
- Light temperature: 5500K (Spotlight White #FAFAFA)

**Effects**:
- Volumetric light rays through smoke
- Dust motes appear in light cone (slow drift, 10-15 particles)
- Subtle floor reflection (15% opacity)
- Lens bloom on light source (8% opacity)

**Audio Sync Point**:
- 2:00 — Sharp "snap" or electrical ignition sound
- 2:05 — Reverb tail of snap
- 2:10 — Sustained gentle hum (spotlight electrical ambience)

---

### Frame 90-120 (3:00 - 4:00) — TEXT MATERIALIZES

**Visual**: "SPONSORED BY" text materializes in the spotlight, letter by letter, with a golden premium finish.

**Text Specs**:
- Font: Premium sans-serif (Gotham, Proxima Nova, or similar)
- Size: 72px
- Color: Premium Gold (#B8860B) with subtle metallic gradient
- Position: Center frame, vertically at 40% from top
- Tracking: 400 (wide letter spacing)
- Weight: Medium/Book

**Animation**:
- Frame 90-105: Letters appear sequentially left-to-right
  - Each letter: 0% opacity → 100% over 3 frames
  - Stagger: 2 frame delay between letters
  - Subtle scale: 105% → 100% on each letter
- Frame 105-120: Full text holds, gentle pulse (opacity 100% → 95% → 100%)

**Effects**:
- Text receives spotlight illumination (top-lit appearance)
- Subtle gold reflection on floor below text
- Text casts soft shadow (10% opacity, 10px offset down)

**Audio Sync Point**:
- 3:00 — Soft chime or tone begins (high register, sustained)
- 3:05-3:15 — Additional harmonic layers build (musical brand sting)
- 3:20 — Music settles to sustain

---

### Frame 120-150 (4:00 - 5:00) — HOLD AND BREATHE

**Visual**: Complete composition holds. "SPONSORED BY" text glows in spotlight, smoke continues drifting, waiting for brand logo to appear (next video or overlay).

**Animation**:
- Frame 120-150: Static composition with subtle life:
  - Smoke continues drifting (never stops)
  - Dust motes continue floating
  - Text has subtle pulse (98% → 100% opacity cycle, 60 frame period)
  - Spotlight flicker (1% variation)

**Effects**:
- All previous effects maintain
- Slight vignette darkening intensifies (25% → 30%)
- Film grain continues

**Audio Sync Point**:
- 4:00-5:00 — Music sustains and gently fades
- 4:30 — Begin gentle fade out
- 5:00 — Silence (allows next audio to start clean)

---

## Technical Specifications

### Video Encoding
```
Codec: H.264
Profile: High
Level: 4.1
Bitrate: 8-12 Mbps (variable)
Keyframe: Every 30 frames
Color Space: sRGB
Pixel Format: yuv420p
```

### Audio Encoding
```
Codec: AAC
Sample Rate: 48kHz
Bitrate: 256kbps
Channels: Stereo
```

### Smoke Parameters
```
Particle Count: 500-800
Emission Rate: 30/second
Particle Lifetime: 3-5 seconds
Velocity: 50-80 px/s upward
Turbulence: Medium (organic drift)
Color: White (#FFFFFF) at 15-40% opacity
Size: 50-200px diameter (varied)
```

### Dust Mote Parameters
```
Particle Count: 10-15
Emission Rate: 3/second (once spotlight active)
Velocity: 5-15 px/s (slow drift)
Color: Warm White (#FFF5E1)
Size: 2-8px
Opacity: 30-60%
```

---

## Audio Design Notes

### Sound Design Elements

1. **Sub-bass foundation** (0:00-2:00)
   - 20-40Hz rumble
   - Builds tension during darkness
   - Peaks at spotlight ignition

2. **Spotlight snap** (2:00)
   - Sharp transient attack
   - Mix of electrical zap and theatrical follow-spot sound
   - 100ms duration
   - Reverb tail: 500ms hall reverb

3. **Electrical hum** (2:05-5:00)
   - Subtle 60Hz hum undertone
   - Suggests live theatrical lighting
   - Mixed low, felt not heard

4. **Brand sting** (3:00-4:30)
   - Three-note ascending motif
   - Premium, aspirational tone
   - Think Intel Inside meets luxury brand
   - Instrumentation: soft synth pad + subtle bell/chime

5. **Fade out** (4:30-5:00)
   - Gentle fade to silence
   - No hard cut

### Audio Reference
- Apple product reveal stings
- Lexus "December to Remember" tones
- HBO "static angel" production sting
- Netflix "ta-dum" (structure, not sound)

---

## Production Pipeline

### Software Recommendations
1. **After Effects** — Primary animation
   - Trapcode Particular for smoke
   - Optical Flares for spotlight
2. **DaVinci Resolve** — Color grading and final encode
3. **Audition/Logic** — Audio design
4. **HandBrake** — Web optimization pass

### Asset Handoff
- Project files: After Effects (.aep)
- Audio stems: Separate music, SFX tracks
- Final render: ProRes 4444 master
- Web delivery: H.264 MP4 + WebM fallback

---

## Implementation Checklist

- [ ] Create After Effects project at 1920x1080, 30fps
- [ ] Build smoke particle system
- [ ] Create spotlight with volumetric rays
- [ ] Animate text materialization
- [ ] Add dust mote particle system
- [ ] Design/source audio sting
- [ ] Mix audio with video sync
- [ ] Color grade to match style guide
- [ ] Export master ProRes
- [ ] Encode H.264 for web
- [ ] Test playback across browsers
- [ ] Verify audio sync on mobile
