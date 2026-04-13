---
phase: quick
plan: 260413-uj1
subsystem: documentation
tags: [journeys, testing, ux, docs, playwright, e2e]
dependency_graph:
  requires: []
  provides: [core-user-journey-spec, browser-e2e-lane]
  affects: [testing-guidance, browser-qa]
key_files:
  created:
    - playwright.config.ts
    - test/e2e/core-journey.spec.ts
    - docs/user-journeys.md
  modified:
    - .gitignore
    - TESTING.md
    - package.json
    - package-lock.json
decisions:
  - "Add a single high-value browser journey rather than a full survey matrix"
  - "Target the first-run path to first successful answer, following architect guidance to minimize flake"
  - "Use typed fallback on voice-first screens to avoid microphone/browser-permission dependency"
metrics:
  tasks_completed: 2
  files_changed: 7
  completed_date: 2026-04-13
---

# Quick Task 260413-uj1: Core User Journeys — Summary

**One-liner:** Added a real Playwright browser journey for the first-run
respondent path, plus the supporting config/docs so the repo now has a runnable
E2E lane.

## What Changed

### Browser E2E Harness

**`playwright.config.ts`**
- Added a minimal Playwright harness for this repo
- Uses a single `journey` project with a Chromium-based mobile preset
- Starts the app with `next build && next start` for a deterministic browser lane

**`test/e2e/core-journey.spec.ts`**
- Added one browser journey covering:
  - media consent gate
  - cold-open advancement
  - welcome advancement
  - relationship selection
  - first answer submission on `feud-top3`
  - verified handoff to `feud-strongest`
- Used typed fallback on the voice-first screen to avoid microphone dependency
- Used accessibility-first selectors and screen-scoped buttons for stability

**`package.json` / `package-lock.json`**
- Added `@playwright/test`
- Added:
  - `npm run test:e2e:install`
  - `npm run test:e2e`
  - `npm run test:e2e:headed`

**`.gitignore`**
- Ignored `test-results/` so Playwright artifacts do not pollute git status

### Documentation Alignment

**`docs/user-journeys.md`**
- Added the new browser journey to the automated coverage map
- Narrowed the remaining E2E gaps list to the still-missing browser paths

**`TESTING.md`**
- Updated E2E from “future” to an active Playwright lane
- Added the runnable E2E commands
- Documented the Windows Edge default vs one-time Chromium install for other environments
- Kept `docs/user-journeys.md` as the behavioral source of truth

## Verification

- `npm test` -> PASS (13 files, 89 tests)
- `npm run lint` -> PASS
- `npx tsc --noEmit` -> PASS
- `npm run build` -> PASS
- `npm run test:e2e` -> PASS (1 Playwright journey)

## Notes

- The architect review steered the scope away from a full-survey browser test and
  toward the first-run path to first answer, which is the highest-value missing
  seam with the lowest flake risk.
- Remaining friction worth future browser coverage:
  - resume journey
  - submit failure / retry
  - offline voice-upload recovery
  - full episode completion journey
