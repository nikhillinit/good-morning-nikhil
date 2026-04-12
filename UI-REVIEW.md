# UI Review -- Good Morning, Nikhil

**Audited:** 2026-04-12
**Baseline:** Abstract 6-pillar standards (no UI-SPEC.md found)
**Screenshots:** Not captured (no dev server detected on ports 3000, 5173, 8080)
**Target device:** Mobile-first (375px viewport, touch interactions)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | CTAs are strong and in-character, but zero error messages for users and some placeholders prime responses |
| 2. Visuals | 3/4 | Good hierarchy and layout, but captions and UI inputs overlap in vertical space; no background image fallback |
| 3. Color | 3/4 | Consistent palette with good accent discipline; yellow-300 on black/80 passes AA but is borderline; no hardcoded hex |
| 4. Typography | 3/4 | Clean hierarchy with 5 sizes and 3 weights, all within reason; caption text-sm (14px) is tight for mobile reading at arm's length |
| 5. Spacing | 2/4 | Touch targets mostly pass 44px, but grid buttons at px-3 py-3 are borderline; SkipButton py-2 (32px) fails; keyboard-active state hides progress bar but does not reposition input zone |
| 6. Experience Design | 2/4 | Smooth audio-to-UI reveal, but no back button on any screen, SingleSelect submits instantly with no undo, haptics defined but never called, no error boundary, no user-facing error messages |

**Overall: 16/24**

---

## Top 5 Friction Points (ranked by impact)

### 1. No back navigation -- irreversible answers across 17 screens

**Impact:** A user who mis-taps on SingleSelect (screen 5b -- bachelor-eliminate) immediately and permanently submits an answer. Across a 17-screen flow with no way to revisit any previous screen, a single accidental tap can ruin the experience. This is the single largest source of friction.

**File:** `src/app/page.tsx` (SurveyFlow component)
**Fix:** Add a back button (at minimum on non-start screens). Store `screenHistory` as a stack. On back, pop the stack and restore the previous screen. For SingleSelect specifically, add a confirmation step before calling `onSubmit`.

### 2. Zero user-facing error messages

**Impact:** When Supabase calls fail (session bootstrap, progress tracking, final submission), errors are silently swallowed with `console.error`. The user sees nothing -- they may think their responses were saved when they were not. On final submit failure (line 131), the catch block logs to console and still sets `submitted = true`, telling the user "That's a wrap" even though nothing was persisted.

**Files:**
- `src/app/page.tsx:70` -- bootstrap failure silently continues
- `src/app/page.tsx:119-120` -- progress persist failure silently continues
- `src/app/page.tsx:131-133` -- submit failure shows success state anyway

**Fix:** Add a toast/banner component for transient errors. On final submit failure, show a retry button instead of the success screen. Never set `submitted = true` when the submission actually failed.

### 3. SingleSelect submits on first tap with no confirmation

**Impact:** On the Bachelor elimination screen (8 options in a 2-column grid on a small phone), a user scrolling or accidentally brushing an option immediately submits it and advances. There is no selected state, no "Lock it in" button like MultiSelect has. This is inconsistent with every other input type.

**File:** `src/components/ui-inputs/index.tsx:219`
**Fix:** Add a `selected` state to SingleSelect (like MultiSelect). Show the selected option highlighted, then require a "Lock it in" tap to confirm. This matches the pattern already used for MultiSelect and keeps the interaction consistent.

### 4. SkipButton touch target is 32px tall (below 44px minimum)

**Impact:** The skip button uses `py-2` (8px top + 8px bottom) with `text-xs` (12px), giving an effective height of ~28-32px. Combined with starting opacity of 0.6, this is both hard to see and hard to tap on mobile. It also starts at 60% opacity, making it look disabled.

**File:** `src/components/SkipButton.tsx:20`
**Fix:** Change `py-2` to `py-3` (minimum) and `text-xs` to `text-sm`. Change initial animate opacity from 0.6 to 0.8. This brings the touch target to ~44px and improves visibility.

### 5. Keyboard active state does not reposition inputs upward

