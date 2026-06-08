/**
 * PathFollowSystem (SPEC §4.2 slot 3) — moves every flow-field follower one
 * step downhill toward the goal. The flow field (engine, SPEC §4.3) is shared:
 * each enemy just samples its cell's normalised `(dx, dy)` — zero per-entity
 * pathfinding, zero allocation in this loop.
 *
 * Per follower:
 *   i = flowIndexAt(x, y)
 *   i < 0 (off-map)      → stop (velocity 0)
 *   dir == (0,0) at goal → arrived → cost 1 life, then releaseEnemy
 *   else                 → velocity = dir · effectiveSpeed; integrate by dt
 *
 * Slow: while `gameTime() < Status.slowedUntil`, speed is scaled by
 * `(1 - SLOW_REDUCTION)` (Blossom 40%). Iterates backward so releasing at the
 * goal (swap-pop on the query array) never skips a follower.
 */
import {
  Enemy,
  Pathfinder,
  Position,
  Status,
  Velocity,
  type World,
  pathfinderQuery,
} from "../../engine/ecs/world";
import { gameTime } from "../../engine/loop";
import type { System } from "../../engine/loop";
import { flowField, flowIndexAt } from "../../engine/pathfinding/flow-field";
import { SLOW_REDUCTION } from "../config/combat";
import { getDifficultyMods } from "../config/difficulty";
import { ENEMY_BY_TYPE } from "../config/enemies";
import { isSimPaused } from "../ecs/game-state";
import { loseLives } from "../ecs/resources";
import { releaseEnemy } from "../entities/create-enemy";
import { CELL } from "../map/coords";

/**
 * Lives lost when one enemy leaks through to the goal. SPEC §6 only defines the
 * lose condition ("Lives reach 0"), not a per-enemy cost — so 1/leak is a slice
 * default (NOT-LOCKED). Bosses may cost more once content lands.
 */
const LIFE_COST_PER_LEAK = 1;

export const PathFollowSystem: System = (world: World, dt: number): World => {
  if (isSimPaused()) return world; // frozen on win/lose
  const ents = pathfinderQuery(world);
  const now = gameTime();
  const speedMult = getDifficultyMods().speedMult; // active difficulty (SPEC §6.5)
  for (let n = ents.length - 1; n >= 0; n--) {
    const eid = ents[n];
    if (Pathfinder.followFlowField[eid] !== 1) continue;

    // Stunned (Freeze All skill, SPEC §6.4) → frozen in place, no movement.
    if (now < Status.stunnedUntil[eid]) {
      Velocity.vx[eid] = 0;
      Velocity.vy[eid] = 0;
      continue;
    }

    const i = flowIndexAt(Position.x[eid], Position.y[eid]);
    if (i < 0) {
      // Off the field — hold position rather than index out of bounds.
      Velocity.vx[eid] = 0;
      Velocity.vy[eid] = 0;
      continue;
    }

    const dx = flowField[i * 2];
    const dy = flowField[i * 2 + 1];
    if (dx === 0 && dy === 0) {
      // Goal / blocked / unreachable cell. On a clear lane this is the goal:
      // the enemy leaked through — it costs the player a life, then recycle it.
      Velocity.vx[eid] = 0;
      Velocity.vy[eid] = 0;
      loseLives(world, LIFE_COST_PER_LEAK);
      releaseEnemy(world, eid);
      continue;
    }

    const cfg = ENEMY_BY_TYPE[Enemy.typeId[eid]];
    let speedPx = (cfg ? cfg.speed : 0) * CELL * speedMult; // tiles/s → px/s, difficulty-scaled
    if (now < Status.slowedUntil[eid]) speedPx *= 1 - SLOW_REDUCTION;

    const vx = dx * speedPx;
    const vy = dy * speedPx;
    Velocity.vx[eid] = vx;
    Velocity.vy[eid] = vy;
    Position.x[eid] += vx * dt;
    Position.y[eid] += vy * dt;
  }
  return world;
};
