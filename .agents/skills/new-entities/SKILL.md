# Skill: new-entities — Adding a new tool

Load this skill any time you create a new route under `src/app/<tool>/`.

This skill is the procedural checklist. The reuse-first rules and shared component inventory are in `.agents/skills/conventions/SKILL.md` — **read that first** if you haven't already this session.

## Order of operations

1. **Confirm the slug** with the user (`/<my-tool>`). Slug is kebab-case, matches the folder name.
2. **Branching question** (per the roadmap skill): new branch off `main`, or continue current?
3. **Plan file** (`.agents/skills/roadmap/SKILL.md` template) under `playground/roadmap/...`.

## Folder skeleton

```
src/app/<my-tool>/
  page.js          // 'use client' if interactive; <ToolPage title=... tagline=...>
  layout.js        // metadata: title, description, openGraph, twitter, alternates.canonical
  <my-tool>.css    // ONLY tool-specific layout. No page shell, no buttons, no toasts.
  components/      // tool-specific components (split when page.js grows)
  hooks.js         // tool-specific hooks
  utils.js         // pure helpers (test these)
  constants.js     // labels, defaults, option lists
  storageUtils.js  // OPTIONAL: validators if persisting
  StorageContext.js // OPTIONAL: built via createStorageContext
```

## Wire-up

- `src/app/page.js` — add an entry to `TOOLS`.
- `src/app/sitemap.js` — add the new route.
- `README.md` — list the new tool if it has a featured row.

## Reuse defaults (enforced)

- Buttons → `<Button variant="…">`. **Never** write button CSS in `<my-tool>.css`.
- Surfaces → `<Card>` or `.tool-card` modifier classes. Don't redeclare bg/border/radius.
- Stat tiles → `<ResultCard>` inside `<div className="tool-results-grid">`.
- Toasts → `useToast()` + `<ToastContainer toasts={...} onDismiss={...} />`.
- LocalStorage → `createStorageContext({ version, entries })`. Don't hand-roll save/load.

## Tests (testing skill)

Add `<my-tool>/utils.test.js` covering edge cases of the core math/logic. CGPA / raise / similar tools have lots of boundary conditions — write the failing test for each known edge case before implementing the fix.

## Verification

- `npm run lint` clean.
- `npm test` clean.
- `npm run build` clean.
- Dev-server smoke test: golden path + at least one edge case in the browser.
- `.agents/changelog.md` updated.
- `playground/HANDOVER.md` reflects the new tool.

## Common mistakes

- Writing a `<HeroSection>` per tool — `ToolPage` already renders the hero.
- Defining a new `.foo-page` class — use `.tool-page`.
- Reimplementing toast / error boundary CSS — they're in `tools.css`.
- Persisting state without versioning — always use `createStorageContext` with a version number.
