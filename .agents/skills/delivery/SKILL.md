# Skill: delivery

How to ship a change. Load before opening a PR or pushing.

## Pre-commit (every commit)

The Husky pre-commit hook runs lint + tests AND requires `.agents/changelog.md` to be staged whenever any source file is staged. Don't bypass it.

If the hook fails:
- Lint failure → fix the lint, don't disable the rule.
- Test failure → fix the test or the code; never delete a failing test to make CI green.
- Missing changelog → append an entry under `.agents/changelog.md` (see entry format in that file).

**Never use `--no-verify`.**

## Pre-PR checklist

- [ ] `npm run lint` clean.
- [ ] `npm test` clean.
- [ ] `npm run build` clean.
- [ ] If UI changed: dev-server smoke test (golden path + at least one edge case) — type-checking and tests verify code, not feature correctness.
- [ ] `.agents/changelog.md` has an entry for this change.
- [ ] `playground/HANDOVER.md` reflects current state.
- [ ] Any active `playground/roadmap/.../plan.md` has its checkboxes ticked and `## Current status` updated.
- [ ] If the plan is fully done, the folder is moved to `playground/roadmap/1-completed/`.

## Commit cadence

- Commit at natural breakpoints (one logical step = one commit).
- Pause before push / PR / destructive ops and confirm with the user.
- Do not amend a commit that has already been pushed unless the user explicitly asks.

## Branch model recap

- `main` — production base for PRs.
- `staging` — pre-prod, **maintained by the user**. Don't create or push it.
- Feature branches off `main` by default.
