# PRD: Journey Audit Remediation

## Goal

Fix the user-journey and data-collection issues identified in the survey flow so that:

- completed screens produce trustworthy persisted answer data
- resume behavior restores a coherent user experience
- session-level metadata is canonically stored
- review/submit accurately reflects what was recorded
- instrumentation gaps are closed or explicitly deferred

## Scope

### In scope

- Wire canonical answer persistence into the existing flow
- Normalize screen values into `survey_answers` rows
- Map relationship/anonymity into `survey_sessions`
- Fix resume navigation/progress state
- Make mid-journey persistence failures visible and non-silent
- Correct review summary/counting
- Populate high-value existing instrumentation fields where behavior already exists
- Add regression coverage for serialization, resume, review, and failure handling

### Out of scope for the first execution pass

- New dependencies
- Broad state-management rewrite
- New Supabase tables unless implementation proves the current schema is insufficient
- Full voice-recording feature unless explicitly approved after planning

## Problem Summary

The current flow persists screen progress but not the real answer payloads. Resume restores only the target screen, not the journey state around it. Early metadata collection is disconnected from the canonical session record. Several schema fields suggest instrumentation that is not actually wired. The result is a user flow that appears healthy but can produce incomplete or misleading data.

## Users / Stakeholders

- Survey respondents, who need a coherent resume/review/submit experience
- Nikhil / survey owner, who needs accurate response and segmentation data
- Future maintainers, who need a simple, testable flow without extra dependencies

## Success Criteria

- Every non-view-only screen completion persists canonical answer data or blocks advancement with a visible retry path
- Resume restores progress bar/back-navigation state consistently with persisted progress
- Relationship and anonymity are reflected in canonical `survey_sessions` state
- Review screen shows only real answer content and correct counts
- View-only screens do not create `survey_answers` rows or inflate review metrics
- Existing tests stay green and new regression tests protect the fixes
- Build passes and lint/test remain clean enough for execution handoff

## Implementation Strategy

### Phase 1: Canonical answer model

- Add a small serialization layer that converts `(screen, value)` into:
  - zero or more `survey_answers` upserts
  - optional `survey_sessions` patch data
- Prefer one extracted utility module over a large provider/state rewrite
- Use stable prompt keys/order indices per screen and subfield

#### Canonical contract decisions

- View-only screens (`start-button`, `continue-button`, `submit-button`) write no `survey_answers` rows.
- The relationship screen must patch canonical `survey_sessions` fields (`relationship_type`, `anonymous`, and `relationship_other` when applicable) instead of existing only as generic review data.
- Composite screens (`three-text`, `two-text`, `multi-select`) must serialize deterministically with stable prompt keys and order indices so resume/review hydration is lossless.
- High-confidence answer metadata should be filled during serialization where trivial:
  - `option_value` for discrete choices
  - `normalized_value` for normalized select/text values when applicable
  - `input_method` for tap vs text paths
- Define the canonical contract before implementation:
  - which screens create `survey_answers` rows versus only session patches
  - how composite inputs (`three-text`, `two-text`, `multi-select`, `invest-or-pass`) map to `prompt_key`, `order_index`, `option_value`, `normalized_value`, and `input_method`
  - whether relationship/anonymity live in `survey_sessions`, `survey_answers`, or both
- Treat the database-backed answer/session shape as canonical and any in-memory response map as a derived cache only

### Phase 2: Persist before advancing

- In `handleComplete`, persist canonical answer/session data alongside screen progress
- Prevent silent continuation on persistence failure
- Add a user-visible retry affordance for non-final steps
- Keep the user on the current screen until canonical persistence succeeds or the user explicitly retries/cancels
- Decide one failure UX pattern up front (inline banner + retry is preferred over modal churn)

### Phase 3: Resume and review correctness

- Rehydrate navigation/progress state from persisted progress instead of relying on the default history initializer
- Rework review summary/counting to use canonical hydrated answer data, not synthetic button booleans or ephemeral refs
- Ensure resumed sessions preserve coherent review output

#### Canonical read path

