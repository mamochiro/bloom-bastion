# Bloom Bastion — Agent Memory

> This file is auto-loaded by Claude Code at every session start.
> Read SPEC.md for the complete project specification.

---

## 🎯 Project Snapshot

**Bloom Bastion** — Mobile-first 2D tower defense game.
Style: "Cute but deadly" — pastel + neon glow on dark battlefield.
Status: **Feature-complete & playable** — full campaign + Endless mode, all 6 towers ×3
levels, 8 enemies + 2 bosses, 3 skills, Settings/Quality. Now in polish/expansion.

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

## 🎯 Current Status

**Full playable campaign.** Start screen → pick difficulty (Casual/Normal/Hardcore,
§6.5) → place + **upgrade L1→L2→L3 / sell** (tap tower → UpgradePanel, §6.1/§6.7)
all **6 towers** (Blossom slow / Stormcloud chain / Sugar Cannon AoE-splash /
Luna Crystal sniper / Hive bee-summoner / Bubbler push+slow) × 3 upgrade levels → fight
**20 §6.3-faithful waves** of **all 8 §6.2 enemies** (Grub, Snail/armor, Flutter/flying,
Shade/dodge, Plushy/regen, Splitter/split, + bosses **Candy King** @5/10/15 and
**Neon Dragon** @20) → use **3 skills** (Meteor + Freeze@5 + Gold Rush@10) → win
("BLOOM PREVAILS") / lose → replay — **or pick ENDLESS** (start-screen button): infinite
procedurally-scaled waves past 20 (HP ×1.15ⁿ), no win, ends on lives 0 → "RUN ENDED /
Wave Reached: N". Data-driven waves (ADR-0003), wave-clear economy,
boss-phase system, difficulty scaling, real SVG sprite art, **VFX** (hit-flash, death
bursts, floating gold, Meteor impact, idle sprite motion, dragon enrage tint, skill
screen flash) + **§4.5 adaptive quality**. **Pipeline 10/10 systems REAL — no stubs**
(AnimationSystem drives the VFX).
Tower upgrades L1→L2→L3 + sell wired; **ALL 6 towers built × 3 levels = 18 configs
(full §6.1 roster COMPLETE)** + **Endless mode** + **Settings/Quality UI** (§4.5
Auto/Low/High override, gear on StartScreen) — Vitest 311/311, ~245KB gz, E2E 4 specs.
`Projectile.special` ui16 (14/16 bits).
**Pooled friendly `Minion` entity** (engine: Minion component + minionPool 64 +
minionQuery; sprite 400-band centered) drives the Hive's bees. **Per-application
slow DONE** (was tracked follow-up): each slow source carries its own magnitude+
duration as data (`TOWERS.<id>.slow`) via the shared `applySlow` → `Status.slowFactor`
(engine: one new field) — Blossom 40%/2s · Sugar L3 20%/1s · Bubbler 30%/1.5s, all
§6.1-accurate; strongest-wins/refresh-to-longer stacking (§6.1 note).
**M0 COMPLETE** — first Playwright E2E happy-path (`tests/e2e/happy-path.spec.ts`,
mobile Pixel-5) is GREEN: real-browser runtime proof that the game boots (Pixi renders
a real `<canvas>`) and plays a live wave with ZERO uncaught exceptions (`bun run test:e2e`).

**Next up (all polish/expansion — core game is complete):** enemy-palette token ADR ·
balance playtest tuning · audio (Howler — needs sound assets, then Settings SFX/Music/
Haptics) · pause menu. (Done: all 6 towers ×3 levels · upgrades+sell · Endless · Settings/Quality.)
**SPEC clarifications flagged:** Stormcloud chain radius (2.5 tiles); Meteor damage
raw-vs-armor; Neon Dragon "Plushies on tower-death" (needs a tower-death mechanic).

📋 **Full milestone tracker + append-only decision log live in `docs/PROGRESS.md`**
(kept out of here so this file stays lean — locked rules only). See SPEC §13 for
the roadmap, `docs/decisions/` for ADRs.

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