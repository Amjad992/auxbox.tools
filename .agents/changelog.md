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

## 2026-05-03 - Raise section: Percentage spans full row
**What changed:** In the salary-raise calculator's Raise section, the Percentage input now spans the full grid row. The four period inputs follow as 2 rows of 2 (Hourly + Weekly, Monthly + Annual). Implemented via a `.pay-row--full` modifier (`grid-column: 1 / -1`) applied only to the percent row.
**Why:** Percentage is conceptually distinct from the period inputs (it's the raise driver, not a period view). Pairing it with a single period field looked arbitrary; giving it its own row makes the section's semantic structure visible.
**Impact:** Raise section now lays out as 1 + 2 + 2 (3 rows). Pay before raise / Pay after raise unchanged (still 2 × 2). Mobile (<640px) still collapses to one column. No behavior change. Tests + lint clean.
**Files changed:** `src/app/salary-raise-calculator/components/PaySection.js`, `src/app/salary-raise-calculator/raise-calculator.css`.

## 2026-05-03 - Salary-raise calculator uses full container width and 2-col input grid
**What changed:**
1. Removed the `narrow` prop on `<ToolPage>` in [src/app/salary-raise-calculator/page.js](src/app/salary-raise-calculator/page.js). The page now uses the default 1200px container, matching CGPA Calculator and QR Code Generator.
2. Wrapped the inputs in each `PaySection` in a new `.pay-grid` two-column CSS grid. With the wider container the period inputs were too wide; now they pair up — Pay before raise: 2 rows × 2; Raise: 5 fields auto-flowing 2+2+1; Pay after raise: 2 rows × 2. The `<640px` breakpoint collapses back to one column.
**Why:** At 720px the three-tile results grid squeezed `$250000` against the tile padding. Widening to 1200px fixed the results but made each input span the full container, which felt empty. Pairing the period inputs uses the new horizontal space without affecting the result tiles (still full-width, three across).
**Impact:** Result tiles get ~380px each. Period inputs sit side-by-side instead of full-width. No behavior change. Tests + lint clean.
**Files changed:** `src/app/salary-raise-calculator/page.js`, `src/app/salary-raise-calculator/components/PaySection.js`, `src/app/salary-raise-calculator/raise-calculator.css`.

## 2026-05-03 - Add unit-test layer (Vitest + RTL)
**What changed:** Added 13 test files / 175 tests covering `src/lib/{storage,createStorageContext}`, `src/hooks/useToast`, shared components (`Button`, `Card`, `Hero`, `ResultCard`, `ToastContainer`, `ErrorBoundary`), and tool-specific utils + validators for both calculators. Added `vitest.setup.js` (jest-dom matchers, RTL cleanup, localStorage clear). Configured Vite/esbuild to handle JSX in `.js` files via the automatic JSX runtime so `createStorageContext.js` and the existing tool components can be imported by tests without a rename.
**Why:** First test pass to anchor future agent / human changes against regressions. Targets pure logic + shared primitives where ROI is highest. CSS / visual-regression deferred to a separate plan.
**Impact:** `npm test` exits green with 175 passing tests. `@testing-library/{react,jest-dom,user-event}` added as dev deps. `vitest.config.mjs` extended with React plugin + `esbuild.jsx: 'automatic'`.
**Files changed:** `vitest.config.mjs`, `vitest.setup.js`, `package.json`, `src/lib/*.test.{js,jsx}`, `src/hooks/useToast.test.js`, `src/components/*.test.jsx`, `src/app/cgpa-calculator/{utils,storageUtils}.test.js`, `src/app/salary-raise-calculator/{utils,storageUtils}.test.js`.

## 2026-05-03 - Fix Button defaults under React 19
**What changed:** Replaced deprecated `Button.defaultProps` (no longer applied to function components in React 19) with ES6 default parameters. Behavior preserved: `variant='primary'`, `block=false`, `type='button'`.
**Why:** First test surfaced that buttons were silently rendering without a `type` attribute, which could submit enclosing forms unintentionally.
**Impact:** Buttons now reliably default to `type="button"` and `variant="primary"`. No call-site changes needed.
**Files changed:** `src/components/Button.js`.

## 2026-05-03 - Fix lint script for Next 16
**What changed:** Replaced `next lint` (removed in Next 16) with `eslint .` and added flat-config `ignores` for `.next/`, `out/`, `build/`, `coverage/`, `node_modules/`, `playground/` so the pre-commit lint step doesn't traverse build output.
**Why:** Bootstrap's pre-commit hook needs a working lint command; `next lint` errored with "Invalid project directory provided".
**Impact:** `npm run lint` is now clean (0 errors; 2 pre-existing `<img>` warnings).
**Files changed:** `package.json`, `eslint.config.mjs`.
