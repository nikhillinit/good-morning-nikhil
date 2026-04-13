# Test Spec: Add E2E Journey

## Verification Goals

Prove that a respondent can successfully begin the survey and complete the first
real answer in a browser.

## Required Browser Journey

The test must verify:

1. Media consent gate renders first
2. Respondent can start the episode
3. Cold-open and welcome screens can be skipped/advanced
4. Relationship selection works
5. The first answerable screen renders visible question/input affordances after skip
6. Respondent can submit the first answer
7. The app advances to the next question screen

## Automation

- Browser runner: Playwright
- Command should be exposed from `package.json`

## Repo Regression Gate

- `npm test`
- `npm run lint`
- `npx tsc --noEmit`
- targeted Playwright journey command

## Acceptance Gate

Do not mark complete unless:

- the Playwright journey passes
- existing Vitest coverage still passes
- lint/typecheck still pass
