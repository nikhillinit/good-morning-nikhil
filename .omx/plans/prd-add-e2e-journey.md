# PRD: Add E2E Journey

## Goal

Add one browser-level end-to-end test for the highest-value respondent journey:

- consent gate
- episode start
- relationship selection
- first successful answer submission
- verified handoff to the next question screen

## Scope

### In scope

- Add Playwright as the browser E2E harness
- Add one first-run journey spec
- Add a script/config so the journey can be executed locally and in CI later

### Out of scope

- Full matrix of browser journeys
- Resume/offline/failure E2E coverage
- Product changes unrelated to enabling the requested E2E journey

## Success Criteria

- A single command runs the browser journey in a real browser
- The journey proves the respondent can get from consent to the first completed
  answer and advance correctly
- Existing Vitest coverage remains green

## Risks

- Browser audio/media timing can make the test flaky
- Next.js runtime startup may need a stable webServer configuration

## Mitigations

- Prefer consent + skip controls over brittle timing waits
- Keep the journey to one deterministic path with explicit selectors
- Use production-like startup if dev mode proves unstable