- Add one shared hydration path for persisted answer/session data and use it for:
  - resume reconstruction
  - review rendering/counting
  - any future edit/back-navigation state that depends on existing answers
- Do not let review and resume read from different sources of truth.
- Define hydration behavior for resumed or revisited answer screens:
  - whether previously saved values are reloaded into the UI controls
  - whether “back” restores drafts from canonical persisted answers or only navigation state
- Remove or repurpose local-only response state so review and resume cannot drift from persisted truth

### Phase 4: Instrumentation closure

- Set `started_from_resume` when resuming an existing session
- Persist high-confidence fields now, such as `option_value`, `normalized_value`, and `input_method` where trivial
- Explicitly defer recorder/media-specific fields until the audio-record feature exists
- Either surface and track captions properly or defer caption usage tracking with a clear note

#### Explicitly deferred

- Voice recording UI and storage upload
- `media_url` population
- Audio/caption usage analytics fields unless the corresponding controls and events are implemented in the same pass
- Broader event-log style analytics beyond the current schema

## Risks

- Serialization mistakes could corrupt answer shape across multiple screen types
- Blocking progression on save failure could feel harsher if the retry UX is weak
- Resume-state changes could introduce navigation regressions without targeted tests
- Ambiguity around draft hydration could cause a second round of refactors after persistence is wired

## Mitigations

- Test the serializer first with screen-by-screen fixtures
- Keep the persistence orchestration in one thin integration point
- Add explicit regression tests for resume, review counts, and session metadata mapping
- Cache the in-flight value locally only as retry support; persisted data remains canonical
- Freeze the answer-serialization and draft-hydration contract in tests before broader implementation

## Handoff Note

Recommended execution lane:

- `ralph` if one agent should implement sequentially with strong verification discipline
- `team` if splitting into:
  - answer serialization + persistence wiring
  - resume/review UX state repair
  - tests/verification

### ADR

- Decision: incremental remediation over architectural rewrite
- Drivers:
  - the app currently appears healthy while producing incomplete data
  - resume restores location but not full journey context
  - the lowest-risk path is a thin serializer/persistence seam on top of the existing schema
- Alternatives considered:
  - central survey-state rewrite
  - broader schema/event-log expansion before fixing the current flow
- Why chosen: the present defects are integration and hydration failures, not evidence that the app needs a new framework or dependency
- Consequences:
  - `src/app/page.tsx` remains the orchestration surface for this pass
  - answer serialization and draft hydration must stay explicit in code and tests
  - richer media or accessibility analytics can be handled in a later scoped pass
- Follow-ups:
  - re-evaluate schema needs only if the serializer cannot represent the current screen set cleanly
  - defer voice/media instrumentation until the corresponding UX exists

### Available Agent Types

- `executor`
- `architect`
- `debugger`
- `test-engineer`
- `verifier`
- `writer`

### Suggested Staffing

- `ralph` path:
  - primary owner: `executor` with high reasoning
  - final validation: `verifier` with high reasoning
- `team` path:
  - lane 1: `executor` with high reasoning for answer serialization and persistence wiring
  - lane 2: `executor` with medium/high reasoning for resume and review hydration/state repair
  - lane 3: `test-engineer` with medium reasoning for regression coverage
  - final pass: `verifier` with high reasoning

### Launch Hints

- Sequential:
  - `$ralph implement .omx/plans/prd-journey-audit-remediation.md using .omx/plans/test-spec-journey-audit-remediation.md as the acceptance gate`
- Parallel:
  - `$team implement .omx/plans/prd-journey-audit-remediation.md with lanes for persistence, resume-review state, and tests; verify against .omx/plans/test-spec-journey-audit-remediation.md`

### Verification Path

- Automated:
  - `npm test`
  - `npm run lint`
  - `npm run build`
- Manual:
  - complete a fresh journey and verify canonical answer rows in `survey_answers`
  - refresh mid-journey and verify resumed progress bar, back behavior, and hydrated answers
  - verify relationship/anonymity changes are reflected in canonical session state
  - verify review counts exclude view-only screens
  - verify final submit still lands in completed state
