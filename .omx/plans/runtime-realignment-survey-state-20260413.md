# Runtime Realignment Plan: Survey State

## RALPLAN-DR Summary

### Principles

1. Runtime truth first: change the live survey contract before promoting any test or doc that describes it.
2. Treat all runtime-owned contract tables as one surface: screen data, prompt fallback, caption registry, and view-only/review semantics must stay aligned.
3. Separate behavioral runtime changes from cosmetic presentation changes so verification can isolate regressions cleanly.
4. Delete drift aggressively: after runtime lands, keep only the tests/docs/config that the repo can actually execute.
5. Browser verification is a policy choice, not a side effect. Keep or remove the Playwright lane explicitly.

### Decision Drivers

1. The tracked runtime still contains the old sponsor-question arc, old back-half ordering, and old presentation layer.
2. Proposed tests/docs/config already encode a different survey contract (`commercial-break`, `maury` before `survivor`, CRT/lower-third styling, browser lane).
3. The user explicitly wants runtime changes landed first, then only matching tests/docs retained.

### Viable Options

#### Option A: Runtime-first realignment with explicit contract inventory

- Land all runtime-owned contract changes first:
  - `src/data/screens.ts`
  - `src/lib/screen-prompts.ts`
  - `src/lib/captions/data.ts`
  - `src/components/ScreenPlayer.tsx`
  - `src/components/Captions.tsx`
  - `src/app/globals.css`
  - any affected flow/review contract surfaces if `commercial-break` changes answerability semantics
- Then reconcile tests/docs/config to the landed runtime.

**Pros**
- Matches user direction
- Prevents tests/docs from ratifying unsupported behavior
- Keeps scope bounded while still acknowledging the real contract surface

**Cons**
- Leaves the browser-lane decision for a second stage
- Requires careful inventory so prompt/caption/review contracts do not lag behind screen order changes

#### Option A1: Runtime arc only, defer CRT/lower-third presentation

- Land only the survey-arc and contract-table changes now.
- Explicitly defer `ScreenPlayer` presentation changes, `Captions` lower-third treatment, and related CSS/test changes.
- Remove or defer any proposed tests that assume CRT/lower-third runtime behavior.

**Pros**
- Lowest-risk realignment path
- Smaller blast radius
- Fastest route to runtime/test consistency

**Cons**
- Leaves the visible prototype-grade presentation untouched
- Requires a second runtime pass for the show-identity improvements

#### Option B: Atomic migration of runtime + tests/docs/browser support

- Land runtime changes, all proposed tests, docs, Playwright config, package scripts, and verification policy in one pass.

**Pros**
- Produces one internally coherent baseline
- Avoids an intermediate state where some contracts are updated and some are not

**Cons**
- Scope widens materially into package/tooling policy
- Harder to review and revert
- Risks bundling unrelated verification decisions into a runtime refactor

#### Chosen Option

Option A.

Why: it preserves the user’s runtime-first directive, explicitly widens tranche 1 to **all runtime-owned contract tables**, and now makes a hard call on the remaining ambiguities:

- **CRT/lower-third are IN scope for landed runtime**
- **Browser lane adoption is DEFERRED in this realignment**

That keeps the pass user-facing enough to matter while preventing unsupported Playwright/tooling claims from being promoted at the same time.

## Ordered Implementation Steps

### Step 1: Contract inventory baseline

Create a compact inventory of the current runtime contract:

- screen ID list and order
- which screens are answerable vs view-only
- prompt fallback coverage
- caption registry coverage
- reviewable count implications
- currently tracked browser-lane claims

Acceptance:
- the implementation lane has a checklist that can be used to verify all contract tables after edits

### Step 2: Realign the survey arc in `screens.ts`

Update `src/data/screens.ts` to the intended runtime order:

- remove `sponsor-brand`
- remove `sponsor-why`
- add `commercial-break` as a `continue-button` bumper
- source `commercial-break` directly from the former sponsor segment runtime assets:
  - `audio: "/vo/04a-sponsor.mp3"`
  - `bg: "/sets/sponsor-pedestal.webp"`
  - caption/ad-copy content derived from the former `sponsor-brand` beat
