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

## 🎯 Current Status

**M1 — Core Loop** complete + playable end-to-end: **start screen** → pick
difficulty (Casual/Normal/Hardcore, §6.5 — scales economy + enemy HP/speed) →
place towers (**Blossom** slow 50g / **Stormcloud** chain-lightning 100g) → fight
**waves 1–3** (Grubs → armored Snail) → win/lose → replay. Data-driven waves
(ADR-0003), wave-clear economy, armor, native-color sprite art. `bun run check`
green (Vitest 130/130), ~235KB gz. Pipeline 9/10 systems real (only Animation,
slot 8, is a stub). Content: start screen + 3 difficulties, 2 towers, 2 enemies, 3 waves.

Active skills (§6.4): **Meteor** live (tap-to-aim 200 AoE); Freeze/Gold Rush built
but locked until waves 5/10. `bun run check` green (Vitest 156/156), ~236.5KB gz.

**Next up:** towers 3–6 + L2/L3 upgrades (same pipeline) · waves 4–20 + bosses
(unlocks Freeze/Gold Rush) · enemy-palette token ADR · skill/death VFX (juice) ·
tiles board layer. **SPEC clarifications flagged:** Stormcloud chain radius (2.5
tiles); Meteor damage raw-vs-armor (§6.4 "200 DMG", applied armor-adjusted).

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