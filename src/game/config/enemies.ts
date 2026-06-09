/**
 * Enemy data tables — SPEC §6.2 (LOCKED balance; numbers are data, not logic).
 *
 * M1 vertical slice scope: only the simplest enemy (`grub`). The remaining 7
 * types land with M2 content. Stats below are copied EXACTLY from SPEC §6.2 — if
 * a number here disagrees with the SPEC table, the SPEC table wins and one of
 * them is a bug.
 *
 * Units:
 *  - `hp`     — hit points (Health.current = Health.max at spawn).
 *  - `speed`  — tiles/second (SPEC §6.2). Converted to px/s against the 60px
 *               `CELL` by PathFollowSystem (round 2); stored here in spec units.
 *  - `reward` — gold granted on kill (DeathSystem, round 2+).
 */
import type { SpriteKey } from "./sprites";

/**
 * Per-enemy `Enemy.flags` (ui16) bits. Boss-phase progress is recorded here so
 * DamageSystem triggers each phase once and PathFollowSystem reads the active
 * speed multiplier + slow-immunity — all zero-alloc bit tests.
 */
export const ENEMY_FLAGS = {
  /** Boss phase 0 (Candy King 50% HP) has fired. */
  Phase1Done: 1 << 0,
  /** Boss phase 1 (Candy King 25% HP / berserk) has fired. */
  Phase2Done: 1 << 1,
  /** Enemy ignores slow (Candy King berserk). */
  SlowImmune: 1 << 2,
  /** Flying (Flutter) — immune to AoE / ground-splash damage (SPEC §6.2). */
  Flying: 1 << 3,
} as const;

/** A boss HP-threshold phase (SPEC §6.2 boss phases). */
export interface BossPhase {
  /** Fires when `Health.current / Health.max <= hpFrac`. */
  readonly hpFrac: number;
  /** Grubs summoned near the boss when this phase fires. */
  readonly summonGrubs?: number;
  /** Speed multiplier applied while this is the boss's highest-fired phase. */
  readonly speedMult?: number;
  /** When true, the boss becomes immune to slow once this phase fires. */
  readonly slowImmune?: boolean;
}

/** Numeric `Enemy.typeId` (ui8) — the index stored in the ECS component. */
export const EnemyType = {
  Grub: 0,
  Snail: 1,
  CandyKing: 2,
  Flutter: 3,
  Splitter: 4,
  MiniSplitter: 5,
  Shade: 6,
  Plushy: 7,
} as const;

export type EnemyTypeId = (typeof EnemyType)[keyof typeof EnemyType];

/** Spawn-on-death burst (SPEC §6.2 Splitter). */
export interface SplitEffect {
  /** Enemy type spawned on death. */
  readonly type: EnemyTypeId;
  /** How many to spawn. */
  readonly count: number;
}

export interface EnemyConfig {
  /** Stable string id (SPEC §6.2 `ID` column). */
  readonly id: string;
  /** Display name (SPEC §6.2 `Name`). */
  readonly name: string;
  /** Max hit points. */
  readonly hp: number;
  /** Movement speed in tiles/second (SPEC §6.2 `Speed`). */
  readonly speed: number;
  /** Gold reward on kill (SPEC §6.2 `Reward`). */
  readonly reward: number;
  /** Atlas sprite key → `Renderable.spriteId` (native SVG colours; tint stays 0). */
  readonly sprite: SpriteKey;
  /**
   * Fractional damage reduction, 0..1 (SPEC §6.2 "armor"). DamageSystem applies
   * `effectiveDamage = damage * (1 - armor)`. Default 0 (no armor).
   */
  readonly armor?: number;
  /** Marks a boss (UISync surfaces its HP bar; DamageSystem runs its phases). */
  readonly isBoss?: boolean;
  /** HP-threshold phases, ordered high→low HP (SPEC §6.2). */
  readonly phases?: readonly BossPhase[];
  /** Flying (Flutter) — immune to AoE / ground-splash; spawnEnemy sets the flag. */
  readonly flying?: boolean;
  /** Spawn-on-death burst (Splitter → mini-splitters). */
  readonly onDeathSplit?: SplitEffect;
  /** Chance 0..1 to fully avoid a hit (Shade dodge, SPEC §6.2). applyDamage rolls it. */
  readonly dodgeChance?: number;
  /** HP healed per second while alive (Plushy regen, SPEC §6.2). PathFollow applies it. */
  readonly regenPerSec?: number;
}

