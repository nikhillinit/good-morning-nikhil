---
status: ACTIVE
last_updated: 2026-04-13
owner: Core Team
review_cadence: P90D
---

# User Journeys

This document captures the implemented end-user journeys for **Good Morning,
Nikhil** as they exist today.

It is intentionally grounded in:

- [src/app/page.tsx](../src/app/page.tsx) for orchestration and recovery logic
- [src/components/ScreenPlayer.tsx](../src/components/ScreenPlayer.tsx) for
  audio, prompt, and screen presentation behavior
- [src/components/ui-inputs/index.tsx](../src/components/ui-inputs/index.tsx)
  for input-specific completion rules
- [src/components/ReviewScreen.tsx](../src/components/ReviewScreen.tsx) for
  review/submit behavior
- [SYNTHETIC-USER-TEST.md](../SYNTHETIC-USER-TEST.md) for qualitative UX
  pressure-testing

The goal is not to describe every visual detail. The goal is to define the
actual respondent experience, the expected recovery paths, and the tests that
currently protect them.

---

## Journey 1: Shared Link to First Answer

| Attribute | Value |
|-----------|-------|
| Priority | Critical |
| User Type | First-time respondent |
| Frequency | One-time per respondent/session |
| Success Metric | Respondent reaches the first answerable screen and understands what to do |

### User Goal

> "I want to open the link, understand what this is, and start answering
> without getting surprised by audio or confused about the prompt."

### Preconditions

- User opens the shared survey link
- Supabase session bootstrap succeeds or is bypassed in local/dev mode
- No completed submission exists for the active session

### Step 1: Episode Boot

**User Action:** Opens the survey URL

**System Response:**

- Full-screen loading state appears
- Session bootstrap runs when Supabase is configured

**Success Criteria:**

- [ ] The app does not render a broken or half-hydrated screen
- [ ] Respondent either reaches the survey or sees a clear retry path

**Potential Friction:**

- Slow bootstrap can feel opaque if the respondent expects instant interactivity

### Step 2: Media Consent Gate

**User Action:** Lands on the survey before audio is allowed to play

**System Response:**

- `MediaGate` blocks progression until the respondent explicitly starts
- The app warns that the episode has sound

**Success Criteria:**

- [ ] Audio does not auto-play before consent
- [ ] The respondent has an explicit "Start Episode" action

**Recovery Path:**

- If the respondent is not ready for audio, they can pause at the consent gate
  instead of being forced into the cold open

### Step 3: Cold Open and Welcome

**User Action:** Starts the episode

**System Response:**

- Cold open and welcome screens play as TV-show framing, not as answer screens
- Captions render during audio
- A skip control appears while audio is playing

**Success Criteria:**

- [ ] Intro screens feel thematic but not blocking
- [ ] The respondent can skip audio instead of waiting through it
- [ ] Mute control remains available

### Step 4: Relationship Selection

**User Action:** Chooses how they know Nikhil and optionally toggles anonymity

**System Response:**

- Relationship picker renders discrete options
- Anonymous preference is captured before the main survey begins
- "Continue" unlocks only after a relationship is selected

**Success Criteria:**

- [ ] Relationship must be chosen before continuing
- [ ] Anonymous toggle is understandable at the first decision point

### Step 5: First Answerable Screen

**User Action:** Reaches the first content question, currently `feud-top3`

**System Response:**

- Audio/captions play first
- Input UI reveals after timing, audio end, or skip
- `QuestionPrompt` persists the visible question above the input UI

**Success Criteria:**

- [ ] Respondents who skip audio still see the question they are answering
- [ ] Input affordances are explicit before submission
- [ ] The respondent can begin answering without replaying the audio

### Error Scenarios

#### E1: Bootstrap Failure

**Trigger:** Session bootstrap or initial loading fails

**User Sees:** Full-screen retry state with a clear retry button

**Recovery Path:** Tap retry to restart bootstrap without reloading the whole browser tab

#### E2: Audio Isn’t Appropriate Right Now

**Trigger:** Respondent opens the link in a quiet/public setting

**User Sees:** Consent gate before any episode audio starts

**Recovery Path:** Delay entry until ready, or begin with mute controls available

### Metrics to Track

- Link-open to consent-grant conversion
- Consent-grant to relationship-complete conversion
- First-answer drop-off rate
- Skip-audio usage rate on the first answerable screen

---

## Journey 2: Answer Screens to Review and Submit

| Attribute | Value |
|-----------|-------|
| Priority | Critical |
| User Type | Active respondent |
| Frequency | Once per completed episode |
| Success Metric | Respondent reaches review, verifies answers, and submits successfully |

### User Goal

> "I want to move through the episode quickly, understand each question, and
> submit with confidence that my answers were saved."

### Preconditions

- Respondent has passed the consent gate
- Session is active and not already completed
- Current screen is answerable or skippable

### Step 1: Episodic Progression

**User Action:** Moves through the answer screens in order

**System Response:**

- Screen progression is linear through `screens.ts`
- Back navigation becomes available after the first screen
- Progress bar advances at the bottom of the viewport

**Success Criteria:**

- [ ] Respondent can tell they are moving forward
- [ ] Back navigation is available for correction during the live episode flow
- [ ] Each screen reveals the correct input type for its question

### Step 2: Input Completion Rules

**User Action:** Responds using the screen-specific input

**System Response:**

- Text-based inputs generally require a value or allow an explicit skip
- Multi-select requires the configured number of selections
- `InvestOrPass` now uses selection plus confirmation instead of instant submit

**Success Criteria:**

- [ ] Completion rules are visible before the respondent commits
- [ ] Validation errors explain what is missing
- [ ] Skip behavior exists where intentional non-response is supported

