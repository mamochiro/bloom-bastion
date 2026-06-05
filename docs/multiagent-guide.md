# Multi-agent orchestration — guide

A practical walkthrough for the tmux multi-agent setup in this repo (modeled on the `saifit` pattern), paired with the project's Claude subagents and slash commands.

## TL;DR

```bash
# 1. Start the agents (once per session)
./scripts/multiagent.sh engine gameplay ui qa

# 2. In the 🎯orch window (window 0), run Claude Code as orchestrator:
#    → write/maintain Plans.md or SPEC milestones
#    → dispatch tasks to domain agents:
./scripts/send-task.sh engine "implement bitECS world + components per SPEC §4.2"

# 3. Wait. Don't poll. Agents reply via:
#    ~/github/bloom-bastion/scripts/send-task.sh orchestrator "done[engine]: ..."

# 4. Run the qa gate after all domain agents report done:
./scripts/send-task.sh qa "run bun run check"

# 5. Commit & push (gh) once done[qa] arrives.
```

## When this is the right tool

| Situation | Use multiagent? |
|---|---|
| 1 task, any domain | ❌ A single Claude Code session is faster |
| 2–3 tasks, same files | ❌ Solo, or worktrees |
| 2–3 tasks, **clean domain isolation** (one in `src/engine`, one in `src/game`, one in `src/ui`) | ✅ Multiagent shines |
| 4+ tasks across engine/gameplay/ui | ✅ Multiagent |
| A milestone needing domain context to persist (M1 core loop, M2 content) | ✅ Multiagent (agents stay warm) |

Bloom Bastion is a **single package** (one `package.json` at root). All agents run from the repo root and scope their edits to their own `src/` subtree — the domain isolation is by directory, not by package.

## Pieces

- `scripts/multiagent.sh` — spawns the tmux session `bloom-agents`: window 0 = orchestrator, one window per agent, plus a `👁watch` window.
- `scripts/send-task.sh` — reliable message delivery (handles Claude Code's bracketed-paste + Enter quirk). **Always use this, never raw `tmux send-keys`.**
- `scripts/watch-agents.sh` — iTerm2 2×2 grid, or attaches to the tmux watch window elsewhere.
- `~/.claude/profiles/bloom-*.md` — per-window system prompts (orchestrator + engine/gameplay/ui/qa identities), loaded via `claude --append-system-prompt-file`.

## Agents & domains

| Agent | Window | Owns | Gate before `done` |
|-------|--------|------|--------------------|
| orchestrator | 🎯orch | delegation, coordination | — |
| engine | 🔧engine | `src/engine/` (ECS, Pixi, pools, flow-field, audio, input, loop) | `bun run lint/typecheck/test` |
| gameplay | 🎮play | `src/game/` (systems, entities, config, balance) | `bun run lint/typecheck/test` |
| ui | 🎨ui | `src/ui/`, `src/store/` (React HUD, Zustand, tokens) | `bun run lint/typecheck/test` |
| qa | ✅qa | root — quality gate, coverage, perf budget, SPEC compliance | `bun run check` |

## Protocol

Agents always end a task by messaging the orchestrator:

- `done[<agent>]: <summary>` — succeeded; orchestrator extracts follow-ups
- `blocked[<agent>]: <reason>. Need: <…>` — orchestrator unblocks/reassigns
- `need[<agent>→<other>]: <request>` — dependency; orchestrator routes to `<other>` first

**Concurrency rule:** never send a second task to an agent that hasn't reported `done`/`blocked`. Fan out only to *different* agents.

**Verify delivery (don't poll for completion):**
```bash
source scripts/multiagent.sh && agent_status
```

## Navigation

- `Ctrl+b <number>` — jump to a window
- `Ctrl+b n` / `Ctrl+b p` — next / previous window
- `Ctrl+b d` — detach (agents keep running); re-attach with `tmux attach -t bloom-agents`
- `./scripts/watch-agents.sh` — live view of all agents at once

## Notes & caveats

- Agents launch with `--dangerously-skip-permissions` so they run autonomously inside the session. Only run this on a repo/machine you trust.
- This complements (does not replace) the in-session Claude subagents in `.claude/agents/` — those are for delegating within one session; this is for parallel long-lived sessions.
- Honest read at current scale (pre-implementation): most early tasks are single-domain and ship fine in one session. Reach for multiagent at M1+ when engine/gameplay/ui work genuinely runs in parallel.
