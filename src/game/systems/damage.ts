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
  Renderable,
  Status,
  type World,
  enemyQuery,
} from "../../engine/ecs/world";
import { gameTime } from "../../engine/loop";
import type { System } from "../../engine/loop";
import { COST_BLOCKED, flowField, flowIndexAt } from "../../engine/pathfinding/flow-field";
import {
  ANTI_ARMOR_MULT,
  CHAIN_FALLOFF,
  CHAIN_RADIUS_TILES,
  CRIT_CHANCE,
  CRIT_MULT,
  PETAL_MAX_TARGETS,
  PETAL_RADIUS_TILES,
  PUSH_BIG_TILES,
  PUSH_TILES,
  SLOW_DURATION_S,
  SPECIAL,
  SPLASH_RADIUS_BIG_TILES,
  SPLASH_RADIUS_TILES,
  STICKY_SLOW_DURATION_S,
  STUN_CHANCE,
  STUN_DURATION_S,
  TSUNAMI_HALF_WIDTH_TILES,
  TSUNAMI_LENGTH_TILES,
} from "../config/combat";
import { ENEMY_BY_TYPE, ENEMY_FLAGS, EnemyType } from "../config/enemies";
import { TINT } from "../config/tokens";
import { applyDamage, damageRoll, isArmored } from "../ecs/apply-damage";
import { hitQuery } from "../ecs/components";
import { isSimPaused } from "../ecs/game-state";
import { spawnEnemy } from "../entities/create-enemy";
import { releaseProjectile } from "../entities/create-projectile";
import { CELL } from "../map/coords";
import { costGrid } from "../map/level-1";
import { flashEntity, spawnBurst } from "../vfx";

const CHAIN_RADIUS_SQ = (CHAIN_RADIUS_TILES * CELL) ** 2;
const PETAL_RADIUS_SQ = (PETAL_RADIUS_TILES * CELL) ** 2;
const SPLASH_RADIUS_SQ = (SPLASH_RADIUS_TILES * CELL) ** 2;
const SPLASH_RADIUS_BIG_SQ = (SPLASH_RADIUS_BIG_TILES * CELL) ** 2;

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
    if (phase.setFlying) {
      Enemy.flags[eid] |= ENEMY_FLAGS.Flying; // Neon Dragon P2 takes flight
      // One-time enrage burst + PERSISTENT enraged-red base tint (the berserk
      // 'tell'). baseTint survives the transient hit-flash — the flash briefly
      // overrides, then returns to this red (not 0). Fire-once via the phase flag.
      spawnBurst(Position.x[eid], Position.y[eid], TINT.shadeCore, 40);
      Renderable.baseTint[eid] = TINT.danger;
    }
    if (phase.summonGrubs) {
      for (let k = 0; k < phase.summonGrubs; k++) {
        // Fan out slightly so the summoned grubs don't perfectly overlap.
        spawnEnemy(world, EnemyType.Grub, Position.x[eid] - k * 6, Position.y[eid]);
      }
    }
  }
}

// Nearest-N scratch (max 3) — reused across calls so the scans never allocate.
const MAX_N = 3;
const _nearEid = new Int32Array(MAX_N);
const _nearDist = new Float64Array(MAX_N);

/**
 * Fill `_nearEid[0..return-1]` with the up-to-`n` nearest live OTHER enemies
 * within `radiusSq` of (`px`,`py`), sorted by distance. Zero-alloc (module
 * scratch + insertion into ≤3 slots). Returns how many were found.
 */
function findNearest(
  world: World,
  primary: number,
  px: number,
  py: number,
  radiusSq: number,
  n: number,
): number {
  for (let s = 0; s < n; s++) {
    _nearEid[s] = -1;
    _nearDist[s] = Number.POSITIVE_INFINITY;
  }
  const enemies = enemyQuery(world);
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e === primary || Health.current[e] <= 0) continue;
    const dx = Position.x[e] - px;
    const dy = Position.y[e] - py;
    const d = dx * dx + dy * dy;
    if (d > radiusSq) continue;
    // Insertion into the sorted top-n.
    let pos = n;
    for (let s = 0; s < n; s++) {
      if (d < _nearDist[s]) {
        pos = s;
        break;
      }
    }
    if (pos < n) {
      for (let s = n - 1; s > pos; s--) {
        _nearDist[s] = _nearDist[s - 1];
        _nearEid[s] = _nearEid[s - 1];
      }
      _nearDist[pos] = d;
      _nearEid[pos] = e;
    }
  }
  let found = 0;
  for (let s = 0; s < n; s++) if (_nearEid[s] >= 0) found++;
  return found;
}

/**
 * Chain lightning (Stormcloud): arc `baseDamage * CHAIN_FALLOFF` to the
 * `extraTargets` nearest OTHER enemies within `CHAIN_RADIUS` (2 at L1, 3 with
 * Static Field). Primary excluded → no double-hit; arcs are distinct.
 */
