/**
 * Combat slice constants.
 *
 * Some of these are SPEC §6-locked (the slow magnitude/duration are Blossom's
 * special), others are slice-chosen because SPEC does not pin them — those are
 * marked NOT-LOCKED and should be revisited when projectiles get real art/feel.
 */

/**
 * Projectile travel speed, px/s. NOT-LOCKED — SPEC §6 gives no projectile speed.
 * 420px/s ≈ 7 tiles/s: fast enough to read as a shot, slow enough to see it fly.
 */
export const PROJECTILE_SPEED = 420;

/**
 * Distance (px) at which a homing projectile counts as a hit. NOT-LOCKED — slice
 * value. Half an enemy radius (enemy shape r=14) so it visually overlaps.
 */
export const HIT_RADIUS = 8;

/**
 * Slow applied by Blossom (SPEC §6.1: "40% speed reduction, 2s"). LOCKED to §6.
 * Single slow source this slice; when more slowers exist, carry magnitude on the
 * projectile (or a Status magnitude field) instead of these module constants.
 */
export const SLOW_REDUCTION = 0.4;
export const SLOW_DURATION_S = 2;

/**
 * Projectile special-effect bit flags, packed into `Projectile.special` (ui8).
 * The TowerAI sets them from tower config; DamageSystem reads them on landing.
 */
export const SPECIAL = {
  /** No on-hit effect. */
  None: 0,
  /** Applies the Blossom slow on hit. */
  Slow: 1 << 0,
} as const;
