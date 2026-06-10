/**
 * TowerAISystem (SPEC §4.2 slot 4) — cooldown + target selection + firing.
 *
 * Per tower: tick the fire cooldown; when ready, scan live enemies for the
 * NEAREST one inside range and launch a homing projectile at it. The scan is a
 * single zero-alloc min-distance pass over `enemyQuery` (squared distances — no
 * sqrt, no array, no sort).
 */
import { hasComponent } from "bitecs";
import {
  Enemy,
  Health,
  Minion,
  Position,
  Renderable,
  Tower,
  type World,
  enemyQuery,
  minionQuery,
  towerQuery,
} from "../../engine/ecs/world";
import { gameTime } from "../../engine/loop";
import type { System } from "../../engine/loop";
import { BEAM_WIDTH_TILES, PIERCE_MAX_TARGETS, SPECIAL } from "../config/combat";
import { ENEMY_FLAGS } from "../config/enemies";
import {
  BEE_ATTACK_INTERVAL_S,
  BEE_ATTACK_RANGE_PX,
  BEE_SEEK_RADIUS_PX,
  BEE_SPEED_PX,
  HIVE_COUNT_RADIUS_PX,
  hiveHasQueen,
  swarmSize,
} from "../config/hive";
import { spriteId } from "../config/sprites";
import { TOWER_BY_TYPE, TowerType, towerLevelStats } from "../config/towers";
import { applyDamage } from "../ecs/apply-damage";
import { isSimPaused } from "../ecs/game-state";
import { releaseMinion, spawnBee, spawnQueen } from "../entities/create-minion";
import { createProjectile } from "../entities/create-projectile";
import { CELL } from "../map/coords";

// Minion sprite ids (queen vs worker) + squared radii — resolved once.
const QUEEN_SPRITE = spriteId("minion-queen");
const HIVE_COUNT_RADIUS_SQ = HIVE_COUNT_RADIUS_PX * HIVE_COUNT_RADIUS_PX;
const BEE_SEEK_RADIUS_SQ = BEE_SEEK_RADIUS_PX * BEE_SEEK_RADIUS_PX;

/**
 * Hive summon (SPEC §6.1): top up the swarm near (tx,ty) to `swarmSize(level)`
 * worker bees, plus 1 Queen at L3. Bees within HIVE_COUNT_RADIUS count as this
 * hive's swarm (proximity = the patrol approximation; no owner field). Zero-alloc
 * scan + spawn (a cold ~1/sec event).
 */
function hiveSummon(world: World, tx: number, ty: number, level: number): void {
  const minions = minionQuery(world);
  let workers = 0;
  let queens = 0;
  for (let i = 0; i < minions.length; i++) {
    const m = minions[i];
    const dx = Position.x[m] - tx;
    const dy = Position.y[m] - ty;
    if (dx * dx + dy * dy > HIVE_COUNT_RADIUS_SQ) continue;
    if (Renderable.spriteId[m] === QUEEN_SPRITE) queens++;
    else workers++;
  }
  for (let i = workers; i < swarmSize(level); i++) spawnBee(world, tx, ty);
  if (hiveHasQueen(level) && queens < 1) spawnQueen(world, tx, ty);
}

/** A bee's target is valid if it's still a living GROUND enemy. */
function isBeeTarget(world: World, eid: number): boolean {
  return (
    hasComponent(world, Enemy, eid) &&
    Health.current[eid] > 0 &&
    (Enemy.flags[eid] & ENEMY_FLAGS.Flying) === 0
  );
}

/** Nearest living GROUND enemy within BEE_SEEK_RADIUS of (bx,by), or 0. Zero-alloc. */
function seekGround(world: World, bx: number, by: number): number {
  const enemies = enemyQuery(world);
  let best = 0;
  let bestSq = BEE_SEEK_RADIUS_SQ;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (Health.current[e] <= 0 || (Enemy.flags[e] & ENEMY_FLAGS.Flying) !== 0) continue;
    const dx = Position.x[e] - bx;
    const dy = Position.y[e] - by;
    const d = dx * dx + dy * dy;
    if (d <= bestSq) {
      bestSq = d;
      best = e;
    }
  }
  return best;
}

// Pierce scratch — the up-to-(PIERCE_MAX_TARGETS−1) extra beam targets along the
// firing line, ordered by distance from the tower. Reused → zero per-shot alloc.
const _pierceEid = new Int32Array(PIERCE_MAX_TARGETS - 1);
const _pierceProj = new Float64Array(PIERCE_MAX_TARGETS - 1);
const BEAM_WIDTH_PX = BEAM_WIDTH_TILES * CELL;

/**
 * Pierce (Luna L2+): scan `enemies` for the up-to-(PIERCE_MAX_TARGETS−1) enemies
 * (excluding `primary`) lying on the firing line from (tx,ty) through the primary
 * — within `rangePx` along the ray and within BEAM_WIDTH_PX perpendicular. Fills
 * the module scratch sorted by along-ray distance. Returns how many were found.
 * Zero-alloc. (Resolved HERE because the ray origin — the tower — is lost by the
 * time the projectile lands; see report flag.)
 */
