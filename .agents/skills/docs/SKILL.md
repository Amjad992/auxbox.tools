# Skill: docs

Updating user-facing or repo docs.

## Files in scope

- `README.md` — top-level project intro.
- Per-tool `layout.js` `metadata` exports (titles, descriptions, OG/twitter, canonical).
- `src/app/page.js` `TOOLS` registry — the landing-page list.
- `src/app/sitemap.js` — must include every tool route.
- `.agents/context.md` — when "where things live" actually changes.
- `.agents/changelog.md` — every structural / behavior change (enforced by hook).

## When to update

- New tool → README, `TOOLS`, sitemap, metadata.
- Renamed component / moved shared file → `.agents/context.md` if it shifts the "where to look first" answer.
- New shared primitive (button variant, card modifier, hook) → `.agents/skills/conventions/SKILL.md` table entry.
- New skill / new protocol rule → update `.agents/on-demand-skills.md` and the loading policy.

## Don't

- Don't write a top-level `docs/` site for this project — it's not the shape of the codebase. Keep docs near the thing they describe.
- Don't duplicate content between `CLAUDE.md`, `AGENTS.md`, `agent.md`. They're `@import` shims pointing at the same `.agents/` core.
- Don't write README sections that restate the conventions skill — link to it.
