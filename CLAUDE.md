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

**M1 — Core Loop** (in progress) · M0 Foundation complete

M0 — Foundation (done):
- [x] Scaffold with Bun + Vite 6 + TS strict + Pixi v8 + React 19 + Biome
- [x] Integrate design tokens (from `design-assets/export/`, see ADR-0002)
- [x] Pixi app boots, renders dark battlefield + design-token grid
- [x] Vitest wired; Playwright dep installed
- [x] Smoke test: 1 tower + 1 enemy walking the flow-field path, rendered (M0→M1 boundary — delivered in the M1 slice below)
- [ ] Playwright e2e config + first happy-path test
- [ ] Deploy preview to Vercel

M1 — Core Loop (in progress):
- [x] bitECS world + all §4.2 components; RAF loop (dt-clamp 50ms, Page Visibility pause); locked §4.2 10-system pipeline via `startLoop(GAME_SYSTEMS)` seam
- [x] Flow-field pathfinding (Dijkstra cost-spread, 8-neighbour, NOT A*); recompute on map load + tower placement
- [x] RenderSystem (slot 9) — per-eid Pixi **Sprite from the real SVG atlas** (`getSpriteTexture(spriteId)`), zero per-frame alloc, anchors (towers 0.5/1.0 grounded · enemies/projectiles 0.5/0.5), tint FX-only (hit-flash)
- [x] Object pools (§4.4): particle 500 / projectile 100 / enemy 200 / floating-text 50 (infra only — not yet wired into factories)
- [x] SpawnSystem (slot 2) + PathFollowSystem (slot 3); enemy spawns → walks lane → despawns at goal
- [x] Config/factories: Grub enemy + Blossom tower (exact SPEC §6); design-token tints
- [x] Combat: TowerAISystem (slot 4) + ProjectileSystem (5) + DamageSystem (6) + DeathSystem (7) — tower targets nearest-in-range, fires homing projectiles, applies damage + 40%/2s slow, kills → gold reward
- [x] `gameTime()` pause-aware game clock (engine/loop.ts) for Status slow/stun/dot timestamps
- [x] Pool integration: enemy + projectile factories acquire/release from pools (Hit tag component for damage)
- [x] ECS economy: `Resources{gold,lives}` game singleton (ECS-pure), seeded SPEC §6.5 Normal = 150 gold / 20 lives
- [x] Lives accounting: PathFollow goal-leak calls `loseLives(world, 1)` before release (LIFE_COST_PER_LEAK=1, NOT-LOCKED — SPEC §6 only defines lose-at-0); `gameStatus` derives `'lost'` at lives ≤ 0
- [x] UISyncSystem (slot 10) → ≤10Hz throttled `GameSnapshot` push into Zustand store (`src/store/game-snapshot.ts`, snapshot-only mirror, zero alloc on non-push frames)
- [x] HUD overlay (`src/ui/hud/`) — gold/lives/wave status strip + "BASTION FELL" defeat state; DOM-over-canvas, design-token colors, safe-area insets, a11y (ARIA/role=alertdialog)
- [x] InputSystem (slot 1) — engine pointer/tap primitive (`src/engine/input/`, world px == Position space, lazy-attach) + gameplay placement: tap a grass cell → validate (`COST_GRASS` + gold ≥ cost) → spend gold, `placeTower`, `COST_BLOCKED`, rebuild flow field. Only Animation (slot 8) remains an engine stub now.
- [x] TowerPicker (`src/ui/hud/TowerPicker.tsx`) + build-intent store (`src/store/build.ts`, transient selection only) — Blossom card, disabled <50g, pointer-events discipline so canvas taps pass through
- [x] Visual pass (design-dev): runtime SVG atlas (`public/sprites.svg` + `public/sprites/*.svg`, id-banded registry in `config/sprites.ts`) — Blossom tower / Grub / petal projectile render as real art; real TowerCard glyph; `--fs-*` type scale in both token files, HUD/picker fully migrated (zero raw px font-size in `src/ui`)
- [x] **Complete game loop: win/lose/pause/restart.** Authoritative game phase (`src/game/ecs/game-state.ts`, `'playing'|'won'|'lost'`, game-land not React); win/lose folded into DeathSystem (§6.6, no new §4.2 slot); sim freezes on end via `isSimPaused()` guards on slots 1–7 (Render/UISync keep running → frozen frame + overlay); `restartGame` (`src/game/restart.ts`) full reset + `SpawnSystem.reset()`; "BLOOM PREVAILS" victory + "BASTION FELL" defeat overlays with Play Again (`src/store/commands.ts` restart command, consumed in InputSystem before the pause guard)
- [ ] Death juice (particle/floating-text pools wired but DeathSystem doesn't spawn them yet)
- [ ] Visual follow-ups (design-dev): tiles **board layer** (grass/path 300/301 assets ready, not drawn yet); **animated glow** (static SVG glow only — Pixi tween/Rive later); convert the other 5 towers ×3 + 7 enemies (pipeline is mechanical); formalize an **enemy-palette** token set (grub greens/browns aren't named tokens yet)
- [ ] More content: 2nd+ tower/enemy, wave system (§6.3 count/interval gap), DoT/stun hooks (Status fields unused); retire the engine `Sprite` back-compat alias once >1 tower/enemy type

Gate status: `bun run check` green (Biome 65 files · tsc strict · Vitest 82/82 · build) + test-isolation verified (5× `--sequence.shuffle`, incl. the phase + restart-command singletons). Bundle ≈233KB gz JS total (app 68KB + pixi 160KB + react 4KB; budget <400KB). SVG art ships as separate files (`dist/sprites/`, ~28K), NOT in the JS bundle.

**M1 core loop is essentially complete** — fully playable: place towers → fight waves → win/lose → replay. Remaining M1 (SPEC §13): real **wave system** (waves 1–3; needs the §6.3 count/interval gap filled, likely an ADR) — currently one scaffold wave. Only Animation (slot 8) remains an engine stub.

See SPEC §13 for full roadmap.

## 📝 Recent Decisions

(Append-only log. Newest first.)

- **2026-06-07** — M1 game loop COMPLETE (gameplay+ui+qa): win/lose/pause/restart. Authoritative game phase in `src/game/ecs/game-state.ts` (`'playing'|'won'|'lost'`, game-land); win/lose folded into DeathSystem (§6.6) + restart into InputSystem — NO new §4.2 slot. Sim freezes on end via `isSimPaused()` guards (slots 1–7; Render/UISync keep running). `restartGame` full reset + `SpawnSystemHandle.reset()`. ui: "BLOOM PREVAILS" victory overlay + Play Again on both end screens, restart command store (`src/store/commands.ts`). `bun run check` green (Biome 65 · tsc · Vitest 82/82 · build), ~233KB gz, 5× shuffle clean. **The game is now fully playable + replayable.** Remaining M1: real wave system (waves 1–3, §6.3 gap).
- **2026-06-07** — **LOCKED: top-down projection is canonical** (user decision). The renderer, flow-field, and playable proto are top-down; the design bible's isometric tile art is reference-only. Tiles/board render flat (screen px == world px == Position space). SPEC §10 should be confirmed/updated to state top-down; switching to iso later would require an ADR + a renderer projection change. Resolves the design-dev visual-pass flag.
- **2026-06-07** — M1 visual pass landed (design-dev+engine+gameplay+ui+qa — first 4-agent slice, design-dev via Agent tool + 3 tmux agents). design-dev converted the procedural JSX sprites → runtime SVG atlas (`public/sprites.svg` symbol sheet for DOM `<use>` + per-sprite `public/sprites/*.svg` for Pixi; ~13.5KB), id-banded registry in `config/sprites.ts` (towers 1–99/enemies 100–199/projectiles 200–299/tiles 300–399), + a `--fs-*` type scale in both token files. engine boot-loads textures (`Assets.load` before `startLoop`) and RenderSystem now draws real Pixi Sprites (tint FX-only, grounded/centered anchors, test-safe null-skip in jsdom). gameplay reconciled factory `Renderable.spriteId` to the registry; ui swapped TowerCard to the real glyph + migrated all HUD raw px → `--fs-*` (zero raw px font-size left in `src/ui`). `bun run check` green (Biome 60 · tsc · Vitest 67/67 · build), ~232.8KB gz (SVG art ships as separate files, NOT bundled). 5× shuffle clean. The game now renders "cute but deadly" art instead of debug circles. **Decision flagged:** tiles authored top-down flat (matches current renderer/proto), NOT the iso art in the design bible — if SPEC §10 wants iso, needs an ADR + renderer projection change. **Tracked:** tiles board layer, animated glow, remaining sprite conversion, enemy-palette tokens, retire `Sprite` back-compat alias.
- **2026-06-07** — M1 interactive tower placement landed (engine+ui+gameplay+qa, first 3-way concurrent fan-out): engine pointer/tap input primitive (`src/engine/input/`, world px == Position space, lazy self-attach via `ensureAttached`); ui TowerPicker bar + transient build-intent store (`src/store/build.ts`); gameplay real InputSystem (slot 1) — tap a grass cell → validate (`COST_GRASS` + gold ≥ cost) → spend gold + `placeTower` + `COST_BLOCKED` + rebuild flow field + `clearBuild`. Only slot 8 (Animation) is still an engine stub. `bun run check` green (Biome 59 · tsc · Vitest 65/65 · build), ~219.5KB gz; 5× shuffle clean (two new module singletons reset via `teardownInput`/`clearBuild`). Verified gameplay's "main.tsx needs initInput" flag was a FALSE alarm — lazy-attach covers it (boot awaited before loop). **Tracked:** design-asset gaps (no `sprites.svg` atlas → primitive Graphics render; no font-size tokens) point to engaging the unused **design-dev** agent; `'won'`/game-over flow + content/wave expansion still open.
- **2026-06-07** — M1 lives+UISync+HUD slice landed (ui+gameplay+qa, orchestrated): game→React bridge complete. UISyncSystem (slot 10) pushes a ≤10Hz `GameSnapshot{gold,lives,wave,enemiesAlive,gameStatus}` into a new Zustand store (`src/store/game-snapshot.ts`, snapshot-only mirror — game state stays authoritative in ECS); first real HUD (`src/ui/hud/`) renders gold/lives/wave + "BASTION FELL" defeat state, DOM-over-canvas, design tokens, a11y. PathFollow goal-leak now calls `loseLives()` (1/leak, NOT-LOCKED). `bun run check` green (Biome 51 · tsc · Vitest 45/45 · build), ~218KB gz; 5× shuffle clean (new store singleton, no leakage — tests reset in `beforeEach`). First **ui** agent slice. **Open/tracked:** TowerPicker + InputSystem (slot 1 still stub) for interactive placement is next; `'won'`/game-over-restart flow deferred; death juice deferred; **font-size design-token gap** (`tokens.css` has no fs tokens — HUD uses raw px; no-hardcoded-*color* rule still satisfied).
- **2026-06-07** — M1 combat slice landed (engine+gameplay+qa, orchestrated): TowerAI→Projectile→Damage→Death wired into §4.2 slots 4-7; Blossom tower auto-fires homing projectiles at grubs, applies 40%/2s slow + damage, kills award gold; `gameTime()` pause-aware clock added for Status timestamps; enemy/projectile factories pool-integrated (Hit tag component); ECS-pure `Resources{gold,lives}` singleton seeded §6.5 Normal (150/20). `bun run check` green (Biome 44 · tsc · Vitest 33/33 · build), ~217KB gz. **qa caught a real order-dependent bug** — towers leaked into the shared world singleton across tests (`resetGameWorld` didn't drain towers, `placeTower` had no teardown); fixed with `releaseTower` + reset drain, verified by 5× `--sequence.shuffle`. **Open/tracked:** lives accounting (goal-reach doesn't `loseLives()` yet); §6.3 per-wave count/interval gap (scaffold wave still); DoT/stun hooks unused; death juice (particles/floating-text) deferred; UISync slot 10 + HUD is the next obvious slice.
- **2026-06-07** — M1 vertical slice landed (engine+gameplay+qa, orchestrated): ECS world + RAF loop + locked §4.2 pipeline, flow-field pathfinding (Dijkstra, not A*), RenderSystem, object pools (§4.4 infra), Spawn + PathFollow systems, Grub/Blossom config — a grub now spawns, walks the flow-field lane, despawns at goal; Blossom tower rendered. `bun run check` green (Biome 33 · tsc · Vitest 25/25 · build), ~204KB gz. **Open/tracked:** SPEC §6.3 lacks per-wave spawn counts/intervals (scaffold numbers used — fill before wave system); lives accounting deferred to Death/UISync slice; TowerAI/Projectile/Damage/Death still stubs (next slice); pools not yet wired into factories.
- **2026-06-05** — M0 scaffold landed: Bun+Vite6+React19+Pixi v8 boots grid canvas; `bun run check` green (~198KB gz JS)
- **2026-06-05** — ADR-0002: adopted designer's exported tokens + type (Baloo 2/Nunito) as visual source of truth; SPEC §2.3/§2.4 updated. Audio/biomes/i18n/difficulty-naming scope flagged as open decisions.
- **2026-06-05** — Added tmux multi-agent orchestration (`scripts/`, `~/.claude/profiles/bloom-*.md`)
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