function scanPierce(
  enemies: ArrayLike<number>,
  primary: number,
  tx: number,
  ty: number,
  px: number,
  py: number,
  rangePx: number,
): number {
  const rdx = px - tx;
  const rdy = py - ty;
  const rlen = Math.hypot(rdx, rdy);
  const n = _pierceEid.length;
  for (let s = 0; s < n; s++) {
    _pierceEid[s] = -1;
    _pierceProj[s] = Number.POSITIVE_INFINITY;
  }
  if (rlen === 0) return 0;
  const ux = rdx / rlen;
  const uy = rdy / rlen;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e === primary || Health.current[e] <= 0) continue;
    const ex = Position.x[e] - tx;
    const ey = Position.y[e] - ty;
    const proj = ex * ux + ey * uy; // distance along the ray
    if (proj <= 0 || proj > rangePx) continue; // behind tower or beyond range
    const perp = Math.abs(ex * -uy + ey * ux); // perpendicular distance to the ray
    if (perp > BEAM_WIDTH_PX) continue;
    // Insert into the sorted (by along-ray distance) top-(n) scratch.
    let pos = n;
    for (let s = 0; s < n; s++) {
      if (proj < _pierceProj[s]) {
        pos = s;
        break;
      }
    }
    if (pos < n) {
      for (let s = n - 1; s > pos; s--) {
        _pierceProj[s] = _pierceProj[s - 1];
        _pierceEid[s] = _pierceEid[s - 1];
      }
      _pierceProj[pos] = proj;
      _pierceEid[pos] = e;
    }
  }
  let found = 0;
  for (let s = 0; s < n; s++) if (_pierceEid[s] >= 0) found++;
  return found;
}

export const TowerAISystem: System = (world: World, dt: number): World => {
  if (isSimPaused()) return world; // frozen on win/lose
  const towers = towerQuery(world);
  const enemies = enemyQuery(world);

  for (let ti = 0; ti < towers.length; ti++) {
    const tower = towers[ti];

    // Tick cooldown; bail until the tower is ready to fire.
    Tower.cooldown[tower] -= dt;
    if (Tower.cooldown[tower] > 0) continue;

    const typeId = Tower.typeId[tower];
    if (!TOWER_BY_TYPE[typeId]) continue;
    // Current-level stats (SPEC §6.1 upgrades) — damage/range/cooldown/special.
    const stats = towerLevelStats(typeId, Tower.level[tower]);

    const tx = Position.x[tower];
    const ty = Position.y[tower];

    // 🐝 Hive (summoner): top up the swarm instead of firing. cooldown = top-up
    // interval. (No projectile/range/targeting for this tower.)
    if (typeId === TowerType.Hive) {
      hiveSummon(world, tx, ty, Tower.level[tower]);
      Tower.cooldown[tower] = stats.cooldown;
      continue;
    }

    const rangePx = stats.range * CELL;
    const rangeSq = rangePx * rangePx;

    // Zero-alloc nearest-in-range scan.
    let bestEid = -1;
    let bestDistSq = rangeSq;
    for (let ei = 0; ei < enemies.length; ei++) {
      const e = enemies[ei];
      if (Health.current[e] <= 0) continue; // already dying this frame
      const dx = Position.x[e] - tx;
      const dy = Position.y[e] - ty;
      const distSq = dx * dx + dy * dy;
      if (distSq <= bestDistSq) {
        bestDistSq = distSq;
        bestEid = e;
      }
    }

    if (bestEid < 0) continue; // nothing in range — stay ready (cooldown ≤ 0)

    // Beams carry AntiArmor (+Crit); the Pierce bit is TowerAI-only (resolved
    // into multiple shots here), so strip it from the projectile's special.
    const projSpecial = stats.special & ~SPECIAL.Pierce;
    // Fire at the primary target.
    createProjectile(world, tx, ty, bestEid, stats.damage, projSpecial);
    // Pierce (Luna L2+): also fire at up to 2 more enemies along the firing line.
    if ((stats.special & SPECIAL.Pierce) !== 0) {
      const k = scanPierce(
        enemies,
        bestEid,
        tx,
        ty,
        Position.x[bestEid],
        Position.y[bestEid],
        rangePx,
      );
      for (let s = 0; s < k; s++) {
        createProjectile(world, tx, ty, _pierceEid[s], stats.damage, projSpecial);
      }
    }
    Tower.cooldown[tower] = stats.cooldown;
    Tower.lastTarget[tower] = bestEid;
  }

  // --- Bee AI sub-pass (Hive minions) — same slot 4, no new §4.2 slot --------
  // Iterate backward (releasing on expiry swap-pops the query). Zero-alloc.
  const minions = minionQuery(world);
  const now = gameTime();
  for (let mi = minions.length - 1; mi >= 0; mi--) {
    const m = minions[mi];
    if (now >= Minion.expiresAt[m]) {
      releaseMinion(world, m); // lifetime over → back to the pool
      continue;
    }

    // (Re)acquire a target if the current one is gone / dead / now flying.
    let tgt = Minion.targetEid[m];
    if (tgt === 0 || !isBeeTarget(world, tgt)) {
      tgt = seekGround(world, Position.x[m], Position.y[m]);
      Minion.targetEid[m] = tgt;
    }
    if (tgt === 0) continue; // no enemy nearby → idle in place

    const dx = Position.x[tgt] - Position.x[m];
    const dy = Position.y[tgt] - Position.y[m];
    const dist = Math.hypot(dx, dy);
    if (dist > BEE_ATTACK_RANGE_PX) {
      // Free-flight toward the target (NOT flow-field); clamp to avoid overshoot.
      const step = Math.min(BEE_SPEED_PX * dt, dist);
      Position.x[m] += (dx / dist) * step;
      Position.y[m] += (dy / dist) * step;
    } else if (now >= Minion.attackCdUntil[m]) {
      // In range + off cooldown → bite (via the shared chokepoint: dodge/armor).
      applyDamage(tgt, Minion.damage[m]);
      Minion.attackCdUntil[m] = now + BEE_ATTACK_INTERVAL_S;
    }
  }
  return world;
};