- change `cold-open.uiRevealAt` from `48.0` to `20.0`
- place `commercial-break` after `bachelor-limo`
- move `maury` before `survivor`

Lock `commercial-break` semantics up front:

- it is **view-only**
- it does **not** create answer rows
- it should not change reviewable-count semantics except by removing the two deleted sponsor question screens

Acceptance:
- final screen order is explicit and stable:
  - `cold-open`
  - `welcome`
  - `relationship`
  - `feud-top3`
  - `feud-strongest`
  - `feud-trademark`
  - `bachelor-roses`
  - `bachelor-eliminate`
  - `bachelor-limo`
  - `commercial-break`
  - `shark-invest`
  - `shark-reason`
  - `maury`
  - `survivor`
  - `producer-notes`
- `credits`
- no deleted screen IDs remain in `screens.ts`
- `commercial-break` has a concrete runtime source for audio, background, and caption content
- `cold-open.uiRevealAt === 20.0`

### Step 3: Realign prompt and caption registries

Update:

- `src/lib/screen-prompts.ts`
- `src/lib/captions/data.ts`

Rules:
- remove dead sponsor references
- add `commercial-break` only where it truly belongs
- keep prompt nullability consistent for non-answer screens
- ensure every retained screen ID has the correct prompt/caption behavior

Acceptance:
- no prompt/caption registry references to deleted IDs
- all retained IDs present where required
- `getScreenPrompt("commercial-break") === null`
- `SCREEN_CAPTIONS` contains `commercial-break`

### Step 4: Preserve review/resume semantics

Verify and, if needed, update the runtime contract surfaces that depend on view-only vs answerable classification:

- `src/lib/flow.ts`
- `src/lib/response-contract.ts`
- `src/app/page.tsx`

Because `continue-button` is currently treated as view-only, `commercial-break` should preserve:

- completion classification
- reviewable-screen count semantics
- resume ordering behavior

Acceptance:
- reviewable count delta is exactly `-2` from the current tracked runtime because only `sponsor-brand` and `sponsor-why` are removed as answerable screens
- `commercial-break` does not silently become answerable
- `src/app/page.tsx` still produces coherent progression, review, and resume behavior against the updated contract
- `test/flow.test.ts` remains the retained proof for screen progression/resume logic

### Step 5: Land behavioral presentation changes in `ScreenPlayer`

Update `src/components/ScreenPlayer.tsx` for the intended runtime behavior:

- cold-open pacing improvement
- skip visibility policy for long VO
- CRT overlay integration for `cold-open`

Treat these as **behavioral**, not cosmetic:

- reveal timing
- skip timing
- progression through cold-open / welcome

Acceptance:
- `cold-open` start CTA appears at `20s`
- long-VO screens show skip immediately when `uiRevealAt >= 15`
- `CrtOverlay` is rendered only for `cold-open`
- no regression in reveal timing or screen advancement

### Step 6: Land caption contract and style support

Update:

- `src/components/Captions.tsx`
- `src/app/globals.css`

Scope:
- lower-third markup
- CSS hooks required by the new caption structure
- only the minimum theme/style tokens required by the landed runtime

Acceptance:
- caption DOM contract includes:
  - lower-third shell
  - separate speaker chip
  - body copy region
- safe-area and landscape behavior remain intact

### Step 7: Reconcile tests to the landed runtime

After runtime converges, keep only tests that match real behavior.

Likely retained/updated:
- `test/screen-arc.test.ts`
- `test/screen-player.test.tsx`
- `test/captions.test.tsx`
- `test/question-prompt.test.tsx`
- `test/response-contract.test.ts`
- `test/review-screen.test.tsx`
- `test/ui-inputs-hydration.test.tsx`

If the runtime does **not** adopt a given proposed behavior, delete or defer the corresponding test instead of normalizing red tests.

Acceptance:
- retained tests reflect the actual runtime
- no proposed-state tests remain pretending the runtime already changed

### Step 8: Reconcile docs/config to the retained verification surface

