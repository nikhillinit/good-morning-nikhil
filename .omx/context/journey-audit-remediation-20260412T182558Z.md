## Task Statement

Create a consensus implementation plan to address the user-journey blockers and data-collection gaps identified in the Good Morning, Nikhil audit.

## Desired Outcome

Produce an execution-ready plan that fixes journey friction, makes response/session data trustworthy, improves resume/recovery behavior, and closes instrumentation gaps without adding new dependencies.

## Known Facts / Evidence

- The app is a mobile-first Next.js 16 survey flow in `src/app/page.tsx` with screen definitions in `src/data/screens.ts`.
- Screen progress is persisted to Supabase via `trackScreenEntry` and `completeScreenProgress`.
- Actual answer payloads are not currently persisted from the rendered UI flow.
  - `src/app/page.tsx` stores answers only in `useResponses`.
  - `src/hooks/useAutosave.ts` and `src/lib/answers.ts` exist but are not wired into rendered inputs.
- Resume logic restores `currentScreenId` from progress rows but does not restore matching history/progress state for navigation UX.
- Session-level fields such as `relationship_type`, `relationship_other`, `anonymous`, `captions_enabled`, and `started_from_resume` exist in the database schema but are only partially or not at all updated from the UI.
- Instrumentation-oriented schema fields such as `used_audio_on_screen`, `used_captions_on_screen`, `media_url`, `normalized_value`, `option_value`, and `input_method` exist but are not meaningfully populated.
- `showAudioRecord: true` is configured for the Survivor screen, but no recorder or answer upload path is implemented.
- Review summary counts local in-memory entries as “answers recorded,” including view-only steps.
- Existing verification status:
  - `npm run build` passes.
  - `npm test` passes when run outside sandbox.
  - `npm run lint` passes with warnings only.

## Constraints

- No new dependencies without explicit request.
- Keep diffs small, reviewable, and reversible.
- Prefer deletion/reuse over adding abstractions.
- Run lint, typecheck/build, tests, and static analysis after changes.
- Existing behavior should be protected with regression tests before cleanup/refactor style edits where behavior is not already locked.
- Planning should cover all issues from the audit, but implementation can still be phased by risk and dependency order.

## Unknowns / Open Questions

- Whether voice input should be fully implemented now or explicitly deferred behind schema-compatible placeholders.
- Whether the intended answer model should store one row per screen or one row per prompt/subfield for composite inputs.
- Whether resume should restore draft input values directly from Supabase, local memory, or both.
- Whether anonymous mode should remain toggleable only on review or be session-global from the relationship screen onward.

## Likely Codebase Touchpoints

- `src/app/page.tsx`
- `src/components/ScreenPlayer.tsx`
- `src/components/ReviewScreen.tsx`
- `src/components/ui-inputs/index.tsx`
- `src/hooks/useResponses.ts`
- `src/hooks/useAutosave.ts`
- `src/hooks/useCaptions.ts`
- `src/lib/answers.ts`
- `src/lib/flow.ts`
- `src/lib/screen-progress.ts`
- `src/lib/session.ts`
- `src/lib/session-storage.ts`
- `src/types/index.ts`
- `src/data/screens.ts`
- `test/flow.test.ts`
- Potential new tests under `test/`
- Existing Supabase migrations only if schema changes are truly necessary
