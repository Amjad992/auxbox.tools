# Agent Protocol — Core (always loaded)

This file is loaded on every turn by every assistant (Claude, Codex, Cursor, Copilot, …). Keep it short. Deeper guidance lives in skills under `.agents/skills/<name>/SKILL.md` and is loaded only when triggers fire (see `.agents/context-loading-policy.md` and `.agents/on-demand-skills.md`).

---

## 0. HANDOVER first (highest priority)

`playground/HANDOVER.md` is the canonical session-resume document.

- **Read it FIRST** at session start, after any compaction, after any resume — before any other action.
- **Update it continuously** as work progresses: after every meaningful step, before any long-running operation, before any potential compaction, whenever a future agent would need to know something (a decision, a path, a blocker, a partial step, an in-flight branch).
- Treat HANDOVER updates as part of the work, not paperwork after.
- The last write before a likely compaction or session end MUST be a HANDOVER update — even one line ("paused mid-step 3, next: run tests").

## 1. Communication

- Concise by default. No filler. Expand only on request.
- Reference code as `path/to/file.js:42` so editors can click.
- No emojis in code, comments, commits, or chat unless asked.
- Don't narrate every tool call — state what you're doing, do it, report results.

## 2. Planning (the roadmap rule)

For any non-trivial task (feature, architecture decision, multi-step refactor, addressing review rounds):

1. **Ask the branching question first** — "new branch for this, or continue on the current one?" Do not write code until that's resolved.
2. Create `playground/roadmap/YYYY-MM-DD_HH-MM_<short-slug>/plan.md` using the template in `.agents/skills/roadmap/SKILL.md`.
3. Update the plan **after every step**, not at the end. Mirror status into HANDOVER.
4. When complete, **archive** the entire folder to `playground/roadmap/1-completed/`. Do not delete.

Trivial single-step tasks (a typo fix, a one-line copy edit) skip the plan.

## 3. Branch model

- `main` — production. Default base for PRs.
- `staging` — pre-prod. The user creates and pushes `staging` themselves; do not create or push it on their behalf.
- Feature work goes on a feature branch off `main` (the user will tell you when to deviate).

## 4. Core engineering rules

- **Reuse before you build.** Read `.agents/skills/conventions/SKILL.md` before adding any UI element, button, card, page shell, hero, toast, error boundary, storage layer, or styling rule. Tool-local files contain only what is genuinely tool-specific.
- **Think before building.** Read local context first. Verify what you create — imports resolve, client components marked, error paths handled.
- **Smallest correct change.** No drive-by refactors, speculative abstractions, premature generalization, or comments that explain *what* instead of *why*.
- **Zero duplication.** Shared code goes in `src/components/`, `src/styles/tools.css`, `src/lib/`, `src/hooks/`. If a piece looks one-off but a second tool might want it, build it shared from day one.
- **Never trust client-supplied identity** for any DB lookup or write — see `.agents/skills/security/SKILL.md`.
- **Never reason yourself out of a security finding.** Enumerate every permission path before dismissing one.
- **Keep docs current.** Update `.agents/changelog.md` with every structural or behavior change. The pre-commit hook enforces this.
- **Never use `--no-verify`.** If a hook fails, fix the underlying issue (including a missing changelog entry).
- **Do not revert user changes you did not make.**

## 5. Default workflow

1. Read `playground/HANDOVER.md`.
2. Read `.agents/context.md` (the local-context overview).
3. Apply the loading policy (`.agents/context-loading-policy.md`) — load only the skills the task triggers.
4. Make the smallest correct change.
5. Verify (build, lint, tests).
6. Update `.agents/changelog.md` and `playground/HANDOVER.md`.
7. Commit at natural breakpoints. Pause before push / PR / destructive ops and confirm with the user.

## 6. Pointers

- Loading policy: `.agents/context-loading-policy.md`
- Skill index: `.agents/on-demand-skills.md`
- Local context overview: `.agents/context.md`
- Local changelog: `.agents/changelog.md`
- Plan template: `.agents/skills/roadmap/SKILL.md`
- HANDOVER: `playground/HANDOVER.md`
