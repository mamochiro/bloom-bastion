/**
 * Tower data tables — SPEC §6.1 (LOCKED balance; numbers are data, not logic).
 *
 * M1 vertical slice scope: only the first tower (`blossom`, base level). Its 5
 * other families and all L2/L3 upgrades land with M2 content. Stats below are
 * copied EXACTLY from SPEC §6.1.
 *
 * Units:
 *  - `damage`   — hit points removed per shot.
 *  - `range`    — tiles (SPEC §6.1). Converted to px against the 60px `CELL` by
 *                 TowerAISystem (round 2); stored here in spec units.
 *  - `cooldown` — fire interval in seconds (SPEC §6.1 "fire rate"). Copied into
 *                 the `Tower.cooldown` countdown after each shot.
 *  - `cost`     — gold to place (SPEC §6.1).
 */
import { SPECIAL, SPLASH_RADIUS_BIG_TILES, SPLASH_RADIUS_TILES } from "./combat";
import { HIVE_SUMMON_COOLDOWN_S } from "./hive";
import type { SpriteKey } from "./sprites";

/** Per-level stat overrides reached by an upgrade (SPEC §6.1 L2/L3). */
export interface TowerUpgrade {
  /** Upgrade name shown in the panel (SPEC §6.1). */
  readonly label: string;
  /** Gold to APPLY this upgrade (the "+Ng" in SPEC §6.1). */
  readonly cost: number;
  /** Resulting damage at this level. */
  readonly damage: number;
  /** Resulting range (tiles). */
  readonly range: number;
  /** Resulting fire interval (s). */
  readonly cooldown: number;
}

/** Slow status applied on hit (SPEC §6.1 Blossom special). */
export interface SlowEffect {
  /** Fractional speed reduction, 0..1 (0.4 = −40%). */
  readonly speedReduction: number;
  /** Duration in seconds. */
  readonly durationS: number;
}

/** Chain lightning applied on hit (SPEC §6.1 Stormcloud special). */
export interface ChainEffect {
  /** Total enemies struck, incl. the primary (SPEC §6.1: 3). */
  readonly maxTargets: number;
  /** Damage fraction dealt to each CHAINED enemy, 0..1 (SPEC §6.1: 0.5). */
  readonly falloff: number;
}

export interface TowerConfig {
  /** Stable string id. */
  readonly id: string;
  /** Display name. */
  readonly name: string;
  /** Damage per shot. */
  readonly damage: number;
  /** Targeting range in tiles (SPEC §6.1). */
  readonly range: number;
  /** Fire interval in seconds (SPEC §6.1 fire rate). */
  readonly cooldown: number;
  /** Placement cost in gold (SPEC §6.1). */
  readonly cost: number;
  /** Atlas sprite key → `Renderable.spriteId` (native SVG colours; tint stays 0). */
  readonly sprite: SpriteKey;
  /** On-hit slow (SPEC §6.1 Blossom special). */
  readonly slow?: SlowEffect;
  /** On-hit chain lightning (SPEC §6.1 Stormcloud special). */
  readonly chain?: ChainEffect;
  /** L2, L3 stat overrides (SPEC §6.1). Base flat fields above are L1. */
  readonly upgrades?: readonly [TowerUpgrade, TowerUpgrade];
}

/**
 * 🌸 Blossom (base) — SPEC §6.1: 15 DMG, 2.5 range, 1.2s fire rate, 50g.
 * Special: applies slow (40% speed reduction, 2s).
 */
const BLOSSOM: TowerConfig = {
  id: "blossom",
  name: "Blossom",
  damage: 15,
  range: 2.5,
  cooldown: 1.2,
  cost: 50,
  sprite: "tower-blossom-l1",
  slow: { speedReduction: 0.4, durationS: 2 },
  upgrades: [
    // L2 "Bigger Bloom" +40g: +10 DMG (25), +0.3 range (2.8), faster fire.
    // NOT-LOCKED: §6.1 says "faster fire" with no number → 1.0s slice value (flag).
    { label: "Bigger Bloom", cost: 40, damage: 25, range: 2.8, cooldown: 1.0 },
    // L3 "Petal Storm" +80g: Multi-target (3) AoE on hit (damage+slow splash);
    // stats carry over from L2 (no §6.1 stat change), special gains AoeSlow.
    { label: "Petal Storm", cost: 80, damage: 25, range: 2.8, cooldown: 1.0 },
  ],
};

