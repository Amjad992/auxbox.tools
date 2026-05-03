# Skill: review

How to act on a review round (consuming `playground/reviews/review-rounds/<topic>/YYYY-MM-DD/`).

## Rules

1. **One round at a time.** Finish the current topic before starting another.
2. **No deferral across rounds.** Implement everything found. If something *must* be deferred, write it as a follow-up plan under `playground/roadmap/...` and link it from `communication.md`.
3. **Acknowledge corrections.** If a reviewer caught something you previously dismissed, say so explicitly in `communication.md` — don't bury the reversal.
4. **Commit between rounds.** Each round's fixes land as their own commit(s) before the next round starts.
5. **Update the changelog.** A review-round fix is a structural / behavior change — append to `.agents/changelog.md`.

## Implementer split (Claude only)

For mechanical implementation work after the review, spawn a Sonnet implementer subagent (`Agent` with `subagent_type: "general-purpose"`, `model: "sonnet"`). Pass:

- The findings file path.
- The scope (which findings to address).
- The expected verification commands (`npm test`, `npm run lint`, `npm run build`).
- The instruction to update `.agents/changelog.md` and commit.

See `.agents/skills/local-review-multi-agent/SKILL.md` for full details.
