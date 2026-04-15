---
phase: quick
plan: 260414-sok
subsystem: audio
tags: [logging, howler, ambient-music, diagnostics]
dependency_graph:
  requires: []
  provides: [ambient-music-diagnostic-logging]
  affects: [useAmbientMusic]
tech_stack:
  added: []
  patterns: [howler-constructor-options, console-log-prefix-filtering]
key_files:
  modified:
    - src/hooks/useAmbientMusic.ts
  created:
    - test/use-ambient-music.test.ts
decisions:
  - Move once('load') callback into inline onload constructor option to co-locate all handlers
  - Use console.error for failure events, console.log for success events
  - Use [AmbientMusic] prefix on all log messages for easy DevTools filtering
metrics:
  duration: 8m
  completed: 2026-04-14
  tasks_completed: 2
  files_modified: 2
---

# Quick Task 260414-sok: Add Diagnostic Logging and Error Handlers to useAmbientMusic

**One-liner:** Howler onload/onloaderror/onplayerror/onplay handlers with [AmbientMusic]-prefixed console output for tracing silent audio failures.

## What Was Done

Added four Howler event handlers inline in the `new Howl({...})` constructor in `useAmbientMusic.ts`:

- `onload` — logs `[AmbientMusic] Loaded: <src>` then runs existing fade-in logic (moved from `once('load', ...)`)
- `onloaderror` — logs `[AmbientMusic] Load error for <src>: <error>` via `console.error`
- `onplayerror` — logs `[AmbientMusic] Play error for <src>: <error>` via `console.error`
- `onplay` — logs `[AmbientMusic] Playing: <src>` via `console.log`

Created `test/use-ambient-music.test.ts` with 8 tests verifying all four handlers are wired and produce the correct console output prefix.

## Verification

- TypeScript: zero errors (`npx tsc --noEmit`)
- Tests: 128/128 pass (8 new tests + 120 pre-existing)
- Existing fade-in behavior unchanged (logic preserved inside onload)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `src/hooks/useAmbientMusic.ts` modified with all four handlers
- [x] `test/use-ambient-music.test.ts` created with 8 passing tests
- [x] Commit b3bf75e exists

## Self-Check: PASSED
