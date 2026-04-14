# Design System & Constraints

"Good Morning, Nikhil" is a specialized interactive television broadcast experience. It follows a strict "Code-as-Truth" philosophy. 
Layouts, interactions, and theming must be consistent and cinematic, drawing on daytime television rather than arcade or mobile game tropes.

## Core Directives

1. **No Arcade Tropes**: Do not use classic game-show features (like score counters, bouncy borders, spinning wheel transitions) unless explicitly instructed as a narrative bit.
2. **Television Frame**: The unified `TelevisionFrame.tsx` handles aspect-ratio boxing. Everything inside should feel like pre-recorded, cinematic footage with overlays.
3. **Typography**: Always use the semantic typography utility classes inside `@utility`:
   - `text-display`: Shows up for large, impactful text (show titles, primary prompts).
   - `text-prompt`: Used for narrative questions.
   - `text-body`: Used for description text, instructions, secondary copy.
   - `text-caption`: Used for highly-reduced metadata, labels, and disclaimers.
4. **Color Tokens**: Always use semantic background and text colors. Do not manually apply literal Tailwind palettes like `bg-yellow-500` or `text-zinc-400`.
   - `--accent`: The primary interaction and theme color (`text-accent`, `bg-accent`).
   - `--surface`: Standard component and overlay background (`bg-surface`).
   - `--muted`: Secondary/disabled text (`text-muted`).
   - `--foreground`: Primary white/light text (`text-foreground`).
   - `--error`: Destructive text and backgrounds (`text-error`, `bg-error`).
   - `--success`, `--success-soft`, `--success-strong`: Positive action states and selected confirmations.
   - `--danger`, `--danger-soft`, `--danger-foreground`: Failure banners and destructive emphasis.
   - `--info`, `--info-soft`: Non-blocking informational callouts.
5. **UI Primitives**: Interactions must rely on strictly controlled primitives.
   - `PrimaryButton`: The `Lock it in` standard.
   - `SecondaryButton`: Soft back/skip actions.
   - `InputField`: Universal text input logic.
   - `ChoiceChip`: Universal single/multi-selector buttons.

## Tailwind Restrictions

A planned lint rule or manual constraint enforces the strict ban of:
- `bg-yellow-*`, `text-yellow-*`, `border-yellow-*`
- `bg-zinc-*`, `text-zinc-*`, `border-zinc-*`
- `bg-red-*`, `text-red-*`, `border-red-*`

Instead, always reach for the semantic abstractions `bg-accent`, `text-muted`, `border-surface-hover`, etc.

## Asset Integrity

- Every screen in `src/data/screens.ts` must reference assets that exist under `public/`.
- If a screen is allowed to reuse an existing audio or background asset for pacing, that should be explicit rather than relying on missing-file load errors.
- Caption IDs in `src/lib/captions/data.ts` and prompt IDs in `src/lib/screen-prompts.ts` must stay aligned with screen IDs, or be intentionally aliased.

## Layout Configuration

- Mobile bounds are controlled by `h-screen-safe`.
- Interactive touch targets adhere to a `min-h-[48px]` minimum bounding box.
- Padding inside cards is defined safely via global `screen-content-card` utilities.
