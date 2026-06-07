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
import type { SpriteKey } from "./sprites";
import { TINT, type Tint } from "./tokens";

/** Slow status applied on hit (SPEC §6.1 Blossom special). */
export interface SlowEffect {
  /** Fractional speed reduction, 0..1 (0.4 = −40%). */
  readonly speedReduction: number;
  /** Duration in seconds. */
  readonly durationS: number;
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
  /** Atlas sprite key → `Renderable.spriteId`. */
  readonly sprite: SpriteKey;
  /** Packed design-token tint → `Renderable.tint`. */
  readonly tint: Tint;
  /** On-hit slow (SPEC §6.1 Blossom special). */
  readonly slow?: SlowEffect;
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
  tint: TINT.blossomMid,
  slow: { speedReduction: 0.4, durationS: 2 },
};

/** Numeric `Tower.typeId` (ui8) — the index stored in the ECS component. */
export const TowerType = {
  Blossom: 0,
} as const;

export type TowerTypeId = (typeof TowerType)[keyof typeof TowerType];

/** Base upgrade level for a freshly placed tower (SPEC §6.1 L1 = base). */
export const BASE_TOWER_LEVEL = 1;

/** Lookup by string id. */
export const TOWERS: Readonly<Record<string, TowerConfig>> = {
  blossom: BLOSSOM,
};

/** Lookup by numeric `Tower.typeId` (what factories/systems carry). */
export const TOWER_BY_TYPE: Readonly<Record<number, TowerConfig>> = {
  [TowerType.Blossom]: BLOSSOM,
};
