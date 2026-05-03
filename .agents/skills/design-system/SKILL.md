# Skill: design-system

> **Load before any UI work** — pages, forms, lists, modals, anything visible.

The visual + reuse rules for this codebase live in `.agents/skills/conventions/SKILL.md` (the original `CLAUDE.md`). That document is the source of truth. This skill is the short pointer.

## Hard rules (lifted from conventions)

- Use `<ToolPage>` for every tool page. Don't recreate the page shell.
- Use `<Button variant="…">` for every button. Never write button CSS in tool files.
- Use `<Card>`, `<ResultCard>`, `<ToastContainer>`, `<ErrorBoundary>` from `src/components/`.
- New visual variants (button color, card modifier) go in `src/styles/tools.css` AND the matching component prop — same PR.
- `PropTypes` for component prop validation.
- Tool-local CSS files contain only tool-specific layout. Page shell, hero, buttons, toasts, error boundaries are NOT tool-local.

## Project-specific TODO

Fill in here as visual conventions solidify (e.g., "every coloured badge uses white text", "headings use the Hero component, never raw `<h1>`"). Today there are no rules beyond what's in the conventions skill.
