# Skill: testing

Vitest is the test runner.

## Commands

- `npm test` — run tests once.
- `npm run test:watch` — watch mode while developing.

## Where tests live

Co-locate tests next to the code they cover:

```
src/lib/storage.js
src/lib/storage.test.js
```

Or a tool's utility:

```
src/app/salary-raise-calculator/utils.js
src/app/salary-raise-calculator/utils.test.js
```

UI / component tests can live next to the component as `<Component>.test.jsx`.

## What to test

- **Pure utilities and calculations** — every tool has math (CGPA, raise, …). These are the highest-value tests; cover edge cases (zero, negative, NaN, empty input, max bounds).
- **Storage round-trips** — anything going through `src/lib/storage` or `createStorageContext`. Test that a saved value loads back unchanged across the version boundary.
- **Validators** — `storageUtils.js` validators must reject bad shapes.
- **Behavior changes** — when you fix a bug, write the test that would have caught it.

## What NOT to test

- Trivial getters / pass-throughs.
- Framework code (Next.js routing, React hooks behavior itself).
- Visual styling — leave this to manual / browser verification.

## Browser-only APIs

`localStorage` and `window` aren't present in Node. For tests that touch them, configure `vitest` with `environment: 'jsdom'` (already the default in `vitest.config.js`).

## Writing rule

A test that doesn't fail on the bug it's claiming to cover is worse than no test. When fixing a bug, **first** write a test that fails on the broken code, **then** apply the fix and watch it pass.
