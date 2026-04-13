Task statement

Add the missing offline recovery path for voice-response uploads: the Supabase storage bucket must exist as a public bucket named `voice-responses`, and when `uploadVoiceResponse` fails the recorded blob should be queued in IndexedDB for later retry instead of blocking answer persistence indefinitely.

Desired outcome

- Manual infra step is explicit: create Supabase Storage bucket `voice-responses`, public visibility, default size limit.
- Client-side persistence no longer hard-fails only because audio upload fails.
- Failed voice uploads are stashed in IndexedDB with enough metadata to retry later.
- Retrying drains the queue and updates persisted survey answers/session state so hydrated review data eventually points at the public Supabase URL.
- Tests cover queueing, retry success, and non-voice persistence behavior staying intact.

Known facts / evidence

- `src/lib/supabase/storage.ts` uploads audio to bucket `voice-responses` and returns `getPublicUrl(...)`.
- `src/lib/screen-response-persistence.ts` calls `uploadVoiceResponse(sessionId, screen.id, value.blob)` inside `resolvePersistableValue`.
- `src/app/page.tsx` treats any `persistScreenResponse(...)` failure as a blocking save error and keeps the user on the current screen with a Retry CTA.
- `src/lib/response-contract.ts` only serializes voice-first audio answers when `mediaUrl` is present; otherwise the answer list is empty.
- `src/components/ui-inputs/VoiceRecorder.tsx` submits `{ mode: "audio", blob, mediaUrl: blobUrl }` before upload succeeds.
- Repo currently has no IndexedDB helper or dependency and Vitest setup does not yet polyfill IndexedDB.

Constraints

- No new dependency unless clearly justified; repo guidance prefers reusing patterns and avoiding new packages.
- Keep behavior for text and non-voice screens unchanged.
- Keep diffs small, reversible, and reviewable.
- Final implementation will need lint/test verification.

Unknowns / open questions

- Should queued uploads be flushed opportunistically on app boot, after each successful session bootstrap, on network reconnect, or all three?
- How should persisted answers reference a voice response before remote upload succeeds: skip answer creation until retry succeeds, or persist a local pending marker separately?
- Whether retry logic should live inside `screen-response-persistence.ts`, a dedicated voice-upload queue module, or a higher-level page/session bootstrap hook.

Likely codebase touchpoints

- `src/lib/supabase/storage.ts`
- `src/lib/screen-response-persistence.ts`
- `src/lib/response-contract.ts`
- `src/app/page.tsx`
- `src/components/ui-inputs/VoiceRecorder.tsx`
- `test/page-remediation.test.tsx`
- new queue-focused client-side persistence module under `src/lib/`
- `test/setup.ts` and possibly new queue/unit tests
