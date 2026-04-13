---
phase: quick
plan: 260413-3fa
subsystem: voice-upload
tags: [offline, indexeddb, resilience, voice, tdd]
dependency_graph:
  requires: []
  provides: [voice-upload-offline-queue]
  affects: [screen-response-persistence, page-bootstrap]
tech_stack:
  added: [fake-indexeddb (devDependency)]
  patterns: [raw IndexedDB API, dynamic import to break circular dep, window.online event listener]
key_files:
  created:
    - src/lib/voice-queue.ts
    - test/voice-queue.test.ts
  modified:
    - src/lib/screen-response-persistence.ts
    - src/app/page.tsx
    - package.json
decisions:
  - "Raw IndexedDB API used instead of idb library — bounded use case, no new runtime dep"
  - "Dynamic import of uploadVoiceResponse inside flushVoiceQueue to break circular dependency"
  - "_resetDbForTesting exported for test isolation; fake-indexeddb/auto polyfill strategy over vi.resetModules"
  - "resolvePersistableValue returns {mediaUrl:undefined, blob:undefined} on upload failure — survey advances, answer patched on flush"
metrics:
  duration_seconds: 311
  tasks_completed: 2
  files_changed: 5
  completed_date: 2026-04-13
---

# Quick Task 260413-3fa: IndexedDB Offline Queue for Voice Responses — Summary

**One-liner:** Raw-IndexedDB queue (gmn-voice-queue / pending-uploads) stashes failed voice blobs by `sessionId/screenId` key, retries on app load and `online` events, and patches the Supabase answer row with the real public URL on success.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create voice-queue.ts — IndexedDB offline queue module | a0a4540 | src/lib/voice-queue.ts, test/voice-queue.test.ts, package.json |
| 2 | Wire queue into upload path and add retry-on-load/online | b8fbc76 | src/lib/screen-response-persistence.ts, src/app/page.tsx |

## What Was Built

**`src/lib/voice-queue.ts`** — New module. Raw IndexedDB, no runtime dependencies.
- DB: `gmn-voice-queue` v1, store: `pending-uploads`, keyPath: `key` (`sessionId/screenId`)
- `enqueueFailedUpload` — upsert via `put`, so re-queuing the same screen overwrites
- `getQueueSize` — count of pending entries
- `flushVoiceQueue(onUploaded?)` — reads all entries, calls `uploadVoiceResponse` for each, deletes on success, keeps on failure, returns `{flushed, failed}`
- All functions no-op safely (return undefined / 0 / `{flushed:0,failed:0}`) when `typeof indexedDB === "undefined"` (SSR, old browsers)
- `_resetDbForTesting` exported for test isolation (closes cached connection)

**`src/lib/screen-response-persistence.ts`** — `resolvePersistableValue` now wraps `uploadVoiceResponse` in try/catch. On failure: warns to console, enqueues blob, returns `{...value, mediaUrl:undefined, blob:undefined}`. Survey advances; empty `answers[]` is written (existing `serializeVoiceFirstAnswer` behavior when `mediaUrl` is falsy).

**`src/app/page.tsx`** — Added `useEffect` in `SurveyFlow` that:
1. Calls `flushVoiceQueue` on mount with an `onUploaded` callback that calls `replaceAnswersForScreen` to patch the Supabase row with the real `media_url`
2. Adds a `window.online` event listener that re-runs the same flush
3. Cleans up the listener on unmount
4. Guarded by `typeof window !== "undefined"` and `HAS_SUPABASE`

## Test Results

6 new tests in `test/voice-queue.test.ts` (TDD: RED then GREEN):
1. enqueue stores entry, getQueueSize returns 1
2. upsert: same sessionId+screenId twice = 1 entry
3. flush success: removes entry, calls onUploaded, returns `{flushed:1, failed:0}`
4. flush failure: keeps entry, returns `{flushed:0, failed:1}`
5. flush mixed: returns correct split counts
6. SSR guard: all functions return safe defaults when `indexedDB` is undefined

Full suite: **83 tests pass**, 0 failures. `npx tsc --noEmit` clean.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] IDB connection blocking in test beforeEach**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** `vi.resetModules()` + `indexedDB.deleteDatabase()` caused `deleteDatabase` to block because the module's cached IDBDatabase connection was still open from the previous test. Tests timed out at 5-10s each.
- **Fix:** Exported `_resetDbForTesting()` from `voice-queue.ts` (closes + nulls the cached connection). Tests call it before `deleteVoiceQueueDb()`, so no open connections block the delete. Dropped `vi.resetModules()` entirely — imports are stable with the top-level `vi.mock`.
- **Files modified:** `src/lib/voice-queue.ts`, `test/voice-queue.test.ts`
- **Commit:** a0a4540

**2. [Rule 1 - Bug] Duplicate @/types import after adding AnswerType/InputMethod**
- **Found during:** Task 2 import additions
- **Issue:** Adding `import { AnswerType, InputMethod } from "@/types"` created a duplicate `@/types` import alongside the existing `import { CompletionStatus } from "@/types"`.
- **Fix:** Merged into single `import { AnswerType, CompletionStatus, InputMethod } from "@/types"`.
- **Files modified:** `src/app/page.tsx`
- **Commit:** b8fbc76

## Known Stubs

None — all data paths are fully wired.

## Threat Flags

No new trust boundaries beyond those in the plan's threat model. `flushVoiceQueue` receives `publicUrl` from `uploadVoiceResponse` return value (Supabase-controlled), not from user input. `onUploaded` callback uses `sessionId`/`screenId` from the queue entry, not from user-supplied values. T-q-02 (bounded growth) and T-q-04 (URL injection prevention) are satisfied by design.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/lib/voice-queue.ts | FOUND |
| test/voice-queue.test.ts | FOUND |
| src/lib/screen-response-persistence.ts | FOUND |
| src/app/page.tsx | FOUND |
| commit a0a4540 | FOUND |
| commit b8fbc76 | FOUND |
