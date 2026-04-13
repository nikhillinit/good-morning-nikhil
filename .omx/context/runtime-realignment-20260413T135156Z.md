## Task Statement

Create an execution-ready plan to realign the tracked runtime with the intended
new survey state: land the runtime changes in `screens.ts`, `ScreenPlayer.tsx`,
`Captions.tsx`, and `globals.css` first, then keep only the tests and docs that
match that real state.

## Desired Outcome

Produce a concrete plan that:
- fixes the runtime/test drift
- prioritizes implementation order inside the runtime layer
- defines what tests/docs stay, what waits, and how to verify completion

## Known Facts / Evidence

- The tracked runtime still reflects the old state:
  - `src/data/screens.ts` still contains `sponsor-brand` and `sponsor-why`
  - `survivor` still precedes `maury`
  - `src/components/ScreenPlayer.tsx` does not render `CrtOverlay`
  - `src/components/Captions.tsx` still uses the old caption box
  - `src/app/globals.css` still lacks the lower-third/theme classes
- New tests/docs/config files exist as untracked proposals:
  - `test/screen-arc.test.ts`
  - `test/screen-player.test.tsx`
  - `test/captions.test.tsx`
  - `playwright.config.ts`
  - `docs/user-journeys.md`
- Review findings already concluded the proposed tests are ahead of the runtime.
- The user direction is to land runtime first, then keep only tests/docs that
  match the real state.

## Constraints

- Keep the runtime realignment narrow and reversible.
- Do not widen into unrelated art-direction or export work.
- No new dependencies without explicit need.
- Preserve working flows while changing screen order and presentation.
- Verification must include tests, lint, typecheck, and browser journey if the
  browser lane is meant to survive.

## Unknowns / Open Questions

- Whether the runtime pass should include only reorder/removal plus presentation
  hooks, or also activate the new browser lane in `package.json`/`TESTING.md`
  immediately after runtime is aligned.
- Whether `commercial-break` should become a true bumper in runtime now, or
  whether that stays a follow-up after sponsor-question removal.

## Likely Codebase Touchpoints

- `src/data/screens.ts`
- `src/components/ScreenPlayer.tsx`
- `src/components/Captions.tsx`
- `src/app/globals.css`
- `src/components/ui-inputs/index.tsx` (if runtime changes require new affordances)
- `src/lib/captions/data.ts`
- `src/lib/screen-prompts.ts`
- `test/screen-arc.test.ts`
- `test/screen-player.test.tsx`
- `test/captions.test.tsx`
- `test/e2e/core-journey.spec.ts`
- `TESTING.md`
- `package.json`
- `playwright.config.ts`