**Impact:** When the mobile keyboard opens on text/textarea inputs, the CSS rule hides the progress bar (good) but does nothing to ensure the active input remains visible. On shorter phones (iPhone SE, older Androids), the keyboard covers the submit button and potentially the input itself. The user must scroll manually.

**Files:**
- `src/app/globals.css:40-45` -- keyboard-active class only hides progress bar
- `src/hooks/useKeyboard.ts` -- detects keyboard but does not scroll to input

**Fix:** In `useKeyboard.ts`, after detecting keyboard open, call `document.activeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })`. Alternatively, add CSS: `body.keyboard-active .flex.min-h-screen { justify-content: flex-start; padding-top: 2rem; }` to shift content up.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**Strengths:**
- CTAs are specific and in-character: "Start Episode", "Lock it in", "Submit & Wrap", "Reveal" -- all action-oriented and thematic
- The Steve/Jeff banter in captions maintains consistent tone
- The submitted state copy ("That's a wrap. Nikhil will share what everyone said once all responses are in.") sets expectations well
- Loading state uses thematic copy: "Loading episode..." with tracking-wider treatment

**Issues:**
- **No error messages anywhere in the UI.** All error handling is `console.error` only. The user never sees feedback when something goes wrong.
  - `src/app/page.tsx:70-73` -- session bootstrap failure
  - `src/app/page.tsx:89-91` -- screen tracking failure  
  - `src/app/page.tsx:119-120` -- progress persist failure
  - `src/app/page.tsx:131-133` -- final submit failure still shows success

- **Some placeholders prime responses rather than staying neutral:**
  - `src/data/screens.ts:139` -- "Name a Nikhil trademark..." is neutral (good)
  - `src/components/ui-inputs/index.tsx:302` -- "Say what you've never said..." is leading/dramatic rather than neutral
  - `src/data/screens.ts:157` -- "What company, product, vibe, aesthetic, or brand..." is good (expansive, not leading)

- **Continue button descriptive text says "5 quick TV segments" but there are actually 8 show segments** (Family Feud, Commercial Break, The Bachelor, Shark Tank, Survivor, Maury, Control Room, Credits). This is misleading.
  - `src/components/ui-inputs/index.tsx:35-37`

- **Generic "Next" label** used on 6 different submit buttons (ShortText, TextArea, MadLib, LongTextWithAudio). While functional, it misses the opportunity for show-themed CTAs per segment.

### Pillar 2: Visuals (3/4)

**Strengths:**
- Clear layered hierarchy: background image > dark overlay (bg-black/50) > content (z-10)
- ShowBadge provides consistent orientation (show name + emoji)
- AnimatePresence transitions between screens are smooth (0.3s fade)
- Caption box with bg-black/80 backdrop-blur creates readable text overlay
- UI inputs slide up with opacity+y animation (0.4s ease-out)
- max-w-md (448px) on all input containers keeps forms readable on wider screens

**Issues:**
- **No background image fallback or loading state.** Images are set via inline `style={{ backgroundImage }}` with no `<img>` preloading, no skeleton, and no fallback color. If an image fails to load, the user sees raw black/50 overlay on nothing.
  - `src/components/ScreenPlayer.tsx:64-67`
  - Fix: Add `backgroundColor: '#0a0a0a'` to the style object as fallback. Consider preloading the next screen's background.

- **Captions positioned `bottom-24` overlap with UI input zone.** When `showUI` is true, captions hide (`visible={isPlaying && !showUI}`) -- but during the timed reveal window where both are visible simultaneously, captions at `bottom-24` (96px from bottom) can collide with the UI input container that is centered via `justify-center`.
  - `src/components/Captions.tsx:21` and `src/components/ScreenPlayer.tsx:78`

- **Progress bar is 1px tall (`h-1`)** -- effectively invisible on mobile. It works as orientation but is so thin users may never notice it.
  - `src/app/page.tsx:183`
  - Fix: Change `h-1` to `h-1.5` or `h-2` for better visibility.

### Pillar 3: Color (3/4)

