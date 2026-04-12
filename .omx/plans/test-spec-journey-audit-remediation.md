# Test Spec: Journey Audit Remediation

## Verification Goals

Prove that the survey flow now preserves canonical data, restores coherent state on resume, and reports accurate review/submission information.

## Unit Tests

- Serializer converts each screen type into the expected answer rows/session patch
- View-only screens serialize to zero answer rows
- Serializer contract is explicit for composite inputs:
  - `three-text`
  - `two-text`
  - `multi-select`
  - `invest-or-pass`
- View-only screens do not inflate review answer counts
- Relationship screen maps relationship/anonymity correctly
- Resume-state helper rebuilds history/progress correctly from persisted progress
- Hydration helper restores previously persisted answers into revisited/resumed screens consistently

## Integration Tests

- Completing a text/select screen calls canonical persistence before navigation
- Persistence failure keeps the user on the current screen and surfaces retry/error UI
- Retry after persistence failure reuses the same in-flight value and succeeds without data loss
- Review screen displays only real answers and correct skipped/answered totals
- Resumed session renders correct current step, progress bar, and back-button availability
- Resumed/revisited screens preload their previously persisted values when that screen has canonical answer data
- Relationship screen updates canonical session metadata before downstream review/submit usage

## Existing Logic Regression Tests

- `getResumeScreen` behavior remains correct for first incomplete/all complete cases
- Final submit retry path still works

## Deferred / Optional E2E Coverage

- Full happy-path journey from cold open to final submit
- Refresh mid-survey, resume later, and verify restored review accuracy
- Failure injection on save to verify retry UX under browser conditions

## Manual Verification

- Start a fresh session and complete several screens; confirm rows exist in `survey_answers`
- Confirm no `survey_answers` rows are created for cold open / welcome / credits
- Refresh mid-journey and confirm progress bar/back behavior match the resumed location
- Toggle anonymity via the relationship step and review flow; verify canonical session state
- Submit successfully and verify completed state

## Commands

- `npm test`
- `npm run lint`
- `npm run build`

## Acceptance Gate

Do not call the remediation complete unless:

- canonical answers are persisted for completed answer screens
- view-only screens produce zero persisted answer rows
- review counts are accurate
- resume state is coherent
- persisted answer hydration behavior is deterministic and covered by tests
- silent mid-journey persistence failures are removed
