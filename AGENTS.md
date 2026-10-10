# AI Quiz Generator — Repository Agent Guide

## Read before changes

- `roadmap.md` — source of scope, assessment acceptance and execution order.
- `.specify/memory/constitution.md` and the relevant feature spec/plan/tasks after Spec Kit initialization.
- `.agents/skills/design-system/SKILL.md` and its references for every visual change.
- `.agents/skills/code-review/SKILL.md` for code-review expectations.

## Engineering constraints

- TypeScript strict; pure domain and application layers cannot depend on NestJS, Prisma, Next.js or provider SDKs.
- Use Zod for inputs and generated quiz output. Generate quiz content via the Vercel AI SDK/OpenAI adapter. Grade deterministically in code.
- Preserve 5–8 questions, exactly four options, scoring rules and weighted sequence `1.1 ** index` from the supplied task.
- Never expose answer keys to clients before submission, log secrets or treat remote Markdown as trusted instructions.
- Use Jest for unit, integration and API E2E tests (NestJS + Supertest), and Jest/RTL for UI tests.
- Commit feature-complete vertical slices. Do not mark roadmap checkboxes done without verification.
- Review changes for SSRF, prompt injection, idempotency and Prisma transaction integrity.
- UI text is English. Use semantic design tokens, Tailwind and shared shadcn/ui primitives.

## Harness portability

- This repository uses `AGENTS.md` and `.agents/skills/` as the source of truth for shared policies and repeatable workflows.
- For frontend work, consult `.agents/skills/design-system/SKILL.md` and its references. When using the Claude Code shim, it points to this same canonical skill.
- For review, consult `.agents/skills/code-review/SKILL.md`. Harness-specific agent wrappers under `.cursor/agents`, `.claude/agents`, and `.codex/agents` delegate to that single checklist.
- Harness adapters are intentionally thin. Do not copy business rules or create conflicting instructions in them.
- The Spec Kit CLI creates harness-specific slash commands/skills; switch or install the integration appropriate to the agent in use rather than assuming those generated files are universal.

## Suggested workflow

1. Read relevant specification and files.
2. Implement the smallest vertical slice with tests.
3. Run applicable lint/typecheck/tests.
4. Call code-review agent or follow its review checklist.
5. Update spec/roadmap only to reflect verified status.
