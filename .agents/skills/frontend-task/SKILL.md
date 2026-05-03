# Skill: frontend-task

Load for any UI change (page, component, form, list, modal, badge — anything visible).

## Always read first

- `.agents/skills/conventions/SKILL.md` — the reuse-first source of truth.
- `.agents/skills/design-system/SKILL.md` — visual rules pointer.

## Client-component rule

A component using state, effects, refs, browser APIs, or event handlers needs `'use client'` at the top. Forgetting this fails at build, not lint — verify with `npm run build`.

## State patterns

- Local UI state → `useState` / `useReducer`.
- Persisted tool state → `createStorageContext` (versioned). Never write `localStorage.getItem(...)` directly inside a component.
- Toasts → `useToast()` from `src/hooks/useToast`.
- Errors → `<ErrorBoundary>` is wired by `<ToolPage>`. Use a nested boundary only when an inner section can fail independently.

## Accessibility quick checks

- Every interactive element is focusable and reachable by keyboard.
- Labels are associated with inputs (`<label htmlFor>` or wrapping `<label>`).
- Color is never the only signal — pair with text / icon.
- `aria-live="polite"` on regions that update asynchronously (results, toasts).

## Verification (golden path + edge cases)

Type-checking and tests verify code, not feature correctness. For UI:

1. Start dev server (`npm run dev`).
2. Walk the golden path in a browser.
3. Walk at least one edge case (empty input, max bound, error state).
4. Watch the console for warnings (unused props, key warnings, hydration mismatches).

If you can't open a browser in this session, say so — don't claim the feature works.

## Common pitfalls

- Forgetting `'use client'` on a hook-using component.
- Re-creating a `<HeroSection>` instead of using `<ToolPage>`'s built-in hero.
- Inline `style={{...}}` for what should be a `tools.css` class.
- Adding `useState` for filter/search/pagination state that should be URL-driven (so users can share / refresh and keep state).