/**
 * ⚡ Stormcloud (base) — SPEC §6.1: 20 DMG, 2.2 range, 1.0s fire rate, 100g.
 * Special: chains to 3 nearest enemies, 50% damage each (primary full + 2 @50%).
 */
const STORMCLOUD: TowerConfig = {
  id: "stormcloud",
  name: "Stormcloud",
  damage: 20,
  range: 2.2,
  cooldown: 1.0,
  cost: 100,
  sprite: "tower-stormcloud-l1",
  chain: { maxTargets: 3, falloff: 0.5 },
  upgrades: [
    // L2 "Static Field" +75g: chain +1 target (→4 total) + 15 DMG (35).
    { label: "Static Field", cost: 75, damage: 35, range: 2.2, cooldown: 1.0 },
    // L3 "Overcharge" +150g: 20% stun chance per hit (keeps L2 chain+1/35 DMG).
    { label: "Overcharge", cost: 150, damage: 35, range: 2.2, cooldown: 1.0 },
  ],
};

/**
 * 🍭 Sugar Cannon (base) — SPEC §6.1: 30 DMG, 2.0 range, 1.8s fire rate, 75g.
 * Special: AoE splash, 1.5-tile radius (uncapped — hits every ground enemy in
 * radius). L2 "Bigger Boom" → +20 DMG + 0.5 splash; L3 "Sticky Sugar" → splash
 * also slows. Splash radius / slow live in the SPECIAL bits + combat constants;
 * range/cooldown carry over per level (§6.1 gives no L2/L3 change for them).
 */
const SUGAR_CANNON: TowerConfig = {
  id: "sugarcannon",
  name: "Sugar Cannon",
  damage: 30,
  range: 2.0,
  cooldown: 1.8,
  cost: 75,
  sprite: "tower-sugarcannon-l1",
  upgrades: [
    // L2 "Bigger Boom" +60g: +20 DMG (50), +0.5 splash (→2.0); range/cd unchanged.
    { label: "Bigger Boom", cost: 60, damage: 50, range: 2.0, cooldown: 1.8 },
    // L3 "Sticky Sugar" +120g: splash also slows (no §6.1 damage bump → 50).
    { label: "Sticky Sugar", cost: 120, damage: 50, range: 2.0, cooldown: 1.8 },
  ],
};

/**
 * 🌙 Luna Crystal (base) — SPEC §6.1: 60 DMG, 4.0 range (longest reach), 1.5s
 * fire rate, 150g. Special: +30% vs armored (beam single-target). L2 "Pierce" →
 * beam hits up to 3 in a line; L3 "Moonburst" → 25% crit (×2). No per-level
 * base-stat change (§6.1 gives none): 60/4.0/1.5 across all levels (flagged).
 */
const LUNA: TowerConfig = {
  id: "luna",
  name: "Luna Crystal",
  damage: 60,
  range: 4.0,
  cooldown: 1.5,
  cost: 150,
  sprite: "tower-luna-l1",
  upgrades: [
    // L2 "Pierce" +100g: beam hits up to 3 in a line (special only; stats same).
    { label: "Pierce", cost: 100, damage: 60, range: 4.0, cooldown: 1.5 },
    // L3 "Moonburst" +200g: 25% crit ×2 (special only; stats same).
    { label: "Moonburst", cost: 200, damage: 60, range: 4.0, cooldown: 1.5 },
  ],
};

/**
 * 🐝 Hive (base) — SPEC §6.1: 125g summoner. Does NOT fire — it maintains a
 * SWARM of bee minions (5 DMG, 5s) that attack ground enemies. Has no
 * damage/range/projectile of its own; `cooldown` is the swarm TOP-UP interval
 * (HIVE_SUMMON_COOLDOWN_S). L2 "Bigger Swarm" → 3→5 bees; L3 "Queen Bee" → also
 * 1 Queen (20 DMG, 10s). Swarm size / queen are read per level by TowerAI from
 * config/hive.ts. No `levelSpecial` — bees aren't projectiles.
 */
