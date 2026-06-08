# Bloom Bastion — Agent Memory

> This file is auto-loaded by Claude Code at every session start.
> Read SPEC.md for the complete project specification.

---

## 🎯 Project Snapshot

**Bloom Bastion** — Mobile-first 2D tower defense game.
Style: "Cute but deadly" — pastel + neon glow on dark battlefield.
Status: **Pre-implementation** (design done, build starting)

## 📚 Required Reading Order

Before doing ANY work, read these in order:
1. `SPEC.md` — complete spec (your source of truth)
2. `design-assets/README.md` — asset map from designer
3. `design-assets/design-tokens.css` — colors, typography, spacing
4. This file (CLAUDE.md) — current state + rules

## 🔒 Locked Decisions (DO NOT CHANGE)

### Tech Stack
- **Runtime + PM:** Bun 1.2+ (`bun install`, `bun run …` — runs all scripts/tooling)
- **Bundler + Dev:** Vite 6 (runs *on* Bun — Vite owns HMR/bundling, Bun owns runtime)
- **Language:** TypeScript 5.7+ (strict mode)
- **Renderer:** PixiJS v8 (WebGPU-first)
- **ECS:** bitECS (data-oriented, NOT class-based)
- **Animation:** Rive (@rive-app/canvas)
- **UI Tween:** GSAP
- **Audio:** Howler.js
- **UI Overlay:** React 19 (DOM only, NEVER inside canvas)
- **State:** Zustand (UI state only, NOT game state)
- **Lint + Format:** Biome (replaces ESLint + Prettier)
- **Test:** Vitest (unit, on Bun) + Playwright (E2E)

> **Bun vs Vite — they're not competitors.** Bun is a *runtime + package manager*; Vite is a *dev server + bundler that runs on a runtime*. We use Bun where it's strictly faster (install/runtime/scripts) and keep Vite where it's strictly better for a Pixi game (HMR, asset plugins, Rollup manual-chunking for the <400KB budget). See SPEC §3.

### Forbidden
- ❌ Next.js, Phaser, Three.js (see SPEC for why)
- ❌ Class-based ECS
- ❌ Hardcoded colors (use design tokens)
- ❌ Direct DOM access inside game loop
- ❌ A* per-entity pathfinding (use flow field)
- ❌ Allocations in hot path (use object pools)
- ❌ npm / yarn / pnpm for installs (use Bun; commit `bun.lockb`)
- ❌ Dropping Vite for Bun's native bundler (loses HMR/plugin/chunking maturity)
- ❌ ESLint + Prettier (Biome replaces both)

## 🎨 Design Source of Truth

All visual decisions reference `design-assets/`:
- Colors → `design-tokens.css` CSS vars
- Typography → `design-tokens.css` font vars
- Sprites → `<use href="/sprites.svg#tower-blossom-l1" />`
- Layouts → match `mockups/*.html` within 95% fidelity

## 🏗️ Architecture Rules

1. **Game state lives in ECS components**, never in React state
2. **React reads minimal snapshot** from Zustand, throttled 10Hz max
3. **Systems run in fixed order** (see SPEC §4.2)
4. **All hot-path entities pooled** (particles, projectiles, enemies)
5. **Flow field pathfinding** — compute on map change, never per-entity
6. **Adaptive quality** — auto-degrade if FPS < 50

## 📂 Workspace Layout

```
bloom-bastion/
├── SPEC.md                ← full spec
├── CLAUDE.md              ← this file
├── design-assets/         ← from designer (read-only)
├── src/
│   ├── engine/           ← reusable game engine
│   ├── game/             ← Bloom Bastion specific
│   ├── ui/               ← React components
│   ├── store/            ← Zustand stores
│   └── assets/           ← sprites, audio, rive
├── tests/
└── docs/decisions/       ← ADRs
```

## 🎯 Current Milestone

**M0 — Foundation** (in progress)

Tasks remaining:
- [ ] Scaffold with Bun + Vite 6 + TS + Pixi + bitECS (`bun create vite`)
- [ ] Integrate design tokens
- [ ] Smoke test: render canvas with 1 tower + 1 enemy walking path
- [ ] Set up Vitest + Playwright
- [ ] Deploy preview to Vercel

See SPEC §13 for full roadmap.

## 📝 Recent Decisions

(Append-only log. Newest first.)

- **2026-06-05** — Added 6 project subagents in `.claude/agents/` (engine-dev, gameplay-dev, ui-dev, perf-guardian, test-engineer, spec-reviewer)
- **2026-06-05** — Stack modernized: Bun (runtime/PM) + Vite 6 + React 19 + Biome; Bun runs Vite, not replaces it
- **2026-06-05** — Design phase complete, assets in `design-assets/`
- **2026-06-05** — Locked tech stack (Vite/Pixi/bitECS/Rive/React-UI-only)
- **2026-06-05** — SPEC.md committed as source of truth

## 🚦 Working Agreements

When implementing:
1. **Read before write** — always view existing files first
2. **Small commits** — one logical change per commit
3. **Test as you go** — write Vitest for any logic-heavy code
4. **Profile claims** — "this is fast" requires numbers
5. **Match the spec** — if SPEC is wrong, update SPEC first, then code
6. **Ask before deviating** — if you want to change a locked decision, ask user first

## 🆘 If You're Lost

1. Re-read SPEC.md fully
2. Check `docs/decisions/` for ADRs
3. Look at `design-assets/mockups/` for visual reference
4. Ask the user — don't guess on architecture

---

**Build with care. Ship with confidence.** 🌸