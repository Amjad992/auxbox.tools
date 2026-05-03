# Changelog — auxbox.tools

Append-only log of structural or behavior changes future agents would need to know about. The pre-commit hook requires this file to be staged whenever any source file is staged.

## Entry format

```
## YYYY-MM-DD - Short title
**What changed:** ...
**Why:** ...
**Impact:** ...
**Files changed:** ...
```

---

## 2026-05-03 - AI collaboration scaffold bootstrapped
**What changed:** Added `.agents/` (core protocol, loading policy, skill index, skills), root entrypoints (`CLAUDE.md`, `AGENTS.md`, `agent.md`) as `@import` shims, `playground/HANDOVER.md`, Husky + changelog-enforcement pre-commit hook, Vitest test runner.
**Why:** Make every AI assistant (Claude / Codex / Copilot / Cursor) read the same protocol, plan in the same place, and commit with the same enforcement.
**Impact:** All future work must follow the protocol in `.agents/agent-protocol-core.md`. Pre-commit blocks any commit that touches source without staging this changelog.
**Files changed:** `.agents/**`, `CLAUDE.md`, `AGENTS.md`, `agent.md`, `playground/HANDOVER.md`, `.husky/pre-commit`, `package.json`, `.gitignore`, `vitest.config.mjs`.

## 2026-05-03 - Fix lint script for Next 16
**What changed:** Replaced `next lint` (removed in Next 16) with `eslint .` and added flat-config `ignores` for `.next/`, `out/`, `build/`, `coverage/`, `node_modules/`, `playground/` so the pre-commit lint step doesn't traverse build output.
**Why:** Bootstrap's pre-commit hook needs a working lint command; `next lint` errored with "Invalid project directory provided".
**Impact:** `npm run lint` is now clean (0 errors; 2 pre-existing `<img>` warnings).
**Files changed:** `package.json`, `eslint.config.mjs`.
