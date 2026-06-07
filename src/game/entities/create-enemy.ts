/**
 * Enemy factory — pooled (SPEC §4.4). `spawnEnemy` acquires a recycled entity
 * from `enemyPool` and (re)initialises every component field; `releaseEnemy`
 * strips the components and returns the eid to the pool. Pooled eids belong to
 * the engine `world` singleton (the pool was built on it), so the `world` passed
 * here MUST be that same world.
 *
 * Reset discipline: because eids are recycled, EVERY field a system reads is
 * written on spawn — stale Status timers or Health from a previous life would
 * otherwise leak into the new enemy.
 */
import { addComponent, removeComponent } from "bitecs";
import {
  Enemy,
  Health,
  Pathfinder,
  Position,
  Renderable,
  Status,
  Velocity,
  type World,
} from "../../engine/ecs/world";
import { enemyPool } from "../../engine/pool/pools";
import { ENEMY_BY_TYPE } from "../config/enemies";
import { spriteId } from "../config/sprites";

/**
 * Spawn an enemy of `typeId` at world-pixel (`x`, `y`).
 *
 * @returns the new entity id, or `-1` if the enemy pool is exhausted (no spawn,
 *          no allocation — the caller simply skips this spawn).
 * @throws if `typeId` has no config.
 */
export function spawnEnemy(world: World, typeId: number, x: number, y: number): number {
  const cfg = ENEMY_BY_TYPE[typeId];
  if (!cfg) {
    throw new Error(`spawnEnemy: unknown enemy typeId ${typeId}`);
  }

  const eid = enemyPool.acquire();
  if (eid === undefined) return -1; // pool exhausted — skip, never grow

  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;

  // Velocity is integrated by PathFollowSystem; start at rest.
  addComponent(world, Velocity, eid);
  Velocity.vx[eid] = 0;
  Velocity.vy[eid] = 0;

  addComponent(world, Health, eid);
  Health.current[eid] = cfg.hp;
  Health.max[eid] = cfg.hp;

  addComponent(world, Renderable, eid);
  // RenderSystem keys textures off the sprite registry id (config/sprites.ts),
  // sourced from this enemy's atlas key — grub → "enemy-grub" → 100.
  Renderable.spriteId[eid] = spriteId(cfg.sprite);
  Renderable.tint[eid] = cfg.tint;

  addComponent(world, Enemy, eid);
  Enemy.typeId[eid] = typeId;
  Enemy.pathProgress[eid] = 0;
  Enemy.flags[eid] = 0;

  // Status timers — reset so a recycled eid carries no stale slow/stun/dot.
  addComponent(world, Status, eid);
  Status.slowedUntil[eid] = 0;
  Status.stunnedUntil[eid] = 0;
  Status.dotUntil[eid] = 0;

  // Enemies read the shared flow field (SPEC §4.3).
  addComponent(world, Pathfinder, eid);
  Pathfinder.followFlowField[eid] = 1;

  return eid;
}

/**
 * Despawn an enemy: strip its components (so it matches no query) and return the
 * eid to the pool for reuse. Used by DeathSystem (killed) and PathFollowSystem
 * (reached goal).
 */
export function releaseEnemy(world: World, eid: number): void {
  removeComponent(world, Position, eid);
  removeComponent(world, Velocity, eid);
  removeComponent(world, Health, eid);
  removeComponent(world, Renderable, eid);
  removeComponent(world, Enemy, eid);
  removeComponent(world, Status, eid);
  removeComponent(world, Pathfinder, eid);
  enemyPool.release(eid);
}
