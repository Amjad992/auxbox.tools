# Context Loading Policy

Goal: keep the always-loaded surface tiny. Load skills on demand, by trigger.

## Always loaded

- `.agents/agent-protocol-core.md` — the protocol.
- `.agents/context-loading-policy.md` — this file.
- `.agents/on-demand-skills.md` — the skill index.
- `.agents/context.md` — repo overview (one short page).
- `playground/HANDOVER.md` — current state of work (read FIRST).

That is the entire default context. Everything else is triggered.

## Trigger table

| Trigger / task shape | Load |
| --- | --- |
| Adding a new tool (route under `src/app/<tool>/`) | `new-entities`, `conventions`, `frontend-task`, `design-system`, `testing` |
| Touching any UI (page, component, form, modal, list, badge) | `conventions`, `design-system`, `frontend-task` |
| Adding a button / card / surface / toast / error UI | `conventions` (reuse-first is non-negotiable here) |
| Adding/changing localStorage or persisted state | `conventions` (storage section), `testing` |
| Logic change, new utility, behavior change | `testing` |
| Auth, sessions, permissions, server actions, data writes/deletes, identity checks | `security` (always — no exceptions) |
| Running an AI code review round | `local-review-multi-agent`, `review` |
| Preparing a PR / pushing to remote | `delivery`, `github-push` |
| Updating user-facing or repo docs | `docs` |
| Multi-step planning, addressing review rounds, refactors | `roadmap` |

## Task-shape recipes

- **New tool:** `new-entities` + `conventions` + `frontend-task` + `design-system` + `testing`.
- **UI tweak in existing tool:** `conventions` + `design-system` (+ `frontend-task` if logic changes).
- **Storage / persistence change:** `conventions` + `testing`.
- **Permission/auth review:** `security` (load even if the change *looks* tangential).
- **AI multi-agent review round:** `local-review-multi-agent` + the topic skill (`security`, `testing`, `conventions`, …).
- **Cutting a release / pushing branch:** `delivery` + `github-push`.

## Avoid

- Loading every skill by default.
- Loading both a task-shape skill and an overlapping topic skill when one is enough.
- Re-reading skills already loaded in the current session.
- Loading `conventions` and *also* trying to recreate its rules from memory — read it.

## When in doubt

Skim `.agents/on-demand-skills.md` first; load only what matches the task. If a skill you need does not exist, that is a signal to write it (small and focused) before relying on it.
