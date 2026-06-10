/**
 * Shared damage application — the ONE place HP is reduced, so armor + dodge
 * (SPEC §6.2) are honoured uniformly by EVERY damage source: projectiles
 * (DamageSystem), chain lightning, and Meteor AoE (skills). Zero-alloc.
 */
import { Enemy, Health } from "../../engine/ecs/world";
import { ENEMY_BY_TYPE } from "../config/enemies";

/**
 * RNG used for the dodge roll. Default `Math.random` at runtime (game-side
 * randomness is fine — this is NOT an orchestration script). Tests stub it via
 * {@link setDamageRng} for determinism; `_reset.ts` resets it between tests.
 */
let _rng: () => number = Math.random;

/** Override the dodge RNG (tests). */
export function setDamageRng(fn: () => number): void {
  _rng = fn;
}

/** Restore the default `Math.random` dodge RNG. */
export function resetDamageRng(): void {
  _rng = Math.random;
}

/**
 * One roll from the shared damage RNG (0..1). Used by on-hit chance effects
 * (Stormcloud L3 stun) so they honour the same injectable/seedable RNG as dodge.
 */
export function damageRoll(): number {
  return _rng();
}

/**
 * Apply `rawDamage` to `eid`.
 *  - Dodge (Shade, §6.2): with `dodgeChance` probability the hit is fully
 *    avoided — 0 damage, no Health change.
 *  - Armor (Snail, §6.2): otherwise effective = raw·(1 − armor).
 *
 * @returns true if any damage was actually dealt (caller uses this to gate the
 *          hit-flash VFX — no flash on a dodge / 0-damage hit).
 */
export function applyDamage(eid: number, rawDamage: number): boolean {
  const cfg = ENEMY_BY_TYPE[Enemy.typeId[eid]];
  if (cfg?.dodgeChance && _rng() < cfg.dodgeChance) return false; // dodged → no damage
  const armor = cfg?.armor ?? 0;
  const effective = rawDamage * (1 - armor);
  Health.current[eid] -= effective;
  return effective > 0;
}