const HIVE: TowerConfig = {
  id: "hive",
  name: "Hive",
  damage: 0,
  range: 0,
  cooldown: HIVE_SUMMON_COOLDOWN_S,
  cost: 125,
  sprite: "tower-hive-l1",
  upgrades: [
    // L2 "Bigger Swarm" +90g: swarm 3→5 (the meaningful buff; "+HP per bee" is a
    // NO-OP — minions have no hp by design, lifetime governs). FLAGGED.
    { label: "Bigger Swarm", cost: 90, damage: 0, range: 0, cooldown: HIVE_SUMMON_COOLDOWN_S },
    // L3 "Queen Bee" +180g: also maintain 1 Queen (queen "50 HP" is vestigial).
    { label: "Queen Bee", cost: 180, damage: 0, range: 0, cooldown: HIVE_SUMMON_COOLDOWN_S },
  ],
};

/**
 * 🌊 Bubbler (base) — SPEC §6.1: 12 DMG, 2.0 range, 0.8s fire rate, 80g.
 * Special: slow + knockback 0.5 tiles. L2 "Tidal Wave" → +DMG (chose +8 → 20;
 * §6.1 gives no number, flagged) + push 1.0 tile. L3 "Tsunami" → line attack
 * (hits all ground enemies along the lane). Slow/push/line are SPECIAL bits.
 */
const BUBBLER: TowerConfig = {
  id: "bubbler",
  name: "Bubbler",
  damage: 12,
  range: 2.0,
  cooldown: 0.8,
  cost: 80,
  sprite: "tower-bubbler-l1",
  slow: { speedReduction: 0.4, durationS: 2 },
  upgrades: [
    // L2 "Tidal Wave" +70g: +8 DMG (→20) + bigger push (0.5→1.0 tile).
    { label: "Tidal Wave", cost: 70, damage: 20, range: 2.0, cooldown: 0.8 },
    // L3 "Tsunami" +140g: line attack (no §6.1 damage bump → stays 20).
    { label: "Tsunami", cost: 140, damage: 20, range: 2.0, cooldown: 0.8 },
  ],
};

/** Numeric `Tower.typeId` (ui8) — the index stored in the ECS component. */
export const TowerType = {
  Blossom: 0,
  Stormcloud: 1,
  SugarCannon: 2,
  Luna: 3,
  Hive: 4,
  Bubbler: 5,
} as const;

export type TowerTypeId = (typeof TowerType)[keyof typeof TowerType];

/** Base upgrade level for a freshly placed tower (SPEC §6.1 L1 = base). */
export const BASE_TOWER_LEVEL = 1;

/** Lookup by string id. */
export const TOWERS: Readonly<Record<string, TowerConfig>> = {
  blossom: BLOSSOM,
  stormcloud: STORMCLOUD,
  sugarcannon: SUGAR_CANNON,
  luna: LUNA,
  hive: HIVE,
  bubbler: BUBBLER,
};

/** Lookup by numeric `Tower.typeId` (what factories/systems carry). */
export const TOWER_BY_TYPE: Readonly<Record<number, TowerConfig>> = {
  [TowerType.Blossom]: BLOSSOM,
  [TowerType.Stormcloud]: STORMCLOUD,
  [TowerType.SugarCannon]: SUGAR_CANNON,
  [TowerType.Luna]: LUNA,
  [TowerType.Hive]: HIVE,
  [TowerType.Bubbler]: BUBBLER,
};

/**
 * Placeable towers in display order — one card per entry for the UI TowerPicker.
 * Carries the numeric typeId so the UI can pass it straight to placement/build.
 */
export const PLACEABLE_TOWERS: readonly TowerTypeId[] = [
  TowerType.Blossom,
  TowerType.Stormcloud,
  TowerType.SugarCannon,
  TowerType.Luna,
  TowerType.Hive,
  TowerType.Bubbler,
];

/** Highest tower level (SPEC §6.1: 3). */
export const MAX_TOWER_LEVEL = 3;