Update only after Steps 1-7 are done:

- `docs/user-journeys.md`
- `TESTING.md`
- `package.json`
- `playwright.config.ts`

Decision gate:
- **Browser lane is deferred in this realignment.**
- Remove or defer checked-in browser assets/docs/claims that imply Playwright is supported:
  - `playwright.config.ts`
  - `test/e2e/core-journey.spec.ts`
  - browser-coverage claims in `docs/user-journeys.md`
  - any `TESTING.md` language implying browser support
- Hard outcome for this pass:
  - `playwright.config.ts` and `test/e2e/core-journey.spec.ts` are removed or parked outside the active verification surface
  - `package.json` remains without Playwright dependency/scripts
- Do not add Playwright dependency or scripts in this pass.

Acceptance:
- docs and command surface match what the repo can really run

## Verification Path

### Static/runtime contract checks

Verify:

- final screen IDs/order
- `cold-open.uiRevealAt === 20.0`
- `commercial-break` exists and is `continue-button`
- deleted sponsor IDs are gone
- `maury` precedes `survivor`
- prompt registry and caption registry align with retained IDs

### Unit/integration checks

Run:

- `npm run lint`
- `npx tsc --noEmit`
- `npm test`

Specific runtime contracts to verify:

- view-only/reviewable semantics
- screen arc ordering
- caption DOM contract
- cold-open / skip / reveal behavior

### Browser policy gate

Chosen for this plan:

- **Defer browser lane**
- remove/defer browser claims and assets from docs/config
- do not leave the repo in a half-adopted state

Explicit browser-deferral proof:

- `package.json` contains no Playwright dependency and no `test:e2e` script
- `playwright.config.ts` is removed or parked outside the active repo surface
- `test/e2e/core-journey.spec.ts` is removed or parked outside the active repo surface
- `TESTING.md` contains no active browser-lane claim
- `docs/user-journeys.md` contains no browser-coverage claim

## Risks

- `commercial-break` may accidentally alter review/resume behavior if it stops being treated as view-only.
- Runtime changes may land partially, leaving prompt or caption registries out of sync with the screen list.
- `ScreenPlayer` presentation changes can regress skip timing or cold-open progression if treated as purely cosmetic.
- A partially supported Playwright lane will recreate the same drift this plan is trying to remove.

## ADR

### Decision

Realign the tracked runtime to the intended new survey state first across **all runtime-owned contract tables**, then retain only tests/docs/config that describe the landed runtime.

### Drivers

- Runtime and proposed verification surfaces disagree today.
- User explicitly requested runtime first.
- The repo already contains duplicate contract tables beyond the four headline runtime files.

### Alternatives Considered

- Atomic migration of runtime + tests/docs/browser lane
- Revert proposals to the old runtime

### Why Chosen

This path minimizes false-spec promotion while still acknowledging the true architecture of the runtime contract.

### Consequences

- Tranche 1 is broader than the original four-file phrasing
- Browser-lane support becomes an explicit policy decision in tranche 2
- Prompt/caption/review semantics must be treated as first-class runtime surfaces

### Follow-ups

- Decide whether Playwright becomes a supported lane after runtime convergence
- Extend browser coverage only after the runtime and command surface agree

## Available Agent Types Roster

- `planner`
- `architect`
- `executor`
- `test-engineer`
- `verifier`
- `debugger`
- `writer`

## Suggested Follow-up Staffing

### Ralph

- primary owner: `executor`
- verification owner: `verifier`
- escalation support: `debugger` for regressions in reveal/progression behavior

### Team

- lane 1: `executor` — screen arc + prompt/caption registry realignment
- lane 2: `executor` — `ScreenPlayer` + `Captions` + `globals.css`
- lane 3: `test-engineer` — reconcile tests after runtime lands
- final pass: `verifier`

## Launch Hints

- Ralph:
  - `$ralph implement .omx/plans/runtime-realignment-survey-state-20260413.md`
- Team:
  - `$team implement runtime realignment with lanes for arc/contracts, presentation runtime, and test reconciliation`
