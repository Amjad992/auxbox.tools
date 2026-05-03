# Auxbox Tools — Reuse-First Guide

This codebase is a growing collection of small, free tools (CGPA Calculator,
QR Code Generator, Salary Raise Calculator, …). New tools are added regularly.

To keep the codebase small as it grows, **reuse before you build**. Read this
document before adding a new tool or new UI in an existing tool.

---

## Rule 0 — Don't reinvent the wheel

Before writing any UI element, button, card, page shell, hero, toast, error
boundary, storage layer, or styling rule:

1. **Look** in `src/components/`, `src/styles/tools.css`, `src/lib/`, `src/hooks/`.
2. If something close exists, **use it** (or extend it).
3. If nothing close exists and you'll need it more than once, **build it
   into the shared location first**, then consume it.

Tool-local files should contain only the layout and logic that is genuinely
specific to that tool.

---

## What's already shared

### Visual primitives — `src/styles/tools.css`

Auto-loaded via `globals.css`. Every page gets these classes for free:

| Class | Use for |
| --- | --- |
| `.tool-page` | Outer `<main>` for any tool page (dark gradient bg + padding) |
| `.tool-page .container` | Centered max-width content (default 1200px) |
| `.container--narrow` | 720px variant for single-column tools |
| `.tool-hero` / `.tool-tagline` | Page header with brand glow |
| `.tool-card` / `.tool-card--inset` | Standard surface (border + radius + bg) |
| `.btn` + `.btn-{primary,success,danger,warning,info,neutral}` | All buttons |
| `.btn-block` | Full-width modifier |
| `.tool-results-grid` + `.tool-result-card` + `.tool-result-value` | Stat tiles |
| `.toast-container` / `.toast` / `.toast-success` | Toast notifications |
| `.error-boundary` | Error fallback |

Any new color/variant should be added **here**, not in a tool-local CSS file.

### React components — `src/components/`

| Component | Use it for |
| --- | --- |
| `ToolPage` | Wrap every tool page. Handles `<main>` shell, container, hero, optional LD+JSON schema, and error boundary. |
| `Hero` | Title + tagline header (already used inside `ToolPage`). |
| `Button` | Every button. Pass a `variant` prop, never write button CSS. |
| `Card` | Generic surface — use instead of redefining a `<section>` with bg/border/radius. |
| `ResultCard` | One stat tile inside a `tool-results-grid`. |
| `ToastContainer` | Render toasts. Pair with `useToast`. |
| `ErrorBoundary` | Already wired by `ToolPage`. Use directly only for nested boundaries. |

### Hooks & libs

| Module | Use it for |
| --- | --- |
| `src/hooks/useToast` | Toast lifecycle (show / dismiss / auto-expire). |
| `src/lib/storage` | `saveToLocalStorage`, `loadFromLocalStorage`, `clearLocalStorage`, `deepEqual`. Versioned storage primitives. |
| `src/lib/createStorageContext` | Build a Provider/hook for a tool's persisted state. Pass `{version, entries}`; get `load{Name}`, `save{Name}`, `clear{Name}`, `storageErrors`, `hasSavedData`. |

---

## Adding a new tool — checklist

When adding a tool at `/<my-tool>`:

1. **Folder**: `src/app/<my-tool>/`
   - `page.js` — `'use client'` if interactive. Wrap with `<ToolPage>`. Pass
     `title`, `tagline`, optional `schema`, `narrow` if you want 720px width.
   - `layout.js` — exports `metadata` (title/description/OG/twitter/canonical).
   - `<my-tool>.css` — **only** tool-specific layout. No page shell, no hero,
     no buttons, no toast, no error-boundary CSS.
   - `components/` — tool-specific components.
   - `hooks.js`, `utils.js`, `constants.js` — as needed.
   - If the tool persists data: `storageUtils.js` (validators) + `StorageContext.js`
     built via `createStorageContext`.
2. **Wire it up**:
   - Add an entry to `TOOLS` in [src/app/page.js](src/app/page.js).
   - Add the route to [src/app/sitemap.js](src/app/sitemap.js).
3. **Reuse**:
   - Buttons → `<Button variant="…">`.
   - Surfaces → `<Card>`.
   - Stat tiles → `<ResultCard>` in `<div className="tool-results-grid">`.
   - Toasts → `useToast()` + `<ToastContainer toasts onDismiss />`.
   - LocalStorage → `createStorageContext`.
4. **Don't**:
   - Don't define a new page-shell class (`.foo-page`) — use `.tool-page`.
   - Don't redefine `.toast`, `.error-boundary`, button colors, or hero
     gradients in tool CSS — they live in `tools.css`.
   - Don't rebuild a `<HeroSection>` per tool — `ToolPage` renders the hero.
   - Don't copy the storage save/load/clear pattern by hand — use the factory.

---

## When to extend the shared layer

If you find yourself wanting to:

- Add a new button color → add a `.btn-<name>` variant in `tools.css` and a new
  `variant` prop value in `Button.js`. Both, in one PR.
- Add a new card style → add a modifier class (e.g. `.tool-card--<name>`) and
  expose it via a `Card` prop.
- Build a UI element that any future tool might need (badge, slider, range
  input, tab list, modal, …) → put it in `src/components/` from day one.

If a piece looks one-off but you can imagine a second tool wanting it, build
it shared. The cost of moving a one-off component into shared later is much
higher than the cost of starting it shared.

---

## Code style notes

- Use `PropTypes` for component prop validation (codebase convention).
- Keep tool-local CSS files small. The bigger they get, the more likely
  they're hiding something that should be shared.
- File references in commits / docs use the format
  `src/app/foo/page.js:42` so editors can click to navigate.
- No emojis in code or comments unless asked.
- Comments only when the *why* is non-obvious.

---

## When in doubt

Read this file. Then read `src/components/` and `src/styles/tools.css`. If
the answer isn't there, the gap is the answer — fill it in shared first.
