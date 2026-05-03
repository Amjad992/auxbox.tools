# Repo Overview — auxbox.tools

A growing collection of small, free web tools (CGPA Calculator, QR Code Generator, Salary Raise Calculator, …). Single Next.js app, App Router, JavaScript (no TypeScript).

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack dev)
- **UI:** React 19, Tailwind v4 (via `@tailwindcss/postcss`)
- **Lang:** JavaScript (`jsconfig.json`)
- **Package manager:** npm
- **Lint:** `eslint-config-next` (`npm run lint`)
- **Tests:** Vitest (`npm test`)

## Where things live

| Path | Purpose |
| --- | --- |
| `src/app/` | App Router. One folder per tool route. |
| `src/app/page.js` | Landing page; `TOOLS` list registers each tool card. |
| `src/app/sitemap.js` | Add new routes here. |
| `src/components/` | Shared React components (`ToolPage`, `Hero`, `Button`, `Card`, `ResultCard`, `ToastContainer`, `ErrorBoundary`). |
| `src/styles/tools.css` | Shared visual primitives (page shell, hero, cards, buttons, toasts). |
| `src/lib/` | `storage` (versioned localStorage), `createStorageContext` (Provider/hook factory). |
| `src/hooks/` | `useToast`, etc. |
| `src/providers/` | App-level providers. |

## How a tool is structured

```
src/app/<tool>/
  page.js          // 'use client' if interactive; wraps with <ToolPage>
  layout.js        // exports metadata
  <tool>.css       // tool-specific layout only
  components/      // tool-specific components
  hooks.js         // tool-specific hooks
  utils.js
  constants.js
  storageUtils.js  // if persisted
  StorageContext.js // built via createStorageContext
```

## Adding a new tool — quick path

1. Read `.agents/skills/conventions/SKILL.md` (the reuse-first guide). Required.
2. Read `.agents/skills/new-entities/SKILL.md` for the checklist.
3. Register in `src/app/page.js` (`TOOLS`) and `src/app/sitemap.js`.

## Gotchas

- `playground/` is gitignored. Plans, handover, reviews are per-developer scratch.
- The pre-commit hook requires `.agents/changelog.md` to be staged whenever any source file is staged. No `--no-verify` workarounds.
- The user maintains `staging` themselves — agents do not create or push it.
