@AGENTS.md

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

## Testing

- Run: `npm test` (vitest). Test dir: `test/`
- See TESTING.md for full conventions
- 100% test coverage is the goal
- New functions need a corresponding test
- Bug fixes need a regression test
- Error handling needs a test that triggers the error
- Conditionals (if/else, switch) need tests for BOTH paths
- Never commit code that makes existing tests fail