**Known Friction:**

- `TwoText` still requires both fields and currently has no explicit skip path
- Multi-select requires an exact count, which can feel more rigid than text screens

### Step 3: Persistence on Advance

**User Action:** Clicks the screen CTA to continue

**System Response:**

- Response is serialized into canonical review data
- Server-backed progress is updated when Supabase is enabled
- The app advances to the next screen or the review state

**Success Criteria:**

- [ ] Advancing does not silently lose the answer
- [ ] Anonymous preference remains intact across the flow
- [ ] Screen completion status is recorded consistently

### Step 4: Review Screen

**User Action:** Reaches the end and opens review

**System Response:**

- Review screen shows answered count and skipped count
- Respondent can expand answers before submission
- Audio responses render with playback controls
- Anonymous toggle is still available

**Success Criteria:**

- [ ] Review state helps the respondent verify what will be submitted
- [ ] Answers are readable without truncation-based ambiguity
- [ ] Audio answers are reviewable, not opaque

### Step 5: Final Submission

**User Action:** Clicks `Submit Episode`

**System Response:**

- Session submits to the backend
- Success lands on the `That's a wrap` completion state

**Success Criteria:**

- [ ] Submission completes without leaving the respondent in an uncertain state
- [ ] Completion copy clearly signals the survey is done

### Error Scenarios

#### E1: Validation Failure on a Required Input

**Trigger:** Respondent tries to continue without satisfying the screen’s required rule

**User Sees:** Inline error copy such as "Type something first" or "Both sides of the story"

**Recovery Path:** Correct the input and re-submit without losing current-screen context

#### E2: Final Submit Failure

**Trigger:** `submitSession` fails

**User Sees:** Full-screen retry state that explains answers are saved

**Recovery Path:** Tap retry from the failure screen instead of rebuilding the whole survey

### Metrics to Track

- Per-screen completion vs skip rate
- Review-open rate before submit
- Final submit success rate
- Final submit retry rate

---

## Journey 3: Interrupt, Resume, and Recover

| Attribute | Value |
|-----------|-------|
| Priority | High |
| User Type | Returning in-progress respondent |
| Frequency | Opportunistic |
| Success Metric | Respondent returns to the correct place with preserved answers and a working recovery path |

### User Goal

> "I want to come back later and pick up where I left off without wondering
> whether the app remembered me."

### Preconditions

- Respondent started but did not submit
- Session progress and/or answers exist
- Respondent returns with the same browser/session context

### Step 1: Resume Bootstrap

**User Action:** Reopens the survey link later

**System Response:**

- App loads session, progress rows, and saved answers
- `getResumeState` determines current screen, history, and whether review should show
- Resume banner indicates where the respondent is re-entering

**Success Criteria:**

- [ ] Respondent is returned to the right screen or review state
- [ ] Previously saved answers hydrate back into the UI where supported
- [ ] Resume state is communicated, not silent

### Step 2: Recover from Save Failure

**User Action:** Advances during a transient persistence failure

**System Response:**

- Save error banner appears at the top
- Retry action is offered when the current completion is still pending

**Success Criteria:**

- [ ] Respondent receives immediate feedback that save failed
- [ ] Recovery is available from the current screen instead of forcing a reload

### Step 3: Voice Upload Recovery

**User Action:** Records voice on a voice-first screen while upload is unavailable

**System Response:**

- Survey answer progression is decoupled from immediate upload success
- Failed voice upload is queued for retry
- Queue flush runs on app load and when the browser returns online

**Success Criteria:**

- [ ] Voice upload failure does not block survey progression
- [ ] Successful later flush patches the stored answer with a real media URL

### Error Scenarios

#### E1: Resume to Review

**Trigger:** All reviewable screens are already complete when the respondent returns

**User Sees:** Review screen instead of being dropped back into a content screen

**Recovery Path:** Verify answers and submit from review

#### E2: Voice Upload Failed Earlier

**Trigger:** Prior voice answer could not upload while offline or during a transient failure

**User Sees:** The flow continues; upload repair is deferred

**Recovery Path:** Queue flush on load/online repairs the media URL later

### Metrics to Track

- Resume rate after abandonment
- Resume-to-submit conversion
- Save-error retry success rate
- Voice queue flush success/failure counts

---

## Automated Coverage Map

Current journey protection is mostly unit/integration coverage, not full browser
automation yet.

| Area | Tests |
|------|-------|
| Flow navigation and resume state | [test/flow.test.ts](../test/flow.test.ts) |
| Media consent and mute behavior | [test/media-gate.test.tsx](../test/media-gate.test.tsx) |
| Visible prompt persistence | [test/question-prompt.test.tsx](../test/question-prompt.test.tsx) |
| Review state and audio answer rendering | [test/review-screen.test.tsx](../test/review-screen.test.tsx) |
| Canonical response serialization/hydration | [test/response-contract.test.ts](../test/response-contract.test.ts) |
| Offline voice upload queue and flush | [test/voice-queue.test.ts](../test/voice-queue.test.ts) |
| Saved input hydration | [test/ui-inputs-hydration.test.tsx](../test/ui-inputs-hydration.test.tsx) |
| Voice recording component behavior | [test/voice-recorder.test.tsx](../test/voice-recorder.test.tsx) |

---

## Current Gaps

These are the highest-value next steps for future end-to-end journey coverage:

- Browser-level full-survey completion journey from consent to final wrap
- Browser-level resume test proving the correct screen/review state is restored
- Browser-level submit-failure and retry test
- Browser-level voice-record + offline recovery test
- UX decision on whether `TwoText` should gain an explicit skip path