function chainLightning(
  world: World,
  primary: number,
  baseDamage: number,
  extraTargets: number,
): void {
  const k = findNearest(
    world,
    primary,
    Position.x[primary],
    Position.y[primary],
    CHAIN_RADIUS_SQ,
    extraTargets,
  );
  const chainDamage = baseDamage * CHAIN_FALLOFF;
  for (let s = 0; s < k; s++) applyDamage(_nearEid[s], chainDamage);
}

/**
 * Petal Storm (Blossom L3): the primary's `damage` + 40%/2s slow splash to the
 * up-to-`PETAL_MAX_TARGETS` nearest OTHER enemies within `PETAL_RADIUS`.
 */
function petalStorm(world: World, primary: number, damage: number, until: number): void {
  const k = findNearest(
    world,
    primary,
    Position.x[primary],
    Position.y[primary],
    PETAL_RADIUS_SQ,
    PETAL_MAX_TARGETS,
  );
  for (let s = 0; s < k; s++) {
    const e = _nearEid[s];
    applyDamage(e, damage);
    Status.slowedUntil[e] = until;
  }
}

/**
 * AoE splash (Sugar Cannon): full `damage` to EVERY ground enemy within
 * `radiusSq` of the primary — UNCAPPED (a direct enemyQuery scan, NOT the
 * capped nearest-N scratch). No damage falloff. The primary already took its
 * direct hit, so it's skipped. Flying enemies are skipped (ground candy splash,
 * matching Meteor's "AoE skips fliers"). `slowUntil > 0` (Sticky Sugar) also
 * stamps the shared slow on each splashed enemy. Zero-alloc.
 */
function aoeSplash(
  world: World,
  primary: number,
  damage: number,
  radiusSq: number,
  slowUntil: number,
): void {
  const px = Position.x[primary];
  const py = Position.y[primary];
  const enemies = enemyQuery(world);
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e === primary || Health.current[e] <= 0) continue;
    if ((Enemy.flags[e] & ENEMY_FLAGS.Flying) !== 0) continue; // ground splash skips fliers
    const dx = Position.x[e] - px;
    const dy = Position.y[e] - py;
    if (dx * dx + dy * dy > radiusSq) continue;
    applyDamage(e, damage);
    if (slowUntil > 0) Status.slowedUntil[e] = slowUntil;
  }
}

/**
 * Knockback (Bubbler): shove `eid` `pushTiles` BACKWARD along its reverse
 * flow-field (the opposite of the direction PathFollow moves it). Applies to
 * fliers too (a water shove, not a ground splash). Zero-alloc.
 *
 * CLAMP (all-or-nothing): apply the FULL push only if the landing point is
 * on-map AND not a blocked cell; otherwise skip (enemy stays). This covers the
 * edges — pushing past the spawn / into a wall / off-map → no move.
 */
function pushBack(eid: number, pushTiles: number): void {
  const x = Position.x[eid];
  const y = Position.y[eid];
  const i = flowIndexAt(x, y);
  if (i < 0) return; // off-field
  const dx = flowField[i * 2];
  const dy = flowField[i * 2 + 1];
  if (dx === 0 && dy === 0) return; // no flow direction (goal/blocked) → no push
  const pushPx = pushTiles * CELL;
  const nx = x - dx * pushPx; // opposite the forward flow
  const ny = y - dy * pushPx;
  const ni = flowIndexAt(nx, ny);
  if (ni < 0 || costGrid[ni] >= COST_BLOCKED) return; // off-map / wall → skip
  Position.x[eid] = nx;
  Position.y[eid] = ny;
}

const TSUNAMI_HALF_WIDTH_PX = TSUNAMI_HALF_WIDTH_TILES * CELL;
const TSUNAMI_LENGTH_PX = TSUNAMI_LENGTH_TILES * CELL;

/**
 * Tsunami line (Bubbler L3): UNCAPPED — hit every GROUND enemy on the lane line
 * through the primary (axis = the flow-field direction at the primary's cell;
 * "front row" = the lane). Each takes `damage` + slow + `pushTiles` knockback.
 * The primary is excluded (it already took the direct hit). Zero-alloc inline
 * scan. FLAG: line is along the lane axis through the target (computable at
 * hit-time without the tower origin), full lane width, bounded by TSUNAMI_LENGTH.
 */
