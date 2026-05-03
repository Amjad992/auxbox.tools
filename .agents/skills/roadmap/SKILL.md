# Skill: roadmap

Use when starting any non-trivial task — new feature, architecture decision, addressing PR review, multi-step refactor.

## 1. Branching question (do this BEFORE writing code)

Ask the user: *"New branch for this, or continue on the current one?"*

Branch model recap:
- `main` — production base.
- `staging` — pre-prod, **maintained by the user**. Do not create or push it.
- Feature branches off `main` unless the user says otherwise.

Do not create the plan folder or write code until the branch is settled.

## 2. Folder convention

Create:

```
playground/roadmap/YYYY-MM-DD_HH-MM_<short-slug>/plan.md
```

Timestamp prefix is mandatory. Multiple plans per day is normal; chronological sort matters.

## 3. plan.md template (copy verbatim)

```markdown
# <Plan title>

**Created:** YYYY-MM-DD HH:MM
**Branch:** <branch-name>
**Status:** in-progress | blocked | complete

## Goal
<One paragraph. What is the user-visible outcome?>

## Constraints
- <Hard constraints: APIs that must not break, deadlines, perf budgets, scope limits>

## Success criteria
- <Verifiable checks. Tests pass, build green, screenshot matches, metric within X.>

## Steps
- [ ] 1. <Step> — <expected artifact / commit>
- [ ] 2. ...

## Decisions log
<Append non-obvious choices with the why. e.g., "Chose B over A because A breaks under concurrent writes." Future agents read this to avoid relitigating.>

## Current status
<One paragraph, rewritten as work moves. What's done, what's next, what's blocked.>

## Open questions / blockers
<Or "None.">

## Related artifacts
<Links to: PRs, review rounds, sibling plans, key commits.>
```

## 4. Update cadence

- Edit plan after **every step**, not at the end.
- Mirror status into `playground/HANDOVER.md` on each meaningful update.
- Tick checkboxes only after the step is verified (commit / test / build green).

## 5. Completion

When all steps are verified, **move the entire folder** to `playground/roadmap/1-completed/`. Do not delete — archive preserves history.
