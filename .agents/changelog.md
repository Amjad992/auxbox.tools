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

## 2026-05-04 - Password Generator: new defaults + auto-generate on first visit
**What changed:** Default settings now include symbols (`symbols: true`) and use length 18 (was 16). The page auto-generates one password on first render after the load effect commits, so users see a usable password immediately without clicking Generate. A `didAutoGenerateRef` guard ensures the auto-generate fires exactly once per mount; subsequent Generate clicks produce fresh passwords as before. Persisted settings (if any) still take precedence — the auto-generate runs after the load effect commits.
**Why:** Direct user UX request — symbols on by default for stronger out-of-the-box passwords, length 18 for a sensible default, and removing the "click before you see anything useful" friction.
**Impact:** First-visit shows a length-18 alphanumeric+symbols password without user interaction. All 65 password-generator tests pass.
**Files changed:** `src/app/password-generator/constants.js`, `src/app/password-generator/hooks.js`, `src/app/password-generator/page.test.jsx`.

## 2026-05-04 - Fix: address general review round (4 major, 8 minor) on password-generator
**What changed:** Applied all 12 findings from the 2026-05-04 general review round. MAJ-1: fixed progressbar ARIA invariant — now uses 0–100 scale so `aria-valuenow` never exceeds `aria-valuemax`. MAJ-2: added `role="status" aria-live="polite"` region announcing "New password generated, N characters" after Generate and "Password copied" after Copy. MAJ-3: disabled last-enabled class checkbox so users cannot reach the all-classes-off state that the storage validator rejects. MAJ-4: replaced IID entropy formula with class-quota-aware formula (`sum(log2(classSize_i)) + (length - numClasses) * log2(poolSize)`). MIN-1: removed the mount-time spurious save — settings are now persisted only on explicit `updateSetting`/`reset` calls via a `pendingSaveRef`. MIN-2: Generate button is disabled when `!hasAnyClass` (unreachable via MAJ-3 fix, but guard remains). MIN-3: added boundary tests at length 6 and 64. MIN-4: dropped unreachable `.filter((c) => c.length > 0)` from `buildAlphabets`; renamed the related test to accurately describe what it covers. MIN-5: added focused tests for `copyToClipboard` covering both modern clipboard API and `document.execCommand` fallback. MIN-6: removed redundant `aria-label` from Generate and Copy buttons (visible text is the accessible name). MIN-7: moved `MAX_BITS_SCALE` from `StrengthMeter.js` into `constants.js` next to `STRENGTH_BUCKETS`. MIN-8: dismiss prior "Password copied" toast when user generates a new password.
**Why:** Review round findings; correctness (ARIA invariant, entropy overstatement, storage corruption on all-off), accessibility (aria-live, WCAG 2.5.3), and test coverage.
**Impact:** 230 → 241 tests passing. No shared primitive changes. Lint: 0 errors. Build: green. One deviation from synthesis: MIN-2 Generate-disabled guard stays in the code but is unreachable via normal UI interaction due to MAJ-3 preventing all-off; test for the impossible-via-UI path was removed.
**Files changed:** `src/app/password-generator/constants.js`, `src/app/password-generator/utils.js`, `src/app/password-generator/utils.test.js`, `src/app/password-generator/hooks.js`, `src/app/password-generator/hooks.test.js` (new), `src/app/password-generator/page.js`, `src/app/password-generator/storageUtils.js` (no changes), `src/app/password-generator/components/StrengthMeter.js`, `src/app/password-generator/components/PasswordResult.js`, `src/app/password-generator/components/ClassToggles.js`, `src/app/password-generator/page.test.jsx`, `src/app/password-generator/password-generator.css`.

## 2026-05-04 - Add Password Generator tool
**What changed:** New `/password-generator` route. Cryptographically random password generation (`window.crypto.getRandomValues` via rejection-sampled `secureRandomInt`), length slider (6–64), per-class toggles (upper/lower/digits/symbols + exclude-ambiguous), live entropy/strength meter, copy-to-clipboard. Uses shared `<ToolPage>`, `<Card>`, `<Button>`, `<ToastContainer>`. Settings persisted via `createStorageContext` (key `password_generator_settings`, version `1.0.0`); generated passwords are NEVER persisted. Registered in `src/app/page.js` `TOOLS` and `src/app/sitemap.js`. Added 55 tests (utils, storage validators, page render+interactions).
**Why:** First tool in the tools-batch coordinator plan; expands the tool set with a security-flavored utility.
**Impact:** New route live. No changes to existing tools or shared primitives. `npm run lint` / `npm test` (230 total) / `npm run build` all green. Coordinator hints: `LengthControl`, `ClassToggles`, `pw-toggle` checkbox styling, and `copyToClipboard` helper are tool-local — flagged for promotion when a second tool needs them.
**Files changed:** `src/app/password-generator/**`, `src/app/page.js`, `src/app/sitemap.js`.

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
