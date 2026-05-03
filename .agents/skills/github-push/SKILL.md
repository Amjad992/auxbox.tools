# Skill: github-push

Checklist before pushing or opening a PR.

## Before push

- [ ] Local commits are clean and atomic (one logical step per commit).
- [ ] All hooks have run (no `--no-verify`).
- [ ] `npm run lint`, `npm test`, `npm run build` all green.
- [ ] `.agents/changelog.md` updated.
- [ ] `playground/HANDOVER.md` updated.
- [ ] You have explicit user approval to push.

## Push targets

- **Feature branch → push freely** when the user asks.
- **`main`** — only push if the user explicitly approves it for this commit. Force-push is forbidden without explicit consent.
- **`staging`** — **the user manages this branch.** Do not create, push, or force-push to `staging`. If the user wants something on staging, they'll merge or push it themselves.

## Opening a PR

- Base = `main` unless told otherwise.
- Title: short and descriptive (`Add salary raise calculator`, `Fix negative-input regression in CGPA`).
- Body: what changed, why, and how to verify. Link to any roadmap plan or review round.
- Don't auto-add reviewers.

## Confirm before destructive ops

Always pause and confirm before:
- `git push --force` (any branch).
- Deleting a remote branch.
- Rewriting history on any pushed branch.
