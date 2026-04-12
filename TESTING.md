# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence. Without them, vibe coding is just yolo coding. With tests, it's a superpower.

## Framework

- **vitest** v4 with jsdom environment
- **@testing-library/react** for component tests
- **@testing-library/jest-dom** for DOM assertions

## Running Tests

```bash
npm test          # single run
npm run test:watch  # watch mode
```

## Test Layers

- **Unit tests** (`test/*.test.ts`): pure logic like flow navigation, screen completion status, resume logic. Fast, no DOM needed.
- **Integration tests** (`test/*.test.tsx`): component rendering with testing-library. Verify user interactions and state changes.
- **Smoke tests**: verify the app builds and key pages render without errors.
- **E2E tests**: (future) playwright for full user flows.

## Conventions

- Test files live in `test/` directory
- Named `{module}.test.ts` or `{component}.test.tsx`
- Use `describe`/`it` blocks with clear intent
- Assertions test real behavior, not implementation details
- Import from `@/` alias matching the source
