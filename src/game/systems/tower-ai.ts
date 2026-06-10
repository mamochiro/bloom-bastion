/**
 * TowerAISystem (SPEC §4.2 slot 4) — cooldown + target selection + firing.
 *
 * Per tower: tick the fire cooldown; when ready, scan live enemies for the
 * NEAREST one inside range and launch a homing projectile at it. The scan is a
 * single zero-alloc min-distance pass over `enemyQuery` (squared distances — no
 * sqrt, no array, no sort).
 */
import {
  Health,
  Position,
  Tower,
  type World,
  enemyQuery,
  towerQuery,
} from "../../engine/ecs/world";
import type { System } from "../../engine/loop";
import { BEAM_WIDTH_TILES, PIERCE_MAX_TARGETS, SPECIAL } from "../config/combat";
import { TOWER_BY_TYPE, towerLevelStats } from "../config/towers";
import { isSimPaused } from "../ecs/game-state";
import { createProjectile } from "../entities/create-projectile";
import { CELL } from "../map/coords";

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
  return world;
};
