# On-Demand Skills Index

Skills live at `.agents/skills/<name>/SKILL.md`. Load only what the task requires (see `.agents/context-loading-policy.md`).

## Task-shape skills

- **roadmap** — Plan template + branching question + archive-on-completion. Load for any non-trivial task.
- **delivery** — How to ship: build, lint, test, changelog, commit, PR. Load before opening a PR.
- **review** — How to act on a review round (apply findings, no deferral). Load when consuming `playground/reviews/...`.
- **github-push** — Push / PR checklist. Load before pushing a branch or opening a PR.
- **docs** — Updating user-facing or repo docs (README, tool descriptions). Load when touching docs.
- **new-entities** — Adding a brand-new tool (route under `src/app/<tool>/`). Load for any new tool.
- **frontend-task** — Frontend work checklist (state, accessibility, dev-server verification). Load for any UI change.
- **design-system** — Visual + reuse rules. **Load before any UI work.**
- **local-review-multi-agent** — How to run the multi-reviewer (CodeRabbit + Codex + Copilot) review process locally. Includes the Opus/Sonnet coordinator/reviewer/implementer split.

## Topic / reference skills

- **conventions** — Reuse-first guide for this codebase (the original `CLAUDE.md` content). Required reading before any UI, storage, or new-tool work.
- **security** — Identity-from-server, permission-path enumeration, defensive defaults. Load for auth / data-write / permission changes.
- **testing** — Vitest setup, what to test, how to structure tests. Load for logic changes or new utilities.

Topics that don't yet apply to this project (auth-task, db-mutation-task, deletion-cascade-task, structure) are intentionally not seeded. Add them when a real need appears — better to have five real skills than fifteen stubs.