**Strengths:**
- No hardcoded hex colors in any TSX file (zero `#` or `rgb()` matches)
- Consistent accent: yellow-500 for primary actions (buttons, focus borders), yellow-300 for selected state text and Steve's caption color
- Good semantic color use: green-500 for "I'm in", red-500 for "I'm out" and elimination hover
- Dark theme is consistent: zinc-900/80 inputs, zinc-700 borders, zinc-400/500 secondary text
- 60/30/10 split is roughly correct: 60% dark (black, zinc-900), 30% neutral (zinc-300/400/500 text), 10% accent (yellow)

**Issues:**
- **yellow-300 (`#fde047`) on bg-black/80 background** -- contrast ratio is approximately 12.6:1 (passes AA and AAA). Good.
- **blue-300 (`#93c5fd`) on bg-black/80 background** -- contrast ratio is approximately 8.9:1 (passes AA and AAA). Good.
- **zinc-500 (`#71717a`) on black background** -- used for secondary text ("Stay anonymous" label, loading text). Contrast ratio is approximately 4.6:1. Passes AA for normal text (4.5:1 minimum) but just barely. At text-sm (14px), this is below the 18px threshold for large text AA, meaning it must meet the stricter 4.5:1 ratio, which it does -- but barely.
  - `src/components/ui-inputs/index.tsx:379` -- "Stay anonymous" label
  - `src/app/page.tsx:151` -- "Loading episode..." text
  - Fix: Consider zinc-400 for better readability on these functional labels.

- **placeholder-zinc-500 on bg-zinc-900/80** -- placeholder text contrast is approximately 3.4:1 against the zinc-900 input background. This fails WCAG AA (4.5:1 required). However, placeholder text is not required to meet contrast guidelines per WCAG 1.4.3 (it is not "text" per the specification). Still worth improving for usability.
  - Fix: Change `placeholder-zinc-500` to `placeholder-zinc-400` across all inputs.

- **disabled:opacity-30** on yellow-500 buttons reduces contrast severely. A yellow-500 button at 30% opacity on a dark background becomes nearly invisible. This is likely intentional to discourage tapping, but `disabled:opacity-50` would be more standard.
  - `src/components/ui-inputs/index.tsx` -- 8 occurrences
  - Fix: Change `disabled:opacity-30` to `disabled:opacity-40` for a better balance.

### Pillar 4: Typography (3/4)

**Font sizes in use (5 distinct sizes):**
- `text-xs` (12px) -- SkipButton label
- `text-sm` (14px) -- Captions, ShowBadge name, multi/single-select option labels, form labels, secondary body text
- `text-base` (16px) -- Hero captions, MadLib stem, LongTextWithAudio prompt
- `text-lg` (18px) -- StartButton, SubmitButton, InvestOrPass buttons
- `text-2xl` (24px) -- Submitted state heading
- `text-4xl` (36px) -- Submitted state emoji (decorative)

**Font weights in use (3 distinct weights):**
- `font-medium` -- ContinueButton
- `font-semibold` -- Hero caption variant
- `font-bold` -- ShowBadge name, caption speaker label, all submit/action buttons, submitted heading

**Assessment:** 5 sizes and 3 weights is within acceptable range for a 17-screen app with varied input types.

**Issues:**
- **Caption text at `text-sm` (14px) is small for mobile.** Captions are the primary content delivery mechanism (users read them while audio plays). At 14px on a phone held at arm's length, readability suffers. Hero variant bumps to text-base, but normal and whisper captions stay at 14px.
  - `src/components/Captions.tsx:25`
  - Fix: Change caption base size from `text-sm` to `text-base` (16px). Keep hero at `text-lg` for differentiation.

- **text-xs (12px) on SkipButton** is extremely small on mobile. Combined with 60% opacity, it borders on invisible.
  - `src/components/SkipButton.tsx:20`

- **No explicit line-height on input fields.** The inputs use Tailwind defaults, which is fine, but `leading-relaxed` on captions suggests intentional line-height control -- yet it is not applied to textareas where users type multi-line responses.
  - `src/components/ui-inputs/index.tsx:137` (TextArea), line 304 (LongTextWithAudio)