function tsunamiLine(
  world: World,
  primary: number,
  damage: number,
  slowUntil: number,
  pushTiles: number,
): void {
  const px = Position.x[primary];
  const py = Position.y[primary];
  const i = flowIndexAt(px, py);
  if (i < 0) return;
  let ax = flowField[i * 2];
  let ay = flowField[i * 2 + 1];
  if (ax === 0 && ay === 0) {
    ax = 1; // fallback: the lane runs +x (near the goal the flow is (0,0))
    ay = 0;
  }
  const enemies = enemyQuery(world);
  for (let n = 0; n < enemies.length; n++) {
    const e = enemies[n];
    if (e === primary || Health.current[e] <= 0) continue;
    if ((Enemy.flags[e] & ENEMY_FLAGS.Flying) !== 0) continue; // ground only
    const rx = Position.x[e] - px;
    const ry = Position.y[e] - py;
    const along = rx * ax + ry * ay; // signed distance along the lane axis
    const perp = Math.abs(rx * -ay + ry * ax); // perpendicular distance to the line
    if (perp > TSUNAMI_HALF_WIDTH_PX || along > TSUNAMI_LENGTH_PX || along < -TSUNAMI_LENGTH_PX)
      continue;
    applyDamage(e, damage);
    if (slowUntil > 0) Status.slowedUntil[e] = slowUntil;
    pushBack(e, pushTiles);
  }
}

export const DamageSystem: System = (world: World, _dt: number): World => {
  if (isSimPaused()) return world; // frozen on win/lose
  const hits = hitQuery(world);
  for (let i = hits.length - 1; i >= 0; i--) {
    const proj = hits[i];
    const target = Projectile.targetId[proj];
    const special = Projectile.special[proj];

    if (hasComponent(world, Health, target)) {
      let damage = Projectile.damage[proj];
      // Luna AntiArmor (+30% vs armored) then Moonburst crit (×2, 25% via the
      // shared damage RNG) — applied PRE-armor so Luna is net-stronger into armor;
      // crit rolls per projectile (so per-target across a pierce). FLAGGED order.
      if ((special & SPECIAL.AntiArmor) !== 0 && isArmored(target)) damage *= ANTI_ARMOR_MULT;
      if ((special & SPECIAL.Crit) !== 0 && damageRoll() < CRIT_CHANCE) damage *= CRIT_MULT;
      // Full damage to the primary (armor-adjusted). Flash only on a hit that
      // actually lands — NOT a Shade dodge / 0-damage (applyDamage returns false).
      if (applyDamage(target, damage)) flashEntity(target);

      const hasStatus = hasComponent(world, Status, target);
      if ((special & SPECIAL.Slow) !== 0 && hasStatus) {
        // Slow magnitude is read by PathFollowSystem (SLOW_REDUCTION); here we
        // only stamp the expiry. Blossom 40%/2s.
        Status.slowedUntil[target] = gameTime() + SLOW_DURATION_S;
      }
      if ((special & SPECIAL.Chain) !== 0) {
        // Primary already took full damage; arc 50% to the nearest others
        // (2 base, +1 with Static Field / ChainPlus).
        chainLightning(world, target, damage, (special & SPECIAL.ChainPlus) !== 0 ? 3 : 2);
      }
      if ((special & SPECIAL.AoeSlow) !== 0) {
        // Petal Storm (Blossom L3): damage + slow splash to nearby enemies.
        petalStorm(world, target, damage, gameTime() + SLOW_DURATION_S);
      }
      if ((special & SPECIAL.Splash) !== 0) {
        // Sugar Cannon: uncapped AoE to ground enemies in radius (1.5/2.0 tiles).
        // Sticky Sugar (SplashSlow) also slows them. Independent of Chain/AoeSlow
        // (distinct bit; only this tower's projectiles carry Splash).
        const radiusSq =
          (special & SPECIAL.SplashBig) !== 0 ? SPLASH_RADIUS_BIG_SQ : SPLASH_RADIUS_SQ;
        const slowUntil =
          (special & SPECIAL.SplashSlow) !== 0 ? gameTime() + STICKY_SLOW_DURATION_S : 0;
        aoeSplash(world, target, damage, radiusSq, slowUntil);
      }
      if ((special & SPECIAL.Stun) !== 0 && hasStatus && damageRoll() < STUN_CHANCE) {
        // Overcharge (Stormcloud L3): 20% stun. Reuses the Freeze stun path
        // (PathFollow honours Status.stunnedUntil).
        Status.stunnedUntil[target] = gameTime() + STUN_DURATION_S;
      }
      if ((special & SPECIAL.Push) !== 0) {
        // Bubbler knockback: shove the target back (0.5 base, 1.0 with Tidal Wave).
        const pushTiles = (special & SPECIAL.PushBig) !== 0 ? PUSH_BIG_TILES : PUSH_TILES;
        // Tsunami (Bubbler L3): line the OTHER lane enemies BEFORE pushing the
        // primary, so the line axis is centred on the primary's original cell.
        if ((special & SPECIAL.Line) !== 0) {
          tsunamiLine(world, target, damage, gameTime() + SLOW_DURATION_S, pushTiles);
        }
        pushBack(target, pushTiles);
      }
      // Boss phase transitions (SPEC §6.2) — no-op for non-boss enemies.
      checkBossPhases(world, target);
    }

    releaseProjectile(world, proj);
  }
  return world;
};
