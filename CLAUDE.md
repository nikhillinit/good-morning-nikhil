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

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Good Morning, Nikhil**

A comedic TV-show-themed survey app that collects "Selling Yourself & Ideas" personal brand feedback from peers. Built as a Next.js web app with animated screens (Family Feud, The Bachelor, Shark Tank, Survivor, Maury), voiceover audio, timed captions, ambient motion layers, and Supabase persistence. Class deliverable for Kellogg Spring 2026.

**Core Value:** Respondents complete the full survey — engagement through entertainment is the ONE thing. If the TV-show conceit doesn't hold attention, the feedback data is worthless.

### Constraints

- **Timeline**: Class deliverable, weeks not months
- **Still consistency**: 2 cleanup passes + 3 new generations max — no exploration
- **VO approach**: ElevenLabs TTS preferred, human recording fallback
- **Tech stack**: Next.js 16 + React 19 + Tailwind v4 + Framer Motion + Howler.js + Supabase
- **Image budget**: WebP at 85% quality to keep page weight manageable
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
