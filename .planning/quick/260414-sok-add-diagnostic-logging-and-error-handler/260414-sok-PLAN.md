---
phase: quick
plan: 260414-sok
type: execute
wave: 1
depends_on: []
files_modified:
  - src/hooks/useAmbientMusic.ts
  - test/use-ambient-music.test.ts
autonomous: true
requirements: [QUICK-260414-SOK]
must_haves:
  truths:
    - "Load failures are logged with source path"
    - "Playback failures are logged with source path"
    - "Successful loads are logged for confirmation"
    - "Playback start is logged for confirmation"
    - "All logs use [AmbientMusic] prefix for filtering"
  artifacts:
    - path: "src/hooks/useAmbientMusic.ts"
      provides: "Diagnostic logging and error handlers"
      contains: "[AmbientMusic]"
  key_links:
    - from: "Howl instance"
      to: "console.log/error"
      via: "onloaderror, onplayerror, onload, onplay handlers"
---

<objective>
Add diagnostic logging and error handlers to useAmbientMusic hook to trace background music failures.

Purpose: Enable debugging of silent audio failures that currently go undetected.
Output: Hook with comprehensive logging via Howler event handlers.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/hooks/useAmbientMusic.ts
@src/hooks/useAudioPlayer.ts (reference for onloaderror pattern)
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add Howler event handlers for diagnostics</name>
  <files>src/hooks/useAmbientMusic.ts</files>
  <behavior>
    - onloaderror: logs "[AmbientMusic] LOAD ERROR: {src}" with error details
    - onplayerror: logs "[AmbientMusic] PLAY ERROR: {src}" with error details
    - onload: logs "[AmbientMusic] Loaded: {src}"
    - onplay: logs "[AmbientMusic] Playing: {src}"
  </behavior>
  <action>
Add four Howler event handlers to the newHowl instantiation in useAmbientMusic.ts:

1. `onloaderror: (_id, error) => console.error('[AmbientMusic] LOAD ERROR:', src, error)`
2. `onplayerror: (_id, error) => console.error('[AmbientMusic] PLAY ERROR:', src, error)`
3. Modify existing `onload` to add: `console.log('[AmbientMusic] Loaded:', src)` before the fade logic
4. `onplay: () => console.log('[AmbientMusic] Playing:', src)`

Keep the existing onload fade-in logic intact. The new log statement goes at the start of the handler.
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
  </verify>
  <done>All four handlers present, TypeScript compiles clean</done>
</task>

<task type="auto">
  <name>Task 2: Add unit test for error handler callbacks</name>
  <files>test/use-ambient-music.test.ts</files>
  <action>
Create a new test file that verifies the Howler instance is created with the expected event handlers.

Test cases:
1. "creates Howl with onloaderror handler" - mock Howl constructor, verify onloaderror is a function
2. "creates Howl with onplayerror handler" - verify onplayerror is a function
3. "creates Howl with onload handler" - verify onload is a function (already existed but confirm)
4. "creates Howl with onplay handler" - verify onplay is a function

Use vitest and mock howler module. Pattern: capture constructor args, assert handlers exist.
  </action>
  <verify>
    <automated>npm test -- test/use-ambient-music.test.ts</automated>
  </verify>
  <done>All 4 handler tests pass</done>
</task>

</tasks>

<verification>
1. TypeScript compiles: `npx tsc --noEmit`
2. Tests pass: `npm test`
3. Manual verification: Open app, check browser console for [AmbientMusic] logs during screen transitions
</verification>

<success_criteria>
- useAmbientMusic.ts has onloaderror, onplayerror, onload (with log), onplay handlers
- All logs prefixed with [AmbientMusic]
- Error handlers use console.error, success handlers use console.log
- Existing fade-in behavior unchanged
- Tests confirm handlers are wired
- All existing tests still pass
</success_criteria>

<output>
After completion, create `.planning/quick/260414-sok-add-diagnostic-logging-and-error-handler/260414-sok-SUMMARY.md`
</output>