### Pillar 5: Spacing (2/4)

**Touch target analysis (44px minimum per WCAG 2.5.5):**

| Element | Classes | Effective Height | Pass? |
|---------|---------|-----------------|-------|
| StartButton | `px-8 py-4 text-lg` | ~50px | Yes |
| ContinueButton | `px-8 py-3 font-medium` | ~44px | Borderline |
| Grid option buttons | `px-3 py-3 text-sm` | ~38px | **No** |
| Submit/Next buttons | `py-3 font-bold` | ~44px | Borderline |
| SkipButton | `px-4 py-2 text-xs` | ~28px | **No** |
| InvestOrPass buttons | `py-4 text-lg font-bold` | ~50px | Yes |
| Anonymous checkbox | `<input type="checkbox">` | ~16px | **No** |
| MadLib inline input | `border-b-2 max-w-48` | ~24px | **No** |

**Issues:**
- **4 elements fail the 44px touch target minimum:**
  1. SkipButton at ~28px -- `src/components/SkipButton.tsx:20`
  2. Grid option buttons (MultiSelect, SingleSelect, RelationshipPicker) at ~38px -- `src/components/ui-inputs/index.tsx:180,220,373`
  3. Anonymous checkbox at ~16px native size -- `src/components/ui-inputs/index.tsx:382`
  4. MadLib inline input -- `src/components/ui-inputs/index.tsx:271`

- **Grid gap-2 (8px) between tappable options** is adequate per WCAG but tight on mobile. With 8 options in a 2-column grid (MultiSelect), the touch density is high.
  - Fix: Change `gap-2` to `gap-3` (12px) and `py-3` to `py-3.5` on grid buttons.

- **No safe-area-inset-top on ShowBadge.** The badge uses `top-4` (16px) which on a notched iPhone may overlap the status bar area.
  - `src/components/ShowBadge.tsx:15`
  - Fix: Add `safe-top` class or use `top-[calc(1rem+env(safe-area-inset-top))]`.

- **SkipButton same issue** -- `right-4 top-4` without safe-area padding.
  - `src/components/SkipButton.tsx:20`

- **Content container uses `px-4` (16px)** horizontal padding. This is standard for mobile but leaves text running close to screen edges on 375px devices. `px-5` or `px-6` would give more breathing room.
  - `src/components/ScreenPlayer.tsx:73`

- **Keyboard state only hides progress bar** (`display: none` on `.fixed.bottom-0`). It does not scroll the input into view or adjust the layout. On devices where the keyboard takes 50% of viewport, the centered (`justify-center`) content may be partially occluded.
  - `src/app/globals.css:44-45`

### Pillar 6: Experience Design (2/4)

**Strengths:**
- Audio autoplay with 300ms delay is a nice touch for screen transitions
- `uiRevealAt` timed reveal reduces perceived wait vs forcing full audio listen
- SkipButton appears only during playback and disappears after -- clean conditional logic
- Captions sync to audio via requestAnimationFrame -- smooth and accurate
- Session resume via `getResumeScreen` means users can close and come back
- `onloaderror` in Howl falls through to `hasEnded = true`, so audio failures do not block the flow
- Keyboard detection via visualViewport API is the correct modern approach

**Issues:**
- **No back button anywhere in the 17-screen flow.** This is a forward-only experience with no way to correct mistakes. Combined with SingleSelect's instant-submit behavior, this is the primary friction source.
  - Fix: Add a back button to ScreenPlayer (hidden on screen 0). Use a history stack in SurveyFlow.

- **Haptics module is defined but never imported or called.** `src/lib/haptics.ts` defines 8 haptic patterns (roseSelect, sharkDecision, finalSubmit, etc.) but `triggerHaptic` is never imported in any component. This is dead code.
  - Fix: Wire up haptics -- `triggerHaptic('roseSelect')` in MultiSelect toggle, `triggerHaptic('sharkDecision')` in InvestOrPass, `triggerHaptic('finalSubmit')` in SubmitButton, `triggerHaptic('screenAdvance')` in handleComplete.

