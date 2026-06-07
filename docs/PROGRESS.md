# Bloom Bastion — Progress & Decision Log

> Milestone tracker + append-only decision log. CLAUDE.md keeps only the locked
> rules + a one-line status snapshot and points here. See SPEC §13 for the full
> roadmap, `docs/decisions/` for ADRs.

---

## 🎯 Milestones

**Current: M1 — Core Loop** (essentially complete; remaining = real wave system).
The game is fully playable + replayable: place towers → fight waves → win/lose → replay.

### M0 — Foundation (done)
- [x] Scaffold with Bun + Vite 6 + TS strict + Pixi v8 + React 19 + Biome
- [x] Integrate design tokens (from `design-assets/export/`, see ADR-0002)
- [x] Pixi app boots, renders dark battlefield + design-token grid
- [x] Vitest wired; Playwright dep installed
- [x] Smoke test: 1 tower + 1 enemy walking the flow-field path, rendered (delivered in M1)
- [ ] Playwright e2e config + first happy-path test
- [ ] Deploy preview to Vercel

### M1 — Core Loop (in progress)
- [x] bitECS world + all §4.2 components; RAF loop (dt-clamp 50ms, Page Visibility pause); locked §4.2 10-system pipeline via `startLoop(GAME_SYSTEMS)` seam
- [x] Flow-field pathfinding (Dijkstra cost-spread, 8-neighbour, NOT A*); recompute on map load + tower placement
- [x] RenderSystem (slot 9) — per-eid Pixi **Sprite from the real SVG atlas** (`getSpriteTexture(spriteId)`), zero per-frame alloc, anchors (towers 0.5/1.0 grounded · enemies/projectiles 0.5/0.5), tint FX-only (hit-flash)
- [x] Object pools (§4.4): particle 500 / projectile 100 / enemy 200 / floating-text 50
- [x] SpawnSystem (slot 2) + PathFollowSystem (slot 3); enemy spawns → walks lane → despawns at goal
- [x] Config/factories: Grub enemy + Blossom tower (exact SPEC §6); design-token tints
- [x] Combat: TowerAISystem (4) + ProjectileSystem (5) + DamageSystem (6) + DeathSystem (7) — targets nearest-in-range, fires homing projectiles, damage + 40%/2s slow, kills → gold
- [x] `gameTime()` pause-aware game clock (engine/loop.ts) for Status slow/stun/dot timestamps
- [x] Pool integration: enemy + projectile factories acquire/release from pools (Hit tag component)
- [x] ECS economy: `Resources{gold,lives}` game singleton (ECS-pure), SPEC §6.5 Normal = 150 gold / 20 lives
- [x] Lives accounting: PathFollow goal-leak calls `loseLives(world, 1)` (LIFE_COST_PER_LEAK=1, NOT-LOCKED — SPEC §6 only defines lose-at-0)
- [x] UISyncSystem (slot 10) → ≤10Hz throttled `GameSnapshot` into Zustand store (`src/store/game-snapshot.ts`, snapshot-only mirror)
- [x] HUD overlay (`src/ui/hud/`) — gold/lives/wave strip; DOM-over-canvas, design tokens, safe-area, a11y
- [x] InputSystem (slot 1) — engine pointer/tap primitive (`src/engine/input/`, world px == Position space, lazy-attach) + gameplay placement (tap grass → validate `COST_GRASS` + gold ≥ cost → spend, `placeTower`, `COST_BLOCKED`, rebuild flow field)
- [x] TowerPicker (`src/ui/hud/TowerPicker.tsx`) + build-intent store (`src/store/build.ts`)
- [x] Visual pass (design-dev): runtime SVG atlas (`public/sprites.svg` + `public/sprites/*.svg`, id-banded registry in `config/sprites.ts`); real TowerCard glyph; `--fs-*` type scale (zero raw px font-size in `src/ui`)
- [x] Complete game loop: win/lose/pause/restart — authoritative phase (`src/game/ecs/game-state.ts`); win/lose folded into DeathSystem (§6.6, no new §4.2 slot); sim freezes via `isSimPaused()` guards (slots 1–7; Render/UISync keep running); `restartGame` (`src/game/restart.ts`); victory/defeat overlays + Play Again (`src/store/commands.ts`)
- [ ] Death juice (particle/floating-text pools wired but DeathSystem doesn't spawn them yet)
- [ ] Visual follow-ups (design-dev): tiles **board layer** (grass/path 300/301 assets ready, not drawn); **animated glow** (static SVG only — Pixi tween/Rive later); convert other 5 towers ×3 + 7 enemies (mechanical); formalize an **enemy-palette** token set
- [ ] Real **wave system** (waves 1–3) — blocked on the SPEC §6.3 per-wave count/interval gap (needs an ADR); currently one scaffold wave
- [ ] DoT/stun hooks (Status fields unused); retire the engine `Sprite` back-compat alias once >1 tower/enemy type

**Gate (last):** `bun run check` green (Biome 65 · tsc strict · Vitest 82/82 · build) + 5× `--sequence.shuffle` clean. Bundle ≈233KB gz (app 68 + pixi 160 + react 4; budget <400KB). SVG art ships as separate files (`dist/sprites/`, ~28K), NOT in the JS bundle. Pipeline: 9/10 systems real (only Animation, slot 8, is a stub).

---

## 📝 Decision Log

(Append-only. Newest first.)

- **2026-06-07** — M1 game loop COMPLETE (gameplay+ui+qa): win/lose/pause/restart. Authoritative game phase in `src/game/ecs/game-state.ts` (`'playing'|'won'|'lost'`, game-land); win/lose folded into DeathSystem (§6.6) + restart into InputSystem — NO new §4.2 slot. Sim freezes on end via `isSimPaused()` guards (slots 1–7; Render/UISync keep running). `restartGame` full reset + `SpawnSystemHandle.reset()`. ui: "BLOOM PREVAILS" victory + Play Again, restart command store (`src/store/commands.ts`). `bun run check` green (Biome 65 · tsc · Vitest 82/82 · build), ~233KB gz, 5× shuffle clean. Committed as `feat(m1): complete core tower-defense loop`. Remaining M1: real wave system (waves 1–3, §6.3 gap).
- **2026-06-07** — **LOCKED: top-down projection is canonical** (user decision). Renderer, flow-field, and playable proto are top-down; the design bible's isometric tile art is reference-only. Tiles/board render flat (screen px == world px == Position px). SPEC §10 should be confirmed/updated to state top-down; switching to iso later would require an ADR + a renderer projection change.
- **2026-06-07** — M1 visual pass landed (design-dev+engine+gameplay+ui+qa — first 4-agent slice, design-dev via Agent tool + 3 tmux agents). Procedural JSX sprites → runtime SVG atlas (`public/sprites.svg` + per-sprite SVGs ~13.5KB), id-banded registry, `--fs-*` type scale. engine boot-loads textures (`Assets.load` before `startLoop`), RenderSystem draws real Pixi Sprites (tint FX-only, test-safe null-skip in jsdom). gameplay reconciled factory `Renderable.spriteId` to the registry; ui swapped TowerCard to the real glyph + migrated all HUD raw px → `--fs-*`. Green (Biome 60 · Vitest 67/67), ~232.8KB gz. **Flagged:** tiles authored top-down flat (resolved → top-down locked, above).
- **2026-06-07** — M1 interactive tower placement landed (engine+ui+gameplay+qa, first 3-way concurrent fan-out): engine pointer/tap input primitive (lazy self-attach via `ensureAttached`); ui TowerPicker + build-intent store; gameplay real InputSystem (slot 1) tap-to-place with gold spend + flow-field rebuild. Green (Biome 59 · Vitest 65/65), ~219.5KB gz; 5× shuffle clean. Verified gameplay's "main.tsx needs initInput" flag was a FALSE alarm — lazy-attach covers it.
- **2026-06-07** — M1 lives+UISync+HUD slice landed (ui+gameplay+qa): game→React bridge. UISyncSystem (slot 10) pushes ≤10Hz `GameSnapshot` into a new Zustand store (snapshot-only mirror — game state authoritative in ECS); first real HUD + "BASTION FELL" defeat. PathFollow goal-leak calls `loseLives()`. Green (Biome 51 · Vitest 45/45), ~218KB gz; 5× shuffle clean. First **ui** agent slice. Surfaced the font-size design-token gap (later closed).
- **2026-06-07** — M1 combat slice landed (engine+gameplay+qa): TowerAI→Projectile→Damage→Death (§4.2 slots 4-7); `gameTime()` clock; pool-integrated factories (Hit tag); `Resources{gold,lives}` §6.5 Normal (150/20). Green (Biome 44 · Vitest 33/33), ~217KB gz. **qa caught a real order-dependent bug** — towers leaked into the shared world singleton across tests (no `releaseTower`/reset drain); fixed + verified by 5× shuffle.
- **2026-06-07** — M1 vertical slice landed (engine+gameplay+qa): ECS world + RAF loop + locked §4.2 pipeline, flow-field (Dijkstra, not A*), RenderSystem, object pools, Spawn + PathFollow, Grub/Blossom config — grub walks the lane, Blossom rendered. Green (Biome 33 · Vitest 25/25), ~204KB gz. Surfaced the SPEC §6.3 per-wave gap.
- **2026-06-05** — M0 scaffold landed: Bun+Vite6+React19+Pixi v8 boots grid canvas; green (~198KB gz JS).
- **2026-06-05** — ADR-0002: adopted designer's exported tokens + type (Baloo 2/Nunito) as visual source of truth; SPEC §2.3/§2.4 updated. Audio/biomes/i18n/difficulty-naming flagged as open decisions.
- **2026-06-05** — Added tmux multi-agent orchestration (`scripts/`, `~/.claude/profiles/bloom-*.md`).
- **2026-06-05** — Added 6 project subagents in `.claude/agents/` (engine-dev, gameplay-dev, ui-dev, perf-guardian, test-engineer, spec-reviewer).
- **2026-06-05** — Stack modernized: Bun (runtime/PM) + Vite 6 + React 19 + Biome; Bun runs Vite, not replaces it.
- **2026-06-05** — Design phase complete, assets in `design-assets/`.
- **2026-06-05** — Locked tech stack (Vite/Pixi/bitECS/Rive/React-UI-only).
- **2026-06-05** — SPEC.md committed as source of truth.
