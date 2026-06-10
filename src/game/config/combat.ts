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
 * Chain lightning (Stormcloud, SPEC §6.1: "Chains to 3 nearest enemies, 50%
 * damage each"). `MAX_TARGETS`/`FALLOFF` are LOCKED to §6.1; `RADIUS_TILES` is
 * NOT-LOCKED — §6.1 gives no arc range, so 2.5 tiles is a slice value (flag).
 *
 * Interpretation of "3 nearest @ 50%": primary takes FULL damage, then up to
 * (MAX_TARGETS − 1) = 2 additional nearest enemies each take FALLOFF damage —
 * 3 enemies total. (Matches L2 "Chain +1 target".) Like the slow magnitudes,
 * these live here as the single chain source this slice; carry them on the
 * projectile when a second chainer exists.
 */
export const CHAIN_MAX_TARGETS = 3;
export const CHAIN_FALLOFF = 0.5;
export const CHAIN_RADIUS_TILES = 2.5;

/**
 * Overcharge stun (Stormcloud L3, SPEC §6.1 "20% stun chance per hit"). CHANCE
 * is LOCKED to §6.1; DURATION is NOT-LOCKED (§6.1 gives no number) — 1.0s flag.
 * The roll uses the EXISTING injectable damage RNG (apply-damage `damageRoll`).
 */
export const STUN_CHANCE = 0.2;
export const STUN_DURATION_S = 1.0;

/**
 * Petal Storm AoE (Blossom L3, SPEC §6.1 "Multi-target (3), AoE on hit"). The
 * primary's damage + 40%/2s slow also splash to up to PETAL_MAX_TARGETS nearest
 * OTHER enemies within PETAL_RADIUS. Both are NOT-LOCKED (§6.1 gives no radius)
 * — radius 1.0 tile, 3 targets are slice values (flag). Reuses the nearest-N scan.
 */
export const PETAL_MAX_TARGETS = 3;
export const PETAL_RADIUS_TILES = 1.0;

/**
 * AoE splash (Sugar Cannon, SPEC §6.1 "1.5-tile splash radius"). UNCAPPED — hits
 * EVERY ground enemy in radius (not the capped nearest-N). L2 "Bigger Boom"
 * grows it to 2.0 tiles. No damage falloff (NOT-LOCKED: §6.1 gives none — full
 * damage to all). L3 "Sticky Sugar" adds a short slow to splashed enemies for
 * STICKY_SLOW_DURATION_S — reusing the shared slow path, so the *reduction* is
 * the game's single global SLOW_REDUCTION (40%); SPEC's "20%" would need a
 * per-enemy slow-magnitude field (deferred) — NOT-LOCKED, flagged.
 */
export const SPLASH_RADIUS_TILES = 1.5;
export const SPLASH_RADIUS_BIG_TILES = 2.0;
export const STICKY_SLOW_DURATION_S = 1.0;

/**
 * Projectile special-effect bit flags, packed into `Projectile.special` (ui8).
 * The TowerAI sets them from the tower's CURRENT-LEVEL stats; DamageSystem reads
 * them on landing. Distinct bits so a projectile can carry several effects.
 */
export const SPECIAL = {
  /** No on-hit effect. */
  None: 0,
  /** Applies the Blossom slow on hit. */
  Slow: 1 << 0,
  /** Arcs chain lightning to nearby enemies on hit (Stormcloud). */
  Chain: 1 << 1,
  /** +1 chain target (Stormcloud L2 "Static Field"). */
  ChainPlus: 1 << 2,
  /** 20% stun chance on hit (Stormcloud L3 "Overcharge"). */
  Stun: 1 << 3,
  /** AoE damage + slow splash (Blossom L3 "Petal Storm"). */
  AoeSlow: 1 << 4,
  /** Uncapped radius AoE splash to ground enemies (Sugar Cannon). */
  Splash: 1 << 5,
  /** Bigger splash radius (Sugar Cannon L2 "Bigger Boom": 1.5→2.0 tiles). */
  SplashBig: 1 << 6,
  /** Splash also applies a short slow (Sugar Cannon L3 "Sticky Sugar"). */
  SplashSlow: 1 << 7,
} as const;
