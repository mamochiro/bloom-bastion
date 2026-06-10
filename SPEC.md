# 🌸 Bloom Bastion — Full Specification

> **Single source of truth for the project.**
> Every agent (engine / gameplay / ui / test / design) reads this before acting.
> Last updated: 2026-06-05 (stack modernized: Bun + Vite 6 + React 19 + Biome)

---

## 📑 Table of Contents

1. [Vision & Goals](#1-vision--goals)
2. [Visual Direction](#2-visual-direction)
3. [Tech Stack (Locked)](#3-tech-stack-locked)
4. [Architecture](#4-architecture)
5. [Performance Budget](#5-performance-budget)
6. [Game Design](#6-game-design)
7. [Mobile & Touch Requirements](#7-mobile--touch-requirements)
8. [UI/UX Requirements](#8-uiux-requirements)
9. [Audio Design](#9-audio-design)
10. [Project Structure](#10-project-structure)
11. [Build & Deploy](#11-build--deploy)
12. [Testing Strategy](#12-testing-strategy)
13. [Roadmap & Milestones](#13-roadmap--milestones)
14. [Acceptance Criteria](#14-acceptance-criteria)
15. [Out of Scope (v1)](#15-out-of-scope-v1)
16. [Glossary](#16-glossary)

---

## 1. Vision & Goals

### 1.1 Elevator Pitch
**Bloom Bastion** is a mobile-first tower defense game where pastel-colored, kawaii-styled defenders protect a castle from cute-but-deadly creatures on a dark, neon-lit battlefield. Strategic depth meets juicy visual feedback. "Cute but challenging" — the difficulty curve respects experienced strategy players while staying approachable.

### 1.2 Target Audience
- Casual strategy gamers (Plants vs. Zombies, Kingdom Rush fans)
- Mobile players who want a polished experience in their browser
- Players bored of generic Match-3 / hyper-casual

### 1.3 Core Pillars
| Pillar | Meaning |
|--------|---------|
| **Visual Juice** | Every interaction satisfies (squash, shake, bloom, particles) |
| **Strategic Depth** | Tower synergies, active skills, economy decisions matter |
| **Mobile-First** | Built for touch, scales up to desktop |
| **Performance** | 60fps on 3-year-old phones, no compromises |
| **Polish** | AAA feel on a solo-dev budget |

### 1.4 Non-Goals
- ❌ Realistic graphics
- ❌ Multiplayer / online features (v1)
- ❌ Monetization mechanics
- ❌ Tutorial-heavy onboarding (smart defaults instead)

---

## 2. Visual Direction

### 2.1 Style
**Stylized 2.5D Vector + Neon Glow**

Reference vibe: *Monument Valley* × *Hades* × *Alto's Odyssey*

### 2.2 Design Principles
- **Dark backdrop, neon foreground** — high contrast = readable + premium
- **Flat vector shapes, no outlines** — bold silhouettes
- **Glow as hierarchy** — important things glow more
- **Squash & stretch** — every action has secondary motion
- **Juice over realism** — exaggerate for feel

### 2.3 Color System

> **Canonical source:** `design-assets/export/design-tokens.css`, mirrored to `src/ui/styles/tokens.css`. Use the CSS vars — never hardcode hex. (See ADR-0002.) Each tower family is a **3-stop ramp** (`light` / `mid` / `dark`); pick intentionally (mid = body, light = highlight/glow, dark = shadow/trim).

```css
/* Backgrounds (deep navy/violet battlefield) */
--bg-abyss: #0e0820;  --bg-deep: #1a0f2e;  --bg-stage: #241544;
--bg-panel: #2d1b4e;  --bg-elevated: #3a2563;  --bg-line: #4a2f7a;

/* Tower families (light / mid / dark) — each glows */
--blossom-{light:#ffd6e8, mid:#ff6fa5, dark:#c43d77}   /* cherry pink   */
--storm-{light:#d2ecff,   mid:#5db8ff, dark:#2a6fae}   /* sky blue      */
--sugar-{light:#ffd9d2,   mid:#ff7a6b, dark:#d6463a}   /* candy coral   */
--luna-{light:#e6dcff,    mid:#b388ff, dark:#7a4fd6}   /* lavender      */
--hive-{light:#ffe9b0,    mid:#ffb74d, dark:#e07b1f}   /* honey amber   */
--bubble-{light:#c6fff0,  mid:#4fe0c4, dark:#1f9e85}   /* mint aqua     */

/* HUD accents + HP ramp + enemy corruption */
--gold:#ffd700; --danger:#ff4d6d; --success:#44e08a; --xp-blue:#5db8ff;
--hp-high:#44e08a; --hp-mid:#ffd34d; --hp-low:#ff4d6d;
--shade-core:#8c4dff; --shade-glow:#c77dff;

/* Text */
--text-bright:#fff6ff; --text-soft:#cabbe6; --text-dim:#8c7bb0; --text-faint:#5d4d80;
```

Also defined in the canonical file: radii (`--r-sm…--r-pill`), 8pt spacing (`--s1…--s8`), shadows (`--shadow-panel/card`), and `--touch: 56px`. Animation keyframes (22) live in `design-assets/export/keyframes.css` → `src/ui/styles/keyframes.css`.

### 2.4 Typography
> Canonical: `design-tokens.css` (`--font-display`, `--font-body`, `--font-num`). Loaded via Google Fonts (Baloo 2 + Nunito).
- **Display & Numbers:** Baloo 2 (rounded, friendly, characterful) → `--font-display`, `--font-num`
- **Body:** Nunito (clean, readable, great at small sizes) → `--font-body`
- Fallback chain: `system-ui, sans-serif`

### 2.5 Animation Principles
- Idle: subtle bob (2-3px, 1.5s loop) on every tower
- Hit feedback: white flash 80ms + scale 1.1 → 1.0
- Death: particle burst (8-12 pieces) + slow-mo 200ms
- Tower place: scale-in 300ms with bounce ease
- Upgrade: radial bloom expand + ring shockwave
- Boss intro: screen freeze 300ms + vignette + dramatic zoom

### 2.6 Visual Tension (the "deadly" in cute-but-deadly)
- Wave 1-5: light particles, chiptune music
- Wave 6-10: screen rumble, denser particles
- Wave 11-15: subtle chromatic aberration, red vignette pulse
- Wave 16-20: full intensity, orchestral music
- Boss waves: background tint shift (purple → red)

---

## 3. Tech Stack (Locked)

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime + PM | **Bun 1.2+** | Fast installs (10–25× npm), native TS, runs all scripts/tooling |
| Bundler + Dev Server | **Vite 6** (runs on Bun) | Best-in-class HMR + plugin ecosystem (PWA, `.riv`/`.webm` assets, manual chunks). Bun is the runtime *under* Vite |
| Language | **TypeScript 5.7+** (strict) | Type safety for complex game logic |
| Renderer | **PixiJS v8** (latest) | WebGPU-first init, best 2D perf on web |
| Entity System | **bitECS** (latest) | Data-oriented, 5-10x faster than class ECS |
| Animation | **Rive (@rive-app/canvas)** (latest) | Vector, state machine, free |
| UI Tween | **GSAP** (latest) | Industry standard, smoothest easing |
| Audio | **Howler.js** (latest) | Cross-browser, mobile-safe |
| UI Overlay | **React 19** | Only for HUD/menus, NEVER inside canvas |
| UI State | **Zustand** (latest) | Lightweight, no boilerplate |
| Lint + Format | **Biome** | Rust-based, single fast tool (replaces ESLint+Prettier) |
| Type-check | **tsc --noEmit** | Strict type gate, separate from Biome |
| Testing | **Vitest** (unit) + **Playwright** (E2E) | Vitest shares Vite transform + best jsdom/canvas-mock story; runs on Bun |
| Deploy | **Vercel / Cloudflare Pages** | Free, fast, edge CDN |

> **Why Bun *and* Vite (not Bun-only):** Bun and Vite are different categories — Bun is a *runtime + package manager*, Vite is a *dev server + bundler that runs on a runtime*. For a PixiJS+React+Rive web game, Vite's HMR, asset plugins, and Rollup manual-chunking (needed for the <400KB budget) are more mature than Bun's frontend bundler. So Bun owns install/runtime/scripts (where it's strictly faster) and Vite owns bundling/dev-server (where it's strictly better). Vite runs on top of Bun.

**Bundle target:** < 400KB JS gzipped, < 800KB total with assets.

### 3.1 Versions
```json
{
  "pixi.js": "^8.7.0",
  "bitecs": "^0.3.40",
  "@rive-app/canvas": "^2.27.0",
  "gsap": "^3.13.0",
  "howler": "^2.2.4",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "zustand": "^5.0.0",
  "vite": "^6.0.0",
  "typescript": "^5.7.0",
  "@biomejs/biome": "^1.9.0",
  "vitest": "^2.1.0",
  "@playwright/test": "^1.49.0"
}
```

> Runtime/PM is **Bun** (`bun install`, `bun run …`) — no `bun` entry in `dependencies`; it's the toolchain itself. Pin via `.bun-version` / CI. Use `bun.lockb` (binary lockfile), not `package-lock.json`.

### 3.2 Forbidden
- ❌ Next.js (SSR irrelevant, bundle bloat)
- ❌ Phaser (slower than Pixi)
- ❌ Three.js (overkill for 2.5D)
- ❌ Redux / MobX (Zustand is enough)
- ❌ CSS-in-JS runtime (use CSS modules / vars)
- ❌ Direct DOM manipulation inside canvas
- ❌ npm / yarn / pnpm for installs (use Bun; keep a single `bun.lockb`)
- ❌ Dropping Vite for Bun's native bundler (loses HMR/plugin/chunking maturity this game needs)
- ❌ ESLint + Prettier (Biome replaces both)

---

## 4. Architecture

### 4.1 High-Level

```
┌─────────────────────────────────────────────┐
│  React UI Layer (DOM)                       │
│  HUD, menus, modals, settings               │
│  ↕ Zustand (UI state only)                  │
├─────────────────────────────────────────────┤
│  Bridge: UISyncSystem (10Hz throttle)       │
├─────────────────────────────────────────────┤
│  Game Engine (Canvas via Pixi)              │
│  ECS World • Systems • Renderer • Audio     │
│  ↕ EventEmitter (game state)                │
└─────────────────────────────────────────────┘
```

**Rule:** Game state lives in ECS components. React reads minimal snapshot via Zustand, updated max 10Hz.

### 4.2 ECS Engine

#### Components (data only, TypedArray-backed)
- `Position { x, y }`
- `Velocity { vx, vy }`
- `Health { current, max }`
- `Renderable { spriteId, tint }`
- `Tower { typeId, level, cooldown, lastTarget }`
- `Enemy { typeId, pathProgress, flags }`
- `Projectile { damage, targetId, special }`
- `Pathfinder { followFlowField: 0|1 }`
- `Animation { riveId, state }`
- `Status { slowedUntil, stunnedUntil, dotUntil }`

#### Systems (run order matters)
1. **InputSystem** — pointer/touch events → entity changes
2. **SpawnSystem** — wave timing, enemy creation
3. **PathFollowSystem** — entities follow flow field
4. **TowerAISystem** — target selection, cooldown
5. **ProjectileSystem** — movement, collision
6. **DamageSystem** — apply damage, status effects
7. **DeathSystem** — rewards, particles, cleanup
8. **AnimationSystem** — sync Rive state to component
9. **RenderSystem** — Pixi draw (batched)
10. **UISyncSystem** — push throttled snapshot to Zustand

### 4.3 Pathfinding
**Flow Field (Dijkstra-based), NOT A*.**

- Compute once on map load + when tower placed
- Stored as `Float32Array(width × height × 2)` = `(dx, dy)` per cell
- Every enemy reads from same field → zero per-entity computation
- Cost field includes: path tiles weight 1, grass weight 999, towers weight ∞

### 4.4 Object Pooling
**All hot-path entities must be pooled. Zero allocations in game loop.**

```
ParticlePool        → pre-alloc 500
ProjectilePool      → pre-alloc 100
FloatingTextPool    → pre-alloc 50
EnemyPool           → pre-alloc 200 (per type)
TowerPool           → no pool needed (low count, lifecycle managed)
```

### 4.5 Adaptive Quality
Monitor average FPS (rolling 1s window):

| Avg FPS | Action |
|---------|--------|
| ≥ 55 | All effects on |
| 45-54 | Reduce particle count 50% |
| 35-44 | Disable bloom shader, halve particles |
| < 35 | Minimum mode: no bloom, no chromatic, 25% particles |

User can also force quality via Settings: Auto / Low / High.

### 4.6 Time & Updates
- `requestAnimationFrame` with delta-time clamping (max 50ms per frame)
- Page Visibility API → pause when tab hidden
- Optional 2× speed mode (game logic dt × 2, rendering unchanged)

---

## 5. Performance Budget

### 5.1 Targets
| Metric | Target | Hard Limit |
|--------|--------|------------|
| FPS (mobile, iPhone 11) | 60fps | ≥ 50fps |
| FPS (desktop) | 144fps | ≥ 60fps |
| First Contentful Paint (4G) | < 1.2s | < 2.0s |
| Time to Interactive | < 2.0s | < 3.0s |
| Bundle JS (gzipped) | < 400KB | < 500KB |
| Memory (mobile) | < 150MB | < 250MB |
| Entities at 60fps | 200+ | 150+ |

### 5.2 Verification
- Pixi stats overlay in dev mode
- Lighthouse mobile run before each PR (score ≥ 90)
- Memory snapshot every 10 waves (must not leak)
- Run profiler on iPhone 11 / Pixel 5 actual devices

---

## 6. Game Design

### 6.1 Towers (6 base × 3 upgrade levels = 18 configs)

#### 🌸 Blossom — Slow Damage Dealer
- **Base:** 15 DMG, 2.5 range, 1.2s fire rate
- **Cost:** 50 gold
- **Special:** Applies "slow" (40% speed reduction, 2s)
- **L2 — Bigger Bloom (+40g):** +10 DMG, +0.3 range, faster fire
- **L3 — Petal Storm (+80g):** Multi-target (3), AoE on hit

#### ⚡ Stormcloud — Chain Lightning
- **Base:** 20 DMG, 2.2 range, 1.0s fire rate
- **Cost:** 100 gold
- **Special:** Chains to 3 nearest enemies (50% damage each)
- **L2 — Static Field (+75g):** Chain +1 target, +15 DMG
- **L3 — Overcharge (+150g):** 20% stun chance per hit

#### 🍭 Sugar Cannon — AoE Splash *(BUILT)*
- **Base:** 30 DMG, 2.0 range, 1.8s fire rate
- **Cost:** 75 gold
- **Special:** 1.5-tile splash radius
- **L2 — Bigger Boom (+60g):** +20 DMG (→50), +0.5 splash (→2.0 tiles)
- **L3 — Sticky Sugar (+120g):** Splash applies a short slow (1s)
- **Implementation (flagged):** splash is **UNCAPPED** — full damage to EVERY
  enemy in radius, **no falloff** (NOT-LOCKED — §6.1 gives none). It hits
  **GROUND enemies only** (skips Flying, matching Meteor's "AoE skips fliers") —
  a direct projectile hit can still target/strike a flier, but the splash won't.
  L3 reuses the shared slow path, so the *reduction* is the game's single global
  **40%** (not §6.1's "20%", which needs a per-enemy slow-magnitude field —
  deferred); the **1s duration** is honored. No L3 damage bump (§6.1 gives none).

#### 🌙 Luna Crystal — Sniper *(BUILT)*
- **Base:** 60 DMG, 4.0 range (longest reach), 1.5s fire rate
- **Cost:** 150 gold
- **Special:** Single target, beam projectile, +30% vs armored
- **L2 — Pierce (+100g):** Hits up to 3 in line
- **L3 — Moonburst (+200g):** Critical 25% chance (×2 damage)
- **Implementation (flagged):**
  - **No per-level base-stat change** — 60/4.0/1.5 across L1–L3 (§6.1 gives none);
    upgrades add specials only.
  - **AntiArmor (+30% vs armored):** applied **pre-armor** (`×1.3` then the armor
    reduction), so Luna is net-stronger into armor (vs a Snail: 60→78→39 = ×1.3
    of the base 30). No bonus vs unarmored.
  - **Moonburst crit:** 25% ×2, rolled via the shared injectable damage RNG;
    **per-target** (each pierce beam rolls independently). Order: AntiArmor `×1.3`
    **then** crit `×2`, then armor/dodge.
  - **Pierce line:** resolved at **fire-time in TowerAI** (fires up to 3 beams
    along the tower→target ray; capped-3 zero-alloc line scan, beam half-width
    **0.4 tiles** = NOT-LOCKED) — the projectile loses its origin by hit-time, so
    the ray can only be built where the tower is known. Each beam applies
    AntiArmor/Crit per-hit in DamageSystem.
  - **Beam modeling:** reuses the existing (fast homing) projectile path tagged as
    a beam; no hitscan / new VFX this slice.
  - **Fliers:** the sniper beam **hits fliers** (no flying skip) — unlike ground
    splash; TowerAI targets nearest in range including fliers.
  - Prereq: `Projectile.special` widened **ui8 → ui16** (the 8-bit field was full).

#### 🐝 Hive — Summoner
- **Base:** Summons 3 bee minions (10 HP, 5 DMG each, 5s lifetime)
- **Cost:** 125 gold
- **Special:** Bees patrol nearby, attack ground enemies
- **L2 — Bigger Swarm (+90g):** +2 bees, +HP per bee
- **L3 — Queen Bee (+180g):** Spawns 1 Queen (50 HP, 20 DMG, 10s)

#### 🌊 Bubbler — Crowd Control
- **Base:** 12 DMG, 2.0 range, 0.8s fire rate
- **Cost:** 80 gold
- **Special:** Pushes enemies back 0.5 tiles + 30% slow
- **L2 — Tidal Wave (+70g):** +DMG, push 1.0 tile
- **L3 — Tsunami (+140g):** Line attack hits all in front row

#### Upgrade implementation values (Blossom + Stormcloud built; NOT-LOCKED slice numbers)

§6.1 leaves some upgrade magnitudes unspecified; the implemented values (flagged
in `config/towers.ts` / `config/combat.ts`, tune freely):

- **Blossom L2 "faster fire":** 1.2s → **1.0s** fire interval.
- **Blossom L3 "Petal Storm" AoE:** primary's damage + 40%/2s slow also splash to
  the **3 nearest** enemies within **1 tile**.
- **Stormcloud L3 "Overcharge" stun:** 20% chance (LOCKED) → **1.0s** stun
  (duration NOT in §6.1).

Sell refund (§6.7) is **derived** from typeId+level — placement + applied-upgrade
costs — no stored "invested" field. 60% if never upgraded, else 40% (floored).

### 6.2 Enemies (8 types)

| ID | Emoji | Name | HP | Speed | Reward | Special |
|----|-------|------|-----|-------|--------|---------|
| `grub` | 🐛 | Grub | 60 | 1.0 | 8g | — |
| `snail` | 🐌 | Snail | 180 | 0.5 | 18g | 50% armor (reduce DMG) |
| `flutter` | 🦋 | Flutter | 50 | 2.0 | 12g | Flying (immune to ground splash) |
| `shade` | 💀 | Shade | 90 | 1.6 | 15g | 20% dodge chance |
| `plushy` | 🧸 | Plushy | 150 | 0.9 | 20g | Regenerates 5 HP/s |
| `splitter` | 🐙 | Splitter | 160 | 1.0 | 22g | Spawns 2 mini-splitters on death |
| `candy_king` | 👑 | Candy King | 1200 | 0.7 | 100g | **Mini-boss** (waves 5, 10, 15) |
| `neon_dragon` | 🐲 | Neon Dragon | 4000 | 0.8 | 300g | **Final boss** (wave 20), 2 phases |

#### Boss Phases
**Candy King:**
- 100% HP → Normal speed
- 50% HP → Summons 4 Grubs, +20% speed
- 25% HP → Berserk, +40% speed, immune to slow

**Neon Dragon (Phase 1, 100-50% HP):**
- Walks the path normally
- Summons 1 Flutter every 5s

**Neon Dragon (Phase 2, 50-0% HP):**
- Flies (immune to ground splash)
- Speed +50%
- Spawns Plushies on death of any tower

### 6.3 Wave Design

20 waves total + Endless mode unlock after winning.

```
Wave 1-3:   Tutorial easy (Grubs only, light Snails)
Wave 4:     Introduce Flutter (need air-capable towers)
Wave 5:     CANDY KING (mini-boss)
Wave 6-8:   Mix of all basic enemies
Wave 9:     Splitter introduction
Wave 10:    CANDY KING + waves of supports
Wave 11-13: Density spike, fast enemies
Wave 14:    Plushy introduction (regen counter)
Wave 15:    CANDY KING + Splitters
Wave 16-19: Hardcore mix, multiple enemy types simultaneously
Wave 20:    NEON DRAGON (final boss, 2 phases)
```

#### Wave Data Schema (ADR-0003)

Waves are data, authored in `src/game/config/waves.ts`. A wave is an ordered list
of **spawn groups**; groups sequence/overlap via `startDelayS` from wave start.

```ts
interface SpawnGroup {
  enemy: EnemyType;     // §6.2 id
  count: number;        // enemies in this group
  intervalS: number;    // seconds between spawns within the group
  startDelayS: number;  // seconds from wave start before this group begins
}
interface Wave { groups: SpawnGroup[]; }   // clear bonus derived: 25 + 5*waveNumber (§6.5)
```

- **Wave complete** = all groups fully spawned AND no enemies alive.
- **Inter-wave:** `INTER_WAVE_DELAY_S = 3` prep gap, then auto-advance. (Optional
  future: a "Next Wave" button to call the next wave early — see §6.4 NEXT.)
- **On wave clear**, apply §6.5 economy: `+25 + 5*wave` clear bonus, `+5%` interest
  (cap +50g). **Win** (§6.6) = last defined wave cleared.

#### Concrete Waves 1–3 (Normal; HP/speed ×1.0 per §6.5)

| Wave | Spawn groups | Total | Clear bonus | Intent |
|------|--------------|-------|-------------|--------|
| **1** | Grub ×8 @1.0s (delay 0) | 8 Grub | 30g | Pure intro — ~1 Blossom can solo it |
| **2** | Grub ×12 @0.8s (delay 0) | 12 Grub | 35g | Density bump → second tower |
| **3** | Grub ×10 @0.7s (delay 0) + Snail ×3 @1.5s (delay 2.0s) | 10 Grub, 3 Snail | 40g | Introduce light Snails (armor) per the roadmap |

Waves 4–20 use the same schema, authored incrementally; boss waves (Candy King
5/10/15, Neon Dragon 20) are a single-count group of the boss enemy.

#### Endless Mode (post wave 20)
- Difficulty scales: HP × 1.15ⁿ, count × 1.05ⁿ
- Random enemy composition
- Boss every 5 waves (rotating)
- Leaderboard tracks highest wave reached

### 6.4 Active Skills (Player Agency During Wave)

Player has 3 skill slots, unlocked progressively.

| Skill | Effect | Cooldown | Unlock |
|-------|--------|----------|--------|
| 🌠 **Meteor** | AoE 200 DMG in 2-tile radius | 60s | Default |
| ❄️ **Freeze All** | Stun all enemies 3s | 90s | Wave 5 cleared |
| 💰 **Gold Rush** | 2× gold from kills for 10s | 120s | Wave 10 cleared |

Skills tap-to-aim or tap-to-activate. Visual: bottom-right floating buttons.

### 6.5 Economy

#### Income Sources
- **Kill reward:** as per enemy table
- **Wave clear bonus:** 25g + 5g × wave number
- **Interest:** +5% of current gold per wave (cap +50g)
- **Combo bonus:** 5+ kills in 2 seconds = ×1.5 reward multiplier for that streak

#### Spending
- **Tower placement:** as per tower table
- **Tower upgrade:** as per tower table
- **Tower sell:** 60% refund of total invested (40% if any upgrades applied)

#### Starting Conditions (per difficulty)
| Difficulty | Start Gold | Start Lives | Enemy HP | Enemy Speed |
|------------|------------|-------------|----------|-------------|
| Casual | 200g | 25 | 0.8× | 0.9× |
| Normal | 150g | 20 | 1.0× | 1.0× |
| Hardcore | 100g | 15 | 1.3× | 1.15× |

### 6.6 Win/Lose Conditions
- **Win:** Survive all 20 waves (or N waves in Endless before death)
- **Lose:** Lives reach 0

### 6.7 Meta Progression (v1, local only)
- High score per mode/difficulty
- Total games played, total enemies killed
- Achievements: "First Boss Down", "Survive 5 waves no damage", etc.
- All stored in `localStorage`

---

## 7. Mobile & Touch Requirements

### 7.1 Touch Targets
- **Minimum:** 56×56px (exceeds Apple HIG of 44px)
- **Spacing:** 8px minimum between interactive elements
- **Tower picker buttons:** 64×64px

### 7.2 Gestures
| Gesture | Action |
|---------|--------|
| Tap (empty cell) | Show placement preview ghost |
| Tap (tower) | Open upgrade panel |
| Drag from tower picker | Place tower (with preview) |
| Long press (placed tower) | Quick-sell with confirmation |
| Pinch (map area only) | Zoom 0.75× – 1.5× |
| Two-finger drag (map) | Pan when zoomed |
| Tap (skill button) | Activate skill |

### 7.3 Mobile-Specific Features
- **Safe area insets** — respect notch, dynamic island
- **Orientation:** support both portrait + landscape
  - Portrait: vertical layout, tower picker bottom
  - Landscape: tower picker right side
- **Haptic feedback** via `navigator.vibrate`:
  - Tower place: 10ms
  - Tower hit: 5ms
  - Wave start: 20ms
  - Boss intro: 50ms-50ms-50ms pattern
- **Prevent overscroll** + pull-to-refresh
- **Wake lock** during active gameplay (`navigator.wakeLock`)
- **Audio context** unlock on first touch (iOS quirk)

### 7.4 Responsive Breakpoints
| Width | Mode |
|-------|------|
| < 480px | Mobile portrait |
| 480-768px | Mobile landscape / small tablet |
| 768-1024px | Tablet |
| > 1024px | Desktop |

Game canvas scales with `fit-to-screen` algorithm, maintains aspect ratio.

---

## 8. UI/UX Requirements

### 8.1 Screens
1. **Splash** — logo, version, "tap to start"
2. **Main Menu** — Play, Endless, Settings, About
3. **Difficulty Select** — Casual / Normal / Hardcore + brief desc
4. **In-Game HUD** — gold, lives, wave, score, skill buttons
5. **Tower Picker** — bottom (portrait) / right (landscape)
6. **Upgrade Panel** — modal/drawer on tower tap
7. **Pause Menu** — Resume, Restart, Quit
8. **Wave Clear** — bonus summary, "Next Wave" button
9. **Game Over** — score, wave reached, retry / menu
10. **Victory** — celebration, stats, share button
11. **Settings** — SFX vol, Music vol, Haptics, Quality
12. **Achievements** — locked/unlocked list

### 8.2 HUD Layout

**Portrait:**
```
┌──────────────────────────┐
│ ❤️ 20  💰 250  🌊 5/20  ⭐ 1240 │ ← top strip
├──────────────────────────┤
│                          │
│      [Game Canvas]       │
│                          │
├──────────────────────────┤
│ [🌠] [❄️] [💰]          │ ← skills
├──────────────────────────┤
│ [🌸][⚡][🍭][🌙][🐝][🌊] │ ← tower picker
└──────────────────────────┘
```

### 8.3 Feedback Hierarchy
- **Visual:** color change, flash, particle, glow
- **Audio:** SFX per action
- **Haptic:** subtle on touch confirm
- **Motion:** screen shake for impact (capped at 6px)

### 8.4 Accessibility
- All buttons keyboard-navigable (Tab + Enter)
- `aria-label` on all icon-only buttons
- Sufficient contrast (WCAG AA min)
- Reduced motion mode (disables shake, slows transitions)
- Color-blind safe (don't rely solely on color for status)

---

## 9. Audio Design

### 9.1 Format
- **WebM (Opus codec)** for SFX — smaller than MP3, better quality
- **Sprite map** — single file with timestamps (Howler feature)
- **Music:** 2 looping tracks (calm + intense), crossfade based on wave

### 9.2 SFX Library (Required)
- Tower place (variant per type)
- Tower fire (variant per type)
- Tower upgrade (level up jingle)
- Tower sell
- Enemy hit (light/medium/heavy)
- Enemy death (variant per type)
- Boss intro (dramatic)
- Wave start
- Wave clear (success jingle)
- Game over (sad)
- Victory (celebration)
- Button tap
- Modal open/close
- Skill activate (variant per skill)
- HP low warning (pulse)

### 9.3 Music Direction
- **Calm theme:** chiptune-meets-orchestral, major key, ~110 BPM
- **Intense theme:** same melody, minor key, ~140 BPM, layered drums
- Total: < 100KB combined (compressed)

### 9.4 Volume Mixing
- Master: 80% default
- SFX: 70% default
- Music: 50% default
- All adjustable in Settings

---

## 10. Project Structure

```
bloom-bastion/
├── public/
│   ├── icons/                  # PWA icons
│   ├── manifest.json
│   └── og-image.png
│
├── src/
│   ├── engine/                 # Reusable game engine
│   │   ├── ecs/
│   │   │   ├── world.ts        # bitECS world setup
│   │   │   ├── components.ts   # all component definitions
│   │   │   └── queries.ts      # bitECS queries
│   │   ├── renderer/
│   │   │   ├── pixi-app.ts     # Pixi Application singleton
│   │   │   ├── atlas-loader.ts # sprite atlas loader
│   │   │   └── filters.ts      # bloom, chromatic, etc.
│   │   ├── pool/
│   │   │   ├── object-pool.ts  # generic pool
│   │   │   └── pools.ts        # named pools (particles, projectiles)
│   │   ├── pathfinding/
│   │   │   └── flow-field.ts
│   │   ├── audio/
│   │   │   └── audio-manager.ts
│   │   ├── input/
│   │   │   └── pointer.ts      # pointer + touch unified
│   │   └── loop.ts             # main RAF loop
│   │
│   ├── game/                   # Bloom Bastion specific
│   │   ├── systems/
│   │   │   ├── spawn.ts
│   │   │   ├── path-follow.ts
│   │   │   ├── tower-ai.ts
│   │   │   ├── projectile.ts
│   │   │   ├── damage.ts
│   │   │   ├── death.ts
│   │   │   ├── animation.ts
│   │   │   ├── render.ts
│   │   │   └── ui-sync.ts
│   │   ├── entities/
│   │   │   ├── create-tower.ts
│   │   │   ├── create-enemy.ts
│   │   │   ├── create-projectile.ts
│   │   │   └── create-particle.ts
│   │   ├── config/
│   │   │   ├── towers.ts       # data only
│   │   │   ├── enemies.ts
│   │   │   ├── waves.ts
│   │   │   ├── skills.ts
│   │   │   └── balance.ts      # difficulty multipliers
│   │   ├── maps/
│   │   │   ├── map-01.json     # Tiled format
│   │   │   └── map-02.json
│   │   └── events.ts           # game-wide event emitter
│   │
│   ├── ui/                     # React components (DOM)
│   │   ├── App.tsx
│   │   ├── menus/
│   │   │   ├── MainMenu.tsx
│   │   │   ├── DifficultySelect.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── PauseMenu.tsx
│   │   │   ├── GameOver.tsx
│   │   │   └── Victory.tsx
│   │   ├── hud/
│   │   │   ├── HUD.tsx
│   │   │   ├── TowerPicker.tsx
│   │   │   ├── SkillBar.tsx
│   │   │   ├── UpgradePanel.tsx
│   │   │   └── WaveIndicator.tsx
│   │   └── styles/
│   │       ├── tokens.css      # design tokens
│   │       └── globals.css
│   │
│   ├── store/
│   │   ├── ui-store.ts         # Zustand: HUD state
│   │   ├── settings-store.ts   # Zustand: persisted settings
│   │   └── meta-store.ts       # Zustand: scores, achievements
│   │
│   ├── assets/
│   │   ├── sprites/            # WebP atlas
│   │   │   └── atlas.json + atlas.webp
│   │   ├── rive/               # .riv files
│   │   │   ├── towers.riv
│   │   │   └── enemies.riv
│   │   ├── audio/
│   │   │   ├── sfx.webm        # sprite map
│   │   │   ├── music-calm.webm
│   │   │   └── music-intense.webm
│   │   └── fonts/
│   │       └── Fredoka-Bold.woff2
│   │
│   ├── lib/
│   │   ├── persist.ts          # localStorage wrapper
│   │   ├── analytics.ts        # (optional, future)
│   │   └── utils.ts
│   │
│   └── main.ts                 # entry point
│
├── tests/
│   ├── unit/
│   │   ├── flow-field.test.ts
│   │   ├── damage.test.ts
│   │   └── economy.test.ts
│   └── e2e/
│       └── full-game.spec.ts   # Playwright
│
├── design-assets/              # from Claude Design
│   ├── design-tokens.css
│   ├── sprites.svg
│   ├── mockups/
│   └── README.md
│
├── docs/
│   ├── decisions/              # ADRs
│   └── architecture.md
│
├── .claude/
│   ├── commands/               # custom slash commands
│   └── settings.json
│
├── CLAUDE.md                   # project memory for agents
├── SPEC.md                     # this file
├── README.md
├── index.html
├── vite.config.ts              # bundler/dev-server (runs on Bun)
├── tsconfig.json               # TS strict, type-check only
├── biome.json                  # lint + format (replaces ESLint+Prettier)
├── bunfig.toml                 # Bun runtime/test config
├── .bun-version                # pinned Bun version for CI
├── package.json
├── bun.lockb                   # Bun binary lockfile (commit this)
└── .gitignore
```

---

## 11. Build & Deploy

### 11.1 Scripts
All scripts run via Bun (`bun run <name>`). Vite/Vitest/Playwright execute on the Bun runtime.
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "deploy": "vercel --prod"
  }
}
```

Common commands:
```bash
bun install            # fast install → bun.lockb
bun run dev            # Vite dev server + HMR (runtime: Bun)
bun run build          # type-check gate + Vite/Rollup production build
bun run lint           # Biome lint + format check
bun run test           # Vitest unit tests
```

### 11.2 Vite Config Highlights
- Manual chunks: pixi, ecs, rive, react (better caching)
- Asset includes: `.riv`, `.webm`
- Server: `host: true` for LAN mobile testing
- Build target: ES2022
- React plugin: `@vitejs/plugin-react` (React 19)

### 11.3 Toolchain Config Files
- `bunfig.toml` — Bun config (registry, test settings)
- `.bun-version` — pin Bun version for CI reproducibility
- `biome.json` — lint + format rules (replaces `.eslintrc` + `.prettierrc`)
- `vite.config.ts` — bundler/dev-server config (§11.2)
- `tsconfig.json` — TS strict mode, type-check only (no emit)

### 11.4 Deploy Targets
- **Primary:** Vercel (auto-deploy from `main` branch; set install command to `bun install`, build to `bun run build`)
- **Backup:** Cloudflare Pages (free tier, edge CDN)
- **Local share:** `bun run preview` + ngrok for testing

### 11.5 PWA (v1.1)
- Service Worker for offline play
- Add to Home Screen icon
- Standalone display mode

---

## 12. Testing Strategy

### 12.1 Unit Tests (Vitest, on Bun runtime)
Run with `bun run test`. Vitest is kept (not `bun test`) for its Vite-transform pipeline and mature jsdom/canvas-mock support — important for testing game logic that touches DOM/canvas. Required coverage:
- Pathfinding (flow field correctness)
- Damage calculation (armor, dodge, crit)
- Economy (rewards, interest, combo)
- Wave progression logic
- Object pool correctness

### 12.2 Integration Tests
- Place tower → enemy gets shot → dies → gold awarded
- Wave clear → bonus applied → next wave starts
- Boss defeat → victory screen

### 12.3 E2E Tests (Playwright)
- Full happy path: start game → win wave 1
- Settings persist after refresh
- Mobile viewport (iPhone 12 emulation)

### 12.4 Performance Tests
- FPS log over 5 minutes of gameplay
- Memory snapshot every 10 waves
- Bundle size check on every build (CI fail if > 500KB)

---

## 13. Roadmap & Milestones

### M0 — Foundation (Week 1)
- [ ] Project scaffold (Vite + TS + Pixi + bitECS)
- [ ] CLAUDE.md, SPEC.md, slash commands committed
- [ ] Design tokens from Claude Design integrated
- [ ] Pixi app boots, renders empty canvas with grid
- [ ] One smoke-test tower + enemy moving on path

### M1 — Core Loop (Week 2)
- [ ] Flow field pathfinding working
- [ ] Tower placement + targeting
- [ ] Projectile system + damage
- [ ] Enemy death + gold reward
- [ ] Wave spawning (waves 1-3)
- [ ] Basic HUD (gold, lives, wave)

### M2 — Content (Week 3)
- [ ] All 6 towers implemented with upgrades
- [ ] All 8 enemies implemented
- [ ] 20 waves configured
- [ ] Boss waves (Candy King + Neon Dragon)
- [ ] Active skills (3)

### M3 — Polish (Week 4)
- [ ] Rive animations integrated
- [ ] Particle effects + screen shake
- [ ] Bloom + chromatic shaders
- [ ] Audio (SFX + music)
- [ ] All menus + screens
- [ ] Mobile touch fully working

### M4 — Optimization & Ship (Week 5)
- [ ] Profile + optimize to 60fps mobile
- [ ] Adaptive quality system
- [ ] Object pooling audit
- [ ] Lighthouse score ≥ 90
- [ ] Deploy to Vercel
- [ ] README + landing page

### Post-v1
- M5: PWA + offline
- M6: Endless mode + leaderboard
- M7: Achievements + meta progression
- M8: Second map / theme

---

## 14. Acceptance Criteria

Project is shippable when ALL of these are true:

### Functional
- [ ] Player can complete waves 1-20 on Normal difficulty
- [ ] Player can lose (lives → 0)
- [ ] Settings persist across sessions
- [ ] All 6 towers can be placed, upgraded, sold
- [ ] All 8 enemies behave per spec
- [ ] 3 active skills work as described

### Performance
- [ ] 60fps stable on iPhone 11 with 200 entities (verified)
- [ ] No memory leaks across 10 wave cycles (verified Chrome DevTools)
- [ ] Lighthouse Performance ≥ 90 (mobile)
- [ ] Bundle JS < 500KB gzipped
- [ ] FCP < 2s on 4G

### Quality
- [ ] No critical console errors
- [ ] All unit tests pass
- [ ] E2E happy path passes
- [ ] Visual matches design mockups (within 95%)
- [ ] Touch + mouse + keyboard all work
- [ ] Responsive 320px → 1920px

### Polish
- [ ] All transitions animated
- [ ] All actions have audio feedback
- [ ] All hits have visual feedback
- [ ] Haptics on mobile
- [ ] Accessible (keyboard nav, ARIA labels)

---

## 15. Out of Scope (v1)

Explicitly NOT in scope, deferred to later versions:

- ❌ Multiplayer / co-op / PvP
- ❌ Online leaderboard (local only in v1)
- ❌ Account system / cloud save
- ❌ In-app purchases / monetization
- ❌ User-generated content (level editor)
- ❌ More than 1 map (v1 ships with 1 themed map)
- ❌ Daily challenges (v2)
- ❌ Localization (English only in v1, easy to add later)
- ❌ Backend / database
- ❌ Analytics / tracking (privacy-first)
- ❌ Tutorial system (smart defaults + tooltips only)

---

## 16. Glossary

| Term | Meaning |
|------|---------|
| **ECS** | Entity-Component-System architectural pattern |
| **Flow Field** | Pathfinding technique where direction vectors are pre-computed for each grid cell |
| **Object Pool** | Pre-allocated reusable objects to avoid GC pressure |
| **Bloom** | Post-processing effect that makes bright pixels glow |
| **Squash & Stretch** | Animation principle of exaggerating motion for impact |
| **FCP** | First Contentful Paint — when first visual appears |
| **TTI** | Time to Interactive — when page is responsive |
| **HUD** | Heads-Up Display — overlay UI showing game state |
| **AoE** | Area of Effect (damage hits multiple targets) |
| **DoT** | Damage over Time |
| **Atlas** | Single image containing many sprites for batching |

---

## 📌 Final Notes

This SPEC is **the contract**. Agents reference it before making decisions.

Changes require:
1. ADR in `docs/decisions/` explaining why
2. Update to this SPEC
3. Notification in shared memory (`/remember`)

When in doubt, ask the orchestrator. When the SPEC is unclear, prefer the choice that:
- Improves performance
- Improves player feel (juice)
- Reduces complexity
- Stays mobile-first

**Build with care. Ship with confidence.** 🌸