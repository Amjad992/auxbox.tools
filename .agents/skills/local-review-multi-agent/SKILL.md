# Skill: local-review-multi-agent

How to run a multi-reviewer round on the current branch.

## Reviewer set (all three available; user picks per round)

- **CodeRabbit** — runs on its own infra; near-zero local-token cost.
- **Codex** — via the `codex:codex-rescue` subagent.
- **Copilot** — invoked manually by the user (no local CLI integration assumed).

By default all three are available. The user will say "skip Codex this round" or similar when they want to drop one.

## Folder layout

Topic-scoped instructions and dated rounds:

```
playground/reviews/
  instructions/
    <topic>/
      coordinator.md       # what this topic's reviewer should look for
  review-rounds/
    <topic>/
      YYYY-MM-DD/
        review-findings.md      # primary reviewer (Opus)
        codex-findings.md       # if Codex used
        coderabbit-findings.md  # if CodeRabbit used
        communication.md        # decisions, deferrals, sign-offs
```

Topics worth seeding when first needed (don't pre-create empties): `security`, `performance`, `reliability`, `reusability`, `access-control`, `accessibility`, `api-contract`, `supply-chain`, `data-integrity`, `ux-states`, `responsiveness`, `docs-sync`, `testing`, `general`.

## Round rules

- **One round per topic at a time.** Don't run security and performance in parallel — findings get conflated.
- **No deferral across rounds.** Implement everything found in a round before moving on. If something genuinely must be deferred, write it as a follow-up plan under `playground/roadmap/...` and link it from `communication.md`.
- **Commit between rounds.** Each round's fixes land as their own commit(s) before the next round starts.

## Coordinator / reviewer / implementer split (Claude only)

This split is for Claude (Opus + Sonnet). On Codex / Cursor / other tools, ignore — the equivalent doesn't apply.

- **Coordinator = Opus** (the main session). Light touch. Spawns subagents, synthesizes findings, makes decisions. **Does not implement.**
- **Primary reviewer = Opus subagent.** Spawn via `Agent` with `subagent_type: "general-purpose"` and `model: "opus"`. Reads the topic's `instructions/<topic>/coordinator.md` and writes `review-findings.md`.
- **Auxiliary reviewer (Codex) = Codex subagent.** Spawn via `subagent_type: "codex:codex-rescue"`; output to `codex-findings.md`.
- **Auxiliary reviewer (CodeRabbit).** Run:
  ```
  coderabbit review --plain --base origin/main --type committed > /tmp/coderabbit-<topic>-YYYY-MM-DD.txt 2>&1
  ```
  Then save the relevant excerpt to `coderabbit-findings.md`.
- **Implementer = Sonnet subagent.** Spawn via `Agent` with `subagent_type: "general-purpose"` and `model: "sonnet"`. Pass it the findings file path and the scope. Sonnet does it end-to-end: edits, lint, typecheck, tests, changelog entry, commit. Reports a concise summary back. Avoids re-narrating per-step in the main session.

**Why this split:** Sonnet is roughly 5× cheaper than Opus on the implementation phase, which is mechanical. Reviewing requires Opus quality. This keeps quality on the judgment work and saves quota on the mechanical work.
