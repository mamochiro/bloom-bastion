/**
 * Minion factory (Hive bees + queen, SPEC §6.1) — pooled (SPEC §4.4). Acquires
 * from `minionPool` and (re)initialises EVERY field; `releaseMinion` returns the
 * eid to the pool (its reset hook strips Minion/Position/Renderable). Pooled eids
 * belong to the engine `world` singleton.
 */
import { addComponent } from "bitecs";
import { Minion, Position, Renderable, type World } from "../../engine/ecs/world";
import { gameTime } from "../../engine/loop";
import { minionPool } from "../../engine/pool/pools";
import { BEE_DAMAGE, BEE_LIFETIME_S, QUEEN_DAMAGE, QUEEN_LIFETIME_S } from "../config/hive";
import { spriteId } from "../config/sprites";

/** Common minion init at (x,y) with `damage`, `lifetimeS`, and atlas `sprite`. */
function spawnMinion(
  world: World,
  x: number,
  y: number,
  damage: number,
  lifetimeS: number,
  sprite: number,
): number {
  const eid = minionPool.acquire();
  if (eid === undefined) return -1; // pool exhausted — skip, never grow

  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;

  addComponent(world, Renderable, eid);
  Renderable.spriteId[eid] = sprite;
  Renderable.tint[eid] = 0; // FX-only; native sprite colours
  Renderable.baseTint[eid] = 0;

  addComponent(world, Minion, eid);
  Minion.targetEid[eid] = 0; // none → seek
  Minion.expiresAt[eid] = gameTime() + lifetimeS;
  Minion.attackCdUntil[eid] = 0; // can attack immediately on first contact
  Minion.damage[eid] = damage;
  return eid;
}

/** Spawn a worker bee at (x,y). Returns its eid, or -1 if the pool is exhausted. */
export function spawnBee(world: World, x: number, y: number): number {
  return spawnMinion(world, x, y, BEE_DAMAGE, BEE_LIFETIME_S, spriteId("minion-bee"));
}

/** Spawn a Queen at (x,y). Returns its eid, or -1 if the pool is exhausted. */
export function spawnQueen(world: World, x: number, y: number): number {
  return spawnMinion(world, x, y, QUEEN_DAMAGE, QUEEN_LIFETIME_S, spriteId("minion-queen"));
}

/** Return a minion to the pool (its reset hook strips the components). */
export function releaseMinion(_world: World, eid: number): void {
  minionPool.release(eid);
}