/** 🐛 Grub — SPEC §6.2: HP 60, Speed 1.0, Reward 8g, no special. */
const GRUB: EnemyConfig = {
  id: "grub",
  name: "Grub",
  hp: 60,
  speed: 1.0,
  reward: 8,
  sprite: "enemy-grub",
};

/** 🐌 Snail — SPEC §6.2: HP 180, Speed 0.5, Reward 18g, 50% armor (halves DMG). */
const SNAIL: EnemyConfig = {
  id: "snail",
  name: "Snail",
  hp: 180,
  speed: 0.5,
  reward: 18,
  sprite: "enemy-snail",
  armor: 0.5,
};

/**
 * 👑 Candy King — SPEC §6.2: HP 1200, Speed 0.7, Reward 100g, mini-boss.
 * Phases: 50% HP → summon 4 Grubs + speed ×1.2; 25% HP → berserk ×1.4 + slow-immune.
 */
const CANDY_KING: EnemyConfig = {
  id: "candy_king",
  name: "Candy King",
  hp: 1200,
  speed: 0.7,
  reward: 100,
  sprite: "enemy-candyking",
  armor: 0,
  isBoss: true,
  phases: [
    { hpFrac: 0.5, summonGrubs: 4, speedMult: 1.2 },
    { hpFrac: 0.25, speedMult: 1.4, slowImmune: true },
  ],
};

/** 🦋 Flutter — SPEC §6.2: HP 50, Speed 2.0, Reward 12g, Flying (splash-immune). */
const FLUTTER: EnemyConfig = {
  id: "flutter",
  name: "Flutter",
  hp: 50,
  speed: 2.0,
  reward: 12,
  sprite: "enemy-flutter",
  flying: true,
};

/** 🐙 Splitter — SPEC §6.2: HP 160, Speed 1.0, Reward 22g, splits into 2 minis on death. */
const SPLITTER: EnemyConfig = {
  id: "splitter",
  name: "Splitter",
  hp: 160,
  speed: 1.0,
  reward: 22,
  sprite: "enemy-splitter",
  onDeathSplit: { type: EnemyType.MiniSplitter, count: 2 },
};

/**
 * 🐙 Mini-Splitter — the spawn from a dead Splitter. SPEC §6.2 gives no mini
 * stats, so these are TUNED (FLAGGED): HP 40, Speed 1.2, Reward 8g. REUSES the
 * Splitter sprite (id 104). NO onDeathSplit → no infinite recursion.
 */
const MINI_SPLITTER: EnemyConfig = {
  id: "mini_splitter",
  name: "Mini-Splitter",
  hp: 40,
  speed: 1.2,
  reward: 8,
  sprite: "enemy-splitter",
};

/** 💀 Shade — SPEC §6.2: HP 90, Speed 1.6, Reward 15g, 20% dodge chance. */
const SHADE: EnemyConfig = {
  id: "shade",
  name: "Shade",
  hp: 90,
  speed: 1.6,
  reward: 15,
  sprite: "enemy-shade",
  dodgeChance: 0.2,
};

/** 🧸 Plushy — SPEC §6.2: HP 150, Speed 0.9, Reward 20g, regenerates 5 HP/s. */
const PLUSHY: EnemyConfig = {
  id: "plushy",
  name: "Plushy",
  hp: 150,
  speed: 0.9,
  reward: 20,
  sprite: "enemy-plushy",
  regenPerSec: 5,
};

/** Lookup by string id. */
export const ENEMIES: Readonly<Record<string, EnemyConfig>> = {
  grub: GRUB,
  snail: SNAIL,
  candy_king: CANDY_KING,
  flutter: FLUTTER,
  splitter: SPLITTER,
  mini_splitter: MINI_SPLITTER,
  shade: SHADE,
  plushy: PLUSHY,
};

/** Lookup by numeric `Enemy.typeId` (what factories/systems carry). */
export const ENEMY_BY_TYPE: Readonly<Record<number, EnemyConfig>> = {
  [EnemyType.Grub]: GRUB,
  [EnemyType.Snail]: SNAIL,
  [EnemyType.CandyKing]: CANDY_KING,
  [EnemyType.Flutter]: FLUTTER,
  [EnemyType.Splitter]: SPLITTER,
  [EnemyType.MiniSplitter]: MINI_SPLITTER,
  [EnemyType.Shade]: SHADE,
  [EnemyType.Plushy]: PLUSHY,
};
