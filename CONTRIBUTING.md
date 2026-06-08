# Contributing to Bloom Bastion

> Read `SPEC.md` (source of truth) and `CLAUDE.md` (locked decisions) before any change.

## Toolchain

| Task | Command |
|------|---------|
| Install deps | `bun install` |
| Add a dep | `bun add <pkg>` / `bun add -d <pkg>` |
| Dev server (HMR) | `bun run dev` |
| Lint + format check | `bun run lint` |
| Auto-fix lint/format | `bun run lint:fix` |
| Type-check | `bun run typecheck` |
| Unit tests | `bun run test` |
| E2E tests | `bun run test:e2e` |
| Production build | `bun run build` |
| Full pre-commit gate | `bun run check` *(or the `/check` command)* |

**Bun is the runtime + package manager; Vite is the bundler running on it.** Never use `npm`/`yarn`/`pnpm` — commit a single `bun.lockb`. See `docs/decisions/ADR-0001-tech-stack.md`.

## Workflow (we commit & push via `gh` CLI)

1. **Branch from `main`** — never commit directly to `main`.
   ```bash
   git switch -c feat/<short-name>
   ```
2. **Sync context** before starting: `/sync`.
3. **Implement** — read before write, small single-purpose commits, tests as you go.
4. **Gate locally**: `bun run check` must pass.
5. **Review**: run the `spec-reviewer` agent on non-trivial diffs.
6. **Commit** (see message convention below).
7. **Push & open PR** with `gh`:
   ```bash
   git push -u origin HEAD
   gh pr create --fill --base main
   ```
8. **CI must be green** (`.github/workflows/ci.yml`: Biome · tsc · Vitest · build · bundle-size gate) before merge.

## Commit message convention

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <summary>

<optional body>

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

- **type:** `feat` `fix` `perf` `refactor` `test` `docs` `chore` `build` `ci`
- **scope:** `engine` `gameplay` `ui` `store` `config` `pathfinding` `audio` `ci` …
- Keep the summary ≤ 72 chars, imperative mood.

Example: `feat(gameplay): add Stormcloud chain-lightning tower`

## Locked decisions (do not violate — see CLAUDE.md / SPEC §3.2)

- bitECS only (no class ECS); game state in ECS, never React/Zustand.
- Flow-field pathfinding only (no per-entity A*); zero allocations in the hot path (pool everything).
- No hardcoded colors/spacing/fonts — use design tokens.
- React 19 is DOM-overlay only, never inside the canvas; reads a ≤10Hz Zustand snapshot.
- No Next.js / Phaser / Three.js / Redux / MobX / CSS-in-JS runtime / ESLint+Prettier.

**Changing a locked decision requires:** an ADR in `docs/decisions/` (use `0000-template.md` or `/adr`), a `SPEC.md` update, and a `CLAUDE.md` "Recent Decisions" entry.

## Agents & commands

Project subagents live in `.claude/agents/` — `engine-dev`, `gameplay-dev`, `ui-dev`, `perf-guardian`, `test-engineer`, `spec-reviewer`.
Slash commands in `.claude/commands/` — `/sync` `/scaffold` `/check` `/adr` `/remember` `/tower-add` `/wave-test` `/perf-profile` `/ship` `/clean`.
