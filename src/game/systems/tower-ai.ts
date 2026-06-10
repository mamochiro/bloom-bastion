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
import { TOWER_BY_TYPE, towerLevelStats } from "../config/towers";
import { isSimPaused } from "../ecs/game-state";
import { createProjectile } from "../entities/create-projectile";
import { CELL } from "../map/coords";

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

    // Fire with the current level's damage + special bits.
    createProjectile(world, tx, ty, bestEid, stats.damage, stats.special);
    Tower.cooldown[tower] = stats.cooldown;
    Tower.lastTarget[tower] = bestEid;
  }
  return world;
};
