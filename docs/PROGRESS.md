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
- [x] **Wave system (ADR-0003 / SPEC §6.3): data-driven waves 1–3.** `src/game/config/waves.ts` (`Wave = SpawnGroup[]`); SpawnSystem generalized to multi-wave/multi-group (`getCurrentWave`/`isWaveComplete`/`isLastWave`/`TOTAL_WAVES`/`reset`); 3s inter-wave auto-advance (phase stays `playing`); §6.5 wave-clear economy (25+5·wave bonus + 5% interest cap 50); **Snail** enemy (180hp/0.5/18g, sprite id 101) + **armor** mechanic in DamageSystem (`dmg·(1−armor)`); last-wave win guard in DeathSystem (no false win after wave 1/2)
- [x] **Tint is FX-only (locked) — enforced.** Factories set `Renderable.tint=0` at spawn → atlas sprites show native SVG colors; non-zero tint reserved for hit-flash/status FX; `cfg.tint` removed; regression guard `tests/unit/game/factory-tint.test.ts`. (Fixed a latent visual bug from the visual-pass slice that no `bun run check` caught.)
- [x] **2nd tower: Stormcloud (chain lightning), §6.1.** 20dmg/2.2/1.0s/100g; `Projectile.special` bitflags (`Slow`/`Chain`), TowerAI builds special from config; chain resolves in DamageSystem (primary full + 2 nearest @50% within radius, zero-alloc top-2 scan) — NO new §4.2 slot; `tower-stormcloud-l1` sprite (id 2); TowerPicker generalized to a card-per-`PLACEABLE_TOWERS` (Blossom 50g + Stormcloud 100g). First real strategic tower choice (slow-single-target vs chain-AoE).
- [x] **Start screen + difficulty select (the game's front door).** `GamePhase`/`gameStatus` gains `'menu'` (boots frozen, board visible); start-screen overlay (title + Casual/Normal/Hardcore radiogroup + Play); §6.5 difficulty applied — `config/difficulty.ts` sets starting gold/lives + enemy HP/speed multipliers (cached mods, zero-alloc), `startGame(difficulty)`/restart consumed in InputSystem (no new §4.2 slot); `main.tsx` de-hardcoded (auto-placed Blossom + auto-start removed).
- [ ] Towers 3–6 (Sugar Cannon, Luna, Hive, Bubbler) + L2/L3 upgrades — same pipeline
- [ ] Chain radius for Stormcloud is NOT-LOCKED (`CHAIN_RADIUS_TILES=2.5`, §6.1 gives no arc range) — needs a SPEC number
- [ ] Waves 4–20 + bosses (Candy King 5/10/15, Neon Dragon 20) — same schema, future content
- [ ] **Enemy-palette tokens (design-dev rec → small ADR):** enemy colors are a mix of borrowed tower tokens (`--storm-*`) + un-tokenized grub literals; formalize an `--enemy-*` token set (SPEC §2.3 change)
- [ ] DoT/stun hooks (Status fields unused); retire the engine `Sprite` back-compat alias once >1 tower/enemy type; ui wave-counter polish ("X/N" + inter-wave countdown)

**Gate (last):** `bun run check` green (Biome 75 · tsc strict · Vitest 130/130 · build) + 5× `--sequence.shuffle` clean. Bundle ≈235KB gz (app 70 + pixi 160 + react 4; budget <400KB). SVG art ships as separate files (`dist/sprites/`), NOT in the JS bundle. Pipeline: 9/10 systems real (only Animation, slot 8, is a stub). Content: start screen + 3 difficulties, 2 towers (Blossom, Stormcloud), 2 enemies (Grub, Snail), 3 waves.

---

## 📝 Decision Log

(Append-only. Newest first.)

- **2026-06-08** — Start screen + difficulty select landed (gameplay+ui+qa) — the game's front door. `GamePhase`/`gameStatus` gains `'menu'` (boots frozen via the existing `isSimPaused` guards, board visible); start-screen overlay (title + Casual/Normal/Hardcore radiogroup + Play); `config/difficulty.ts` (§6.5) sets starting gold/lives + enemy HP/speed multipliers (cached mods, zero-alloc — applied in spawnEnemy Health + PathFollow speed) — **finally wires the §6.5 multipliers that had been specced-but-unused since the economy slice**; `startGame(difficulty)`/restart consumed in InputSystem (NO new §4.2 slot); restart keeps the active difficulty. `main.tsx` de-hardcoded — the stale auto-placed Blossom + auto-start removed (players now build their own from the menu). Single `Difficulty` source (config) after a ui reconcile (interim type/table dropped, same pattern as PLACEABLE_TOWERS). `bun run check` green (Biome 75 · tsc · Vitest 130/130 · build), ~235KB gz, 5× shuffle clean.
- **2026-06-08** — 2nd tower **Stormcloud (chain lightning)** landed (design-dev+gameplay+ui+qa, §6.1). `Projectile.special` generalized to bitflags (`Slow=1<<0`/`Chain=1<<1`); TowerAI builds the special from tower config (no longer hardcoded); chain resolves in DamageSystem (primary full + up-to-2 nearest @50% within `CHAIN_RADIUS`, zero-alloc top-2 scan) — NO new §4.2 slot. `tower-stormcloud-l1` sprite (id 2). TowerPicker generalized to a card per `PLACEABLE_TOWERS` (single source of truth in `towers.ts`; ui maps it). `bun run check` green (Biome 69 · tsc · Vitest 112/112 · build), ~234KB gz, 5× shuffle clean. **First strategic tower choice.** Tracked: chain radius (2.5 tiles) NOT-LOCKED — §6.1 gives no arc range, needs a SPEC number; factory-tint guard covers Stormcloud structurally (tint=0 unconditional) but doesn't assert it explicitly.
- **2026-06-07** — M1 wave system landed (gameplay+design-dev+qa, ADR-0003): data-driven waves 1–3 (`waves.ts`), multi-wave SpawnSystem, 3s inter-wave auto-advance + §6.5 wave-clear economy, **Snail** enemy (id 101 sprite by design-dev) + **armor** mechanic, last-wave win guard (no false win after wave 1/2 — caught by test). NO new §4.2 slot. **qa caught a latent visual bug** (flagged via the FX-only-tint seam): factories wrote non-zero design-token colors as base `Renderable.tint`, which RenderSystem multiplied → all atlas sprites mis-colored (Snail blue×purple the giveaway); a bug that had passed every `bun run check` since the visual pass (no test guarded it). Fixed: factories set `tint=0` (native), `cfg.tint` removed, FX-only convention documented + a regression guard test added. `bun run check` green (Biome 68 · tsc · Vitest 94/94 · build), ~233.5KB gz, 5× shuffle clean. **Tracked:** waves 4–20 + bosses; difficulty multipliers; enemy-palette token ADR (design-dev rec).
- **2026-06-07** — **ADR-0003 ACCEPTED: wave system schema + waves 1–3** (fills the SPEC §6.3 gap). Waves are data (`src/game/config/waves.ts`): `Wave = ordered SpawnGroup[]` where each group is `{enemy, count, intervalS, startDelayS}`. Inter-wave auto-advance after 3s; win = last defined wave cleared; wave-clear economy (§6.5) wired. Concrete waves 1–3: W1 8 Grubs@1.0s, W2 12 Grubs@0.8s, W3 10 Grubs@0.7s + 3 Snails trailing. SPEC §6.3 updated with schema + table. Build next (gameplay SpawnSystem generalization + waves.ts + wave-clear economy; ui wave counter).
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
