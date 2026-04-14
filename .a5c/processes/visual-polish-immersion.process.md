# Visual Polish Immersion Process

## Overview

This process transforms the Good Morning Nikhil TV survey app from a "watching TV" experience into a fully immersive animated world. After completing the intro screens, users are "drawn into" the TV - the frame disappears and they're surrounded by illustrated animated environments.

## Requirements Addressed

| # | Requirement | Type | Priority |
|---|-------------|------|----------|
| 1 | TV frame removal after intro | Code | High |
| 2 | Illustrated background assets | Asset | High |
| 3 | Darker answer cards | Code | Medium |
| 4 | Brand reveal video animation | Asset+Code | High |
| 5 | Steve character positioning | Asset/Code | Medium |

## Process Phases

### Phase 1: Analysis (1 task)

**Objective**: Understand the current visual state before making changes.

**Task**: `analyze-current-state`
- Reads TelevisionFrame.tsx, ScreenPlayer.tsx, ui-inputs
- Documents current frame logic, card contrast, background assets
- Identifies exact code locations for modifications

**Breakpoint**: Review analysis before proceeding.

### Phase 2: Code Changes (2 tasks) — DESIGN.md Compliant

**Objective**: Implement code-based visual improvements using semantic tokens and data-driven architecture.

**Task 1**: `implement-frame-removal` (Data-Driven)
- Adds `hideTvFrame?: boolean` to Screen type in screens.ts
- Sets `hideTvFrame: true` on all screens after intro (gmn-feud-kickoff onwards)
- Modifies ScreenPlayer.tsx to use `zoomedIn={screen.hideTvFrame === true}`
- **NOT** hardcoded `screenIndex >= 2` — this is brittle and breaks if onboarding screens are added

**Task 2**: `implement-darker-cards` (Semantic CSS Variables)
- Modifies `--surface` CSS variable in src/app/globals.css
- Increases alpha/opacity value to ~0.8 (80%)
- Components use `bg-surface` semantic class (already in place)
- **NOT** literal `bg-black/80` in ui-inputs — violates Code-as-Truth design system

**Breakpoint**: Test changes in browser before continuing.

### Phase 3: Art Direction (1 task) — Painterly Cinematic

**Objective**: Establish unified visual style for cinematic broadcast TV backgrounds.

**Task**: `art-direction` (from game-development/art-asset-pipeline)
- Defines overall visual style as **painterly-cinematic** or **stylized realism**
- **NOT** cartoon/arcade aesthetic — this is cinematic broadcast TV, not a mobile game
- Creates master color palette inspired by broadcast TV color grading
- Establishes cinematic lighting approach (3-point lighting, color temperatures, depth)
- Character style guidelines that feel like TV talent, not game characters
- Creates mood board references from actual TV show production stills
- Writes style guide to `.a5c/processes/assets/style-guide.md`

**Breakpoint**: Review and approve art direction before asset specs.

### Phase 4: Asset Specifications (1 task)

**Objective**: Create detailed specs for external asset work based on style guide.

**Task**: `create-asset-specs`

Generates specifications for all 12 background images:
- intro-retro-tv, cold-open-glitch, morning-desk
- feud-board, sponsor-pedestal
- bachelor-mansion, limo-interior
- shark-warehouse, tribal-council
- maury-studio, control-room, credits-bg

Plus:
- 1 brand reveal video (5s, smoke + spotlight + "SPONSORED BY" text)

Output files:
- `.a5c/processes/assets/style-guide.md`
- `.a5c/processes/assets/illustrated-backgrounds-spec.md`
- `.a5c/processes/assets/brand-reveal-video-spec.md`

### Phase 5: Character Fix (1 task) — z-index Stacking Context

**Objective**: Resolve Steve's floating hand by establishing proper layer ordering.

**Task**: `fix-character-positioning` (z-index Analysis)
- Analyzes the full z-index stacking context for all visual layers
- Expected layer structure: Background → Steve character → Rose overlay → UI elements
- Identifies if roses need a dedicated overlay layer with higher z-index than Steve
- For layout fix: specifies exact z-index values for each stacking layer
- For asset fix: documents if Steve/roses need to be separate PNG layers with transparency
- May implement rose overlay layer mask that sits between Steve and the UI

**Breakpoint**: Decide how to handle the fix (Apply z-index / Separate assets / Skip).

### Phase 6: Verification (1 task)

**Objective**: Verify all changes meet quality standards.

**Task**: `verify-visual-quality`
- Tests each requirement area
- Scores pass/partial/fail with notes
- Calculates overall quality score (target: 80%+)

**Breakpoint**: Accept results or iterate on remaining issues.

## Agents Used

| Agent | Specialization | Tasks |
|-------|---------------|-------|
| visual-qa-scorer | UX/UI Design | analyze, verify |
| nextjs-developer | Web Dev | frame-removal |
| react-developer | Web Dev | darker-cards |
| design-mock-analyzer | UX/UI Design | asset-specs |
| ui-implementer | UX/UI Design | character-fix |

## Skills Referenced

- `specializations/web-development/skills/nextjs-app-router`
- `specializations/web-development/skills/tailwind-css`
- `specializations/web-development/skills/react-development`
- `specializations/ux-ui-design/skills/screenshot-comparison`

## Expected Outputs

### Code Changes
1. `src/data/screens.ts` - Added `hideTvFrame: true` to survey screens
2. `src/components/ScreenPlayer.tsx` - Modified to use `screen.hideTvFrame`
3. `src/app/globals.css` - Modified `--surface` CSS variable opacity

### Asset Specifications
1. Illustrated backgrounds spec (12 images) — painterly-cinematic style
2. Brand reveal video spec (1 video)
3. Character layer structure notes (z-index values or PNG separation)

### Verification Report
- Frame removal via `hideTvFrame`: pass/fail
- Card contrast via `--surface`: pass/fail
- Brand reveal: pass/fail (partial if specs only)
- Character z-index layering: pass/fail

## Success Criteria

- Overall verification score >= 80%
- Frame disappears smoothly when `screen.hideTvFrame === true`
- Answer text is clearly legible via `--surface` opacity adjustment
- Asset specifications follow painterly-cinematic style guide
- Character z-index layering is resolved or documented with layer structure

## DESIGN.md Compliance

This process adheres to the Code-as-Truth philosophy from DESIGN.md:

| Principle | Application |
|-----------|-------------|
| Data-driven architecture | Frame visibility via `hideTvFrame` property, not index checks |
| Semantic CSS tokens | Card contrast via `--surface` variable, not literal Tailwind |
| Cinematic broadcast TV | Painterly-cinematic art style, NOT cartoon/arcade |
| Proper abstraction | z-index stacking context analysis, not ad-hoc positioning |

## Post-Process Actions

After this process completes:
1. Create illustrated assets using the specs (AI generation or illustration)
2. Create brand reveal video using the spec
3. Replace `/public/sets/*.webp` with illustrated versions
4. Add `/public/videos/commercial-break.mp4`
5. Update `src/data/screens.ts` to reference new video
6. Re-run verification to confirm 100% quality
