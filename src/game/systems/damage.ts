/**
 * DamageSystem (SPEC §4.2 slot 6) — apply landed projectiles' effects.
 *
 * Per `[Projectile, Hit]`: deal damage to the primary target (armor-adjusted),
 * apply the shot's specials — SLOW (re-arm the target's slow timer) and/or CHAIN
 * (arc 50% damage to up to 2 nearby enemies) — then recycle the projectile. The
 * chain resolves HERE (slot 6), reusing the projectile→Hit path; no new §4.2
 * slot. DoT/stun hooks land later.
 *
 * Iterates backward (releasing strips `Hit`, swap-popping the query array).
 * Zero-alloc: armor lookup + a scalar top-2 chain scan, no arrays/sorts.
 */
import { hasComponent } from "bitecs";
import {
  Enemy,
  Health,
  Position,
  Projectile,
  Status,
  type World,
  enemyQuery,
} from "../../engine/ecs/world";
import { gameTime } from "../../engine/loop";
import type { System } from "../../engine/loop";
import { CHAIN_FALLOFF, CHAIN_RADIUS_TILES, SLOW_DURATION_S, SPECIAL } from "../config/combat";
import { ENEMY_BY_TYPE, ENEMY_FLAGS, EnemyType } from "../config/enemies";
import { applyDamage } from "../ecs/apply-damage";
import { hitQuery } from "../ecs/components";
import { isSimPaused } from "../ecs/game-state";
import { spawnEnemy } from "../entities/create-enemy";
import { releaseProjectile } from "../entities/create-projectile";
import { CELL } from "../map/coords";

const CHAIN_RADIUS_SQ = (CHAIN_RADIUS_TILES * CELL) ** 2;

/**
 * Boss HP-threshold phases (SPEC §6.2). After a boss takes damage, trigger any
 * not-yet-fired phase whose threshold is now crossed: set its `Enemy.flags` bit
 * (so it fires ONCE), summon grubs, and mark slow-immunity. Speed multipliers
 * are read from the flags by PathFollowSystem. The x4 summon is a cold one-time
 * event; the rest is zero-alloc bit ops.
 */
function checkBossPhases(world: World, eid: number): void {
  const cfg = ENEMY_BY_TYPE[Enemy.typeId[eid]];
  if (!cfg?.phases) return;

  const hpFrac = Health.current[eid] / Health.max[eid];
  for (let p = 0; p < cfg.phases.length; p++) {
    const doneBit = p === 0 ? ENEMY_FLAGS.Phase1Done : ENEMY_FLAGS.Phase2Done;
    if ((Enemy.flags[eid] & doneBit) !== 0) continue; // already fired
    if (hpFrac > cfg.phases[p].hpFrac) continue; // threshold not crossed

    const phase = cfg.phases[p];
    Enemy.flags[eid] |= doneBit;
    if (phase.slowImmune) Enemy.flags[eid] |= ENEMY_FLAGS.SlowImmune;
    if (phase.setFlying) Enemy.flags[eid] |= ENEMY_FLAGS.Flying; // Neon Dragon P2 takes flight
    if (phase.summonGrubs) {
      for (let k = 0; k < phase.summonGrubs; k++) {
        // Fan out slightly so the summoned grubs don't perfectly overlap.
        spawnEnemy(world, EnemyType.Grub, Position.x[eid] - k * 6, Position.y[eid]);
      }
    }
  }
}

/**
 * Chain lightning (Stormcloud): arc `baseDamage * CHAIN_FALLOFF` to the up-to-2
 * nearest OTHER live enemies within `CHAIN_RADIUS` of the primary. Zero-alloc
 * top-2 scan (scalars, no array/sort); the primary is excluded so it's never
 * double-hit, and the two arcs are distinct enemies.
 */
function chainLightning(world: World, primary: number, baseDamage: number): void {
  const px = Position.x[primary];
  const py = Position.y[primary];
  let aEid = -1;
  let aDist = Number.POSITIVE_INFINITY;
  let bEid = -1;
  let bDist = Number.POSITIVE_INFINITY;

  const enemies = enemyQuery(world);
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e === primary || Health.current[e] <= 0) continue;
    const dx = Position.x[e] - px;
    const dy = Position.y[e] - py;
    const d = dx * dx + dy * dy;
    if (d > CHAIN_RADIUS_SQ) continue;
    if (d < aDist) {
      bEid = aEid;
      bDist = aDist;
      aEid = e;
      aDist = d;
    } else if (d < bDist) {
      bEid = e;
      bDist = d;
    }
  }

  const chainDamage = baseDamage * CHAIN_FALLOFF;
  if (aEid >= 0) applyDamage(aEid, chainDamage);
  if (bEid >= 0) applyDamage(bEid, chainDamage);
}

export const DamageSystem: System = (world: World, _dt: number): World => {
  if (isSimPaused()) return world; // frozen on win/lose
  const hits = hitQuery(world);
  for (let i = hits.length - 1; i >= 0; i--) {
    const proj = hits[i];
    const target = Projectile.targetId[proj];
    const special = Projectile.special[proj];

    if (hasComponent(world, Health, target)) {
      const damage = Projectile.damage[proj];
      applyDamage(target, damage); // full damage to the primary (armor-adjusted)

      if ((special & SPECIAL.Slow) !== 0 && hasComponent(world, Status, target)) {
        // Slow magnitude is read by PathFollowSystem (SLOW_REDUCTION); here we
        // only stamp the expiry. Single slow source this slice (Blossom).
        Status.slowedUntil[target] = gameTime() + SLOW_DURATION_S;
      }
      if ((special & SPECIAL.Chain) !== 0) {
        // Primary already took full damage; arc 50% to the 2 nearest others.
        chainLightning(world, target, damage);
      }
      // Boss phase transitions (SPEC §6.2) — no-op for non-boss enemies.
      checkBossPhases(world, target);
    }

    releaseProjectile(world, proj);
  }
  return world;
};