/** Current-level stats a tower fires with (TowerAI/Damage read these). */
export interface LevelStats {
  readonly damage: number;
  readonly range: number;
  readonly cooldown: number;
  /** Packed `SPECIAL` bits for this level's projectile. */
  readonly special: number;
  /** AoE splash radius in tiles (Sugar Cannon), or undefined for non-splash towers. */
  readonly splashRadius?: number;
}

/** `SPECIAL` bitmask a tower's projectile carries at `level` (1..3). */
function levelSpecial(typeId: number, level: number): number {
  if (typeId === TowerType.Blossom) {
    let s = SPECIAL.Slow; // all levels slow
    if (level >= 3) s |= SPECIAL.AoeSlow; // Petal Storm
    return s;
  }
  if (typeId === TowerType.Stormcloud) {
    let s = SPECIAL.Chain; // all levels chain
    if (level >= 2) s |= SPECIAL.ChainPlus; // Static Field: +1 target
    if (level >= 3) s |= SPECIAL.Stun; // Overcharge: stun chance
    return s;
  }
  if (typeId === TowerType.SugarCannon) {
    let s = SPECIAL.Splash; // all levels splash
    if (level >= 2) s |= SPECIAL.SplashBig; // Bigger Boom: 1.5→2.0 radius
    if (level >= 3) s |= SPECIAL.SplashSlow; // Sticky Sugar: splash slows
    return s;
  }
  if (typeId === TowerType.Luna) {
    let s = SPECIAL.AntiArmor; // all levels: +30% vs armored
    if (level >= 2) s |= SPECIAL.Pierce; // Pierce: beam hits up to 3 in a line
    if (level >= 3) s |= SPECIAL.Crit; // Moonburst: 25% crit ×2
    return s;
  }
  if (typeId === TowerType.Bubbler) {
    let s = SPECIAL.Slow | SPECIAL.Push; // all levels: slow + knockback
    if (level >= 2) s |= SPECIAL.PushBig; // Tidal Wave: 0.5→1.0 tile push
    if (level >= 3) s |= SPECIAL.Line; // Tsunami: line attack
    return s;
  }
  return SPECIAL.None;
}

/** AoE splash radius (tiles) for `typeId` at `level`, or undefined if non-splash. */
function levelSplashRadius(typeId: number, level: number): number | undefined {
  if (typeId !== TowerType.SugarCannon) return undefined;
  return level >= 2 ? SPLASH_RADIUS_BIG_TILES : SPLASH_RADIUS_TILES; // 2.0 / 1.5
}

/** Stats for `typeId` at `level` (1 = base flat fields; 2/3 = upgrade overrides). */
export function towerLevelStats(typeId: number, level: number): LevelStats {
  const cfg = TOWER_BY_TYPE[typeId];
  const up = level >= 2 && cfg.upgrades ? cfg.upgrades[level - 2] : null;
  return {
    damage: up ? up.damage : cfg.damage,
    range: up ? up.range : cfg.range,
    cooldown: up ? up.cooldown : cfg.cooldown,
    special: levelSpecial(typeId, level),
    splashRadius: levelSplashRadius(typeId, level),
  };
}

/** Gold invested so far in a tower at `level` (placement + upgrades applied). */
export function totalInvested(typeId: number, level: number): number {
  const cfg = TOWER_BY_TYPE[typeId];
  let total = cfg.cost; // L1 placement
  if (cfg.upgrades) for (let l = 2; l <= level; l++) total += cfg.upgrades[l - 2].cost;
  return total;
}

/** The NEXT upgrade (label + cost) from `level`, or null at max level. */
export function upgradeInfo(typeId: number, level: number): { label: string; cost: number } | null {
  const cfg = TOWER_BY_TYPE[typeId];
  if (level >= MAX_TOWER_LEVEL || !cfg.upgrades) return null;
  const u = cfg.upgrades[level - 1]; // level 1 → upgrades[0] (L2), level 2 → upgrades[1] (L3)
  return { label: u.label, cost: u.cost };
}

/**
 * Sell refund (SPEC §6.7): 60% of total invested if NEVER upgraded (level 1),
 * else 40%. Floored to whole gold.
 */
export function sellValue(typeId: number, level: number): number {
  const refund = level === 1 ? 0.6 : 0.4;
  return Math.floor(totalInvested(typeId, level) * refund);
}