- **Animations module is defined but never imported.** `src/lib/animations.ts` defines 9 Framer Motion variant sets (cardSelect, eliminateCard, staggerChildren, interactiveScale, etc.) but none are imported in any component. Every component defines its own inline animation objects instead.
  - `src/components/ui-inputs/index.tsx:13-17` -- inline `inputAnimation` duplicates `uiReveal` from animations.ts
  - Fix: Import shared variants from animations.ts to ensure consistency and reduce duplication.

- **No ErrorBoundary.** No `error.tsx` file exists in `src/app/`. If a component throws during render, the entire app crashes to white screen with no recovery path.
  - Fix: Add `src/app/error.tsx` with a themed error screen and retry button.

- **SingleSelect has no confirmation step.** Unlike MultiSelect ("Lock it in" button) and every other input type, SingleSelect fires `onSubmit` immediately on tap. This is inconsistent and error-prone on the Bachelor elimination screen where 8 small buttons are tightly packed.
  - `src/components/ui-inputs/index.tsx:219`

- **RelationshipPicker also submits immediately on option tap** -- same pattern as SingleSelect. No confirmation.
  - `src/components/ui-inputs/index.tsx:372`

- **Final submit failure silently succeeds.** When `submitSession` throws on the credits screen, the catch block sets `submitted = true` anyway, showing the success screen while data was not persisted.
  - `src/app/page.tsx:131-134`

- **No confirmation dialog for "Submit & Wrap".** This is the final, irreversible action that ends the entire survey. A destructive action of this magnitude should have confirmation, especially since there is no back button.
  - `src/components/ui-inputs/index.tsx:396`

- **showAudioRecord config is defined but never implemented.** Screen 7 (Survivor) sets `showAudioRecord: true` in uiConfig, but `LongTextWithAudio` component ignores this config and only renders a textarea.
  - `src/data/screens.ts:304` and `src/components/ui-inputs/index.tsx:286-314`

- **Captions hidden when UI reveals but audio may still be playing.** When `timedReveal` triggers (e.g., 3.5s into audio on feud-top3), captions disappear (`visible={isPlaying && !showUI}`) even though the audio continues. The user loses the visual transcript of still-playing audio.
  - `src/components/ScreenPlayer.tsx:78`
  - Fix: Change condition to `visible={isPlaying}` or `visible={isPlaying && !hasEnded}` to keep captions during simultaneous caption+UI phase.

---

## Files Audited

| File | Purpose |
|------|---------|
| `src/data/screens.ts` | 17 screen definitions with audio/UI config |
| `src/components/ScreenPlayer.tsx` | Screen wrapper with audio, caption, UI orchestration |
| `src/components/ui-inputs/index.tsx` | 14 input components (StartButton through SubmitButton) |
| `src/components/Captions.tsx` | Timed caption display with speaker colors |
| `src/components/ShowBadge.tsx` | Show name + emoji badge |
| `src/components/SkipButton.tsx` | Skip audio button |
| `src/components/ClientShell.tsx` | Client shell for keyboard detection |
| `src/app/page.tsx` | Main page with session management and flow |
| `src/app/layout.tsx` | Root layout with viewport and font config |
| `src/app/globals.css` | Global styles including keyboard and safe-area |
| `src/hooks/useAudioPlayer.ts` | Howler.js audio playback |
| `src/hooks/useCaptions.ts` | Caption sync to audio currentTime |
| `src/hooks/useKeyboard.ts` | Virtual keyboard detection |
| `src/hooks/useResponses.ts` | In-memory response storage |
| `src/lib/haptics.ts` | Haptic feedback patterns (unused) |
| `src/lib/animations.ts` | Framer Motion variants (unused) |
| `src/lib/flow.ts` | Screen navigation and resume logic |
| `src/lib/captions/parser.ts` | SRT caption parser |
| `src/lib/captions/data.ts` | Pre-parsed caption data for all 17 screens |
