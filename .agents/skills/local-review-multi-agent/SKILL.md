# Skill: local-review-multi-agent

How to run a multi-reviewer round on the current branch. **Everything happens through files in the round folder. Chat between coordinator and reviewers is for status only — review content always lives in files.**

## Reviewer set (default = all four)

- **Opus subagent** — primary reviewer.
- **Codex** — auxiliary; spawned via the `codex:codex-rescue` subagent or the `codex-companion` CLI.
- **CodeRabbit** — runs on its own infra; near-zero local-token cost.
- **Copilot** — invoked manually by the user. The coordinator cannot drive Copilot directly, so the bridge is a copy-paste prompt + a findings file the user populates.

Copilot is included by default — only drop it when the user explicitly says "skip Copilot this round". Same applies to the others if the user opts out per round.

## Folder layout

Topic-scoped instructions (stable) + dated round folders (per-run):

```
playground/reviews/
  instructions/
    <topic>/
      coordinator.md             # what reviewers should look for in this topic
  review-rounds/
    <topic>/
      YYYY-MM-DD/
        instructions.md          # per-round briefing: branch, base, scope, links to topic instructions
        copilot-prompt.md        # self-contained prompt the user pastes into Copilot
        review-findings.md       # Opus
        codex-findings.md        # Codex
        coderabbit-findings.md   # CodeRabbit
        copilot-findings.md      # Copilot (user pastes Copilot's output here)
        communication.md         # FILE-BASED two-way comm channel (see "Communication" below)
```

Topics worth seeding when first needed (don't pre-create empties): `security`, `performance`, `reliability`, `reusability`, `access-control`, `accessibility`, `api-contract`, `supply-chain`, `data-integrity`, `ux-states`, `responsiveness`, `docs-sync`, `testing`, `general`.

## Round protocol — step by step

1. **Confirm topic + reviewer set** with the user (one quick chat exchange — the only content allowed in chat for this round).
2. **Create the round folder** at `playground/reviews/review-rounds/<topic>/YYYY-MM-DD/`.
3. **Write `instructions.md`** in the round folder: branch under review, base for the diff, scope summary, link to `playground/reviews/instructions/<topic>/coordinator.md`. Every reviewer reads this first.
4. **Write `copilot-prompt.md`** in the round folder. This is the **first deliverable** of any round. Show its contents to the user verbatim in chat as a single fenced code block they can copy-paste into Copilot. The prompt MUST instruct Copilot to:
   - Read `playground/reviews/review-rounds/<topic>/YYYY-MM-DD/instructions.md` and `playground/reviews/instructions/<topic>/coordinator.md` first.
   - Write all findings (in the format specified by the topic instructions) into `playground/reviews/review-rounds/<topic>/YYYY-MM-DD/copilot-findings.md`. If Copilot cannot write files in its environment, the user pastes Copilot's output verbatim into that file as the file body.
   - Write any questions / clarifications into `playground/reviews/review-rounds/<topic>/YYYY-MM-DD/communication.md` under a `### Copilot — <timestamp>` heading. The coordinator answers in the same file under `### Coordinator — <timestamp>`.
5. **Create `communication.md`** with a brief header so reviewers and the user know it's the comm channel.
6. **Spawn the Claude/CLI reviewers** (Opus subagent, Codex, CodeRabbit). Each one's prompt points at `instructions.md` + the topic instructions and tells them where to write findings + how to use `communication.md` for questions.
7. **User pastes the Copilot prompt** into Copilot, runs it, then writes "copilot done" in chat. Coordinator reads `copilot-findings.md` from disk — does not ask the user to paste content.
8. **Synthesize.** When all enabled reviewers have populated their findings file, the coordinator writes a synthesis to `communication.md` (deduped, severity-ranked, with explicit "fix" vs "defer" decisions and reasoning). No findings are repeated in chat.
9. **Implementer (Sonnet subagent).** Hand it the round folder path. It reads the synthesis, applies fixes end-to-end, lints/tests/builds, updates `.agents/changelog.md`, and commits. Reports a one-paragraph summary. Coordinator records the result line in `communication.md` under `### Round closed — <timestamp>`.

## Round rules

- **One round per topic at a time.** Don't run security and performance in parallel — findings get conflated.
- **No deferral across rounds.** Implement everything from a round before starting the next. If something must genuinely defer, write a follow-up plan under `playground/roadmap/...` and link it from `communication.md` with the reason.
- **Commit between rounds.** Each round's fixes land as their own commit(s) before the next round starts.
- **Files first, chat second.** Chat is for go/no-go pings ("ready", "copilot done", "synthesis written"). All review content — findings, questions, answers, decisions, sign-offs — goes in the round-folder files. The coordinator does not paste reviewer findings into chat; it points the user at the file.

## Communication file conventions

`communication.md` is the file-based dialogue. Anyone with access can append; nobody rewrites others' entries.

```
## Communication — <topic> — YYYY-MM-DD

### Coordinator — 2026-05-04 14:32
Question for Codex: should F2 be major or minor given …?

### Codex — 2026-05-04 14:40
F2 should be major because …

### Coordinator — 2026-05-04 14:42 — Synthesis
Final fix list (in priority order): …

### Round closed — 2026-05-04 15:10
Implementer commit: <sha>. All findings addressed.
```

Reviewers (and the user, on Copilot's behalf) write their questions here under their own heading. The coordinator answers under its own heading. No content moves through chat.

## Coordinator / reviewer / implementer split (Claude only)

This split is for Claude (Opus + Sonnet). On Codex / Cursor / other tools, ignore — the equivalent doesn't apply.

- **Coordinator = Opus** (the main session). Light touch. Writes the per-round files in step 2–5, spawns subagents, synthesizes findings, makes decisions. **Does not implement.**
- **Primary reviewer = Opus subagent.** Spawn via `Agent` with `subagent_type: "general-purpose"` and `model: "opus"`. Reads `instructions.md` + the topic's `instructions/<topic>/coordinator.md` and writes `review-findings.md`. Uses `communication.md` for any questions.
- **Auxiliary reviewer (Codex).** Either `subagent_type: "codex:codex-rescue"` or the codex-companion CLI directly: `node "$CODEX_HOME/scripts/codex-companion.mjs" review --background --base <ref> --scope branch`. Output goes to `codex-findings.md` (rendered Markdown body, stripping ANSI / non-finding stderr).
- **Auxiliary reviewer (CodeRabbit).** Run:
  ```
  coderabbit review --plain --base <base-ref> --type committed > /tmp/coderabbit-<topic>-YYYY-MM-DD.txt 2>&1
  ```
  Then save the relevant excerpt to `coderabbit-findings.md` in the round folder.
- **Auxiliary reviewer (Copilot).** Coordinator writes `copilot-prompt.md`, shows it to the user once for copy-paste. User runs Copilot, populates `copilot-findings.md`, says "copilot done" in chat. Coordinator reads from disk.
- **Implementer = Sonnet subagent.** Spawn via `Agent` with `subagent_type: "general-purpose"` and `model: "sonnet"`. Pass it the synthesis pointer (`communication.md` plus the per-reviewer files). It edits, lints, tests, builds, updates the changelog, commits, and reports back. Records `### Round closed — <timestamp>` in `communication.md`.

**Why this split:** Sonnet is roughly 5× cheaper than Opus on mechanical implementation work. Reviewing requires Opus quality. This keeps quality on the judgment work and saves quota on the mechanical work.
