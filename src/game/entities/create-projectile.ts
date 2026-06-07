/**
 * Projectile factory — pooled (SPEC §4.4). `createProjectile` acquires from
 * `projectilePool` and initialises a homing shot; `releaseProjectile` strips its
 * components (including the `Hit` tag) and returns the eid to the pool. Like the
 * enemy pool, eids belong to the engine `world` singleton.
 */
import { addComponent, removeComponent } from "bitecs";
import { Position, Projectile, Renderable, type World } from "../../engine/ecs/world";
import { projectilePool } from "../../engine/pool/pools";
import { SPECIAL } from "../config/combat";
import { spriteId } from "../config/sprites";
import { TINT } from "../config/tokens";
import { Hit } from "../ecs/components";

/**
 * Spawn a homing projectile at (`fromX`, `fromY`) aimed at `targetEid`.
 *
 * @param special bitmask of `SPECIAL` effects applied on hit (e.g. slow).
 * @returns the new entity id, or `-1` if the projectile pool is exhausted.
 */
export function createProjectile(
  world: World,
  fromX: number,
  fromY: number,
  targetEid: number,
  damage: number,
  special: number = SPECIAL.None,
): number {
  const eid = projectilePool.acquire();
  if (eid === undefined) return -1; // pool exhausted — skip, never grow

  addComponent(world, Position, eid);
  Position.x[eid] = fromX;
  Position.y[eid] = fromY;

  addComponent(world, Projectile, eid);
  Projectile.damage[eid] = damage;
  Projectile.targetId[eid] = targetEid;
  Projectile.special[eid] = special;

  addComponent(world, Renderable, eid);
  // RenderSystem keys textures off the sprite registry id (config/sprites.ts).
  Renderable.spriteId[eid] = spriteId("projectile-petal"); // 200
  Renderable.tint[eid] = TINT.blossomLight;

  return eid;
}

/** Return a projectile to the pool: strip components (incl. the `Hit` tag). */
export function releaseProjectile(world: World, eid: number): void {
  removeComponent(world, Position, eid);
  removeComponent(world, Projectile, eid);
  removeComponent(world, Renderable, eid);
  removeComponent(world, Hit, eid);
  projectilePool.release(eid);
}
