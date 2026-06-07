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
import { TINT, type Tint } from "./tokens";

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
  /** Atlas sprite key → `Renderable.spriteId`. */
  readonly sprite: SpriteKey;
  /** Packed design-token tint → `Renderable.tint`. */
  readonly tint: Tint;
}

/** 🐛 Grub — SPEC §6.2: HP 60, Speed 1.0, Reward 8g, no special. */
const GRUB: EnemyConfig = {
  id: "grub",
  name: "Grub",
  hp: 60,
  speed: 1.0,
  reward: 8,
  sprite: "enemy-grub",
  tint: TINT.shadeGlow,
};

/** Numeric `Enemy.typeId` (ui8) — the index stored in the ECS component. */
export const EnemyType = {
  Grub: 0,
} as const;

export type EnemyTypeId = (typeof EnemyType)[keyof typeof EnemyType];

/** Lookup by string id. */
export const ENEMIES: Readonly<Record<string, EnemyConfig>> = {
  grub: GRUB,
};

/** Lookup by numeric `Enemy.typeId` (what factories/systems carry). */
export const ENEMY_BY_TYPE: Readonly<Record<number, EnemyConfig>> = {
  [EnemyType.Grub]: GRUB,
};
