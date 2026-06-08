/**
 * Tower factory. Builds a tower entity from `TOWER_BY_TYPE` config at a grid
 * cell and returns its `eid`. Towers are static (no Velocity/Pathfinder) and
 * hold no Health in this slice.
 */
import { addComponent, addEntity, removeComponent, removeEntity } from "bitecs";
import { Position, Renderable, Tower, type World } from "../../engine/ecs/world";
import { spriteId } from "../config/sprites";
import { BASE_TOWER_LEVEL, TOWER_BY_TYPE } from "../config/towers";
import { cellCenter } from "../map/coords";

/**
 * Place a tower of `typeId` on grid cell (`gridX`, `gridY`). The tower is
 * positioned at the cell centre and starts ready to fire (`cooldown = 0`).
 *
 * @returns the new entity id.
 * @throws if `typeId` has no config.
 */
export function placeTower(world: World, typeId: number, gridX: number, gridY: number): number {
  const cfg = TOWER_BY_TYPE[typeId];
  if (!cfg) {
    throw new Error(`placeTower: unknown tower typeId ${typeId}`);
  }

  const eid = addEntity(world);

  addComponent(world, Position, eid);
  Position.x[eid] = cellCenter(gridX);
  Position.y[eid] = cellCenter(gridY);

  addComponent(world, Renderable, eid);
  // RenderSystem keys textures off the sprite registry id (config/sprites.ts),
  // sourced from this tower's atlas key — Blossom → "tower-blossom-l1" → 1.
  Renderable.spriteId[eid] = spriteId(cfg.sprite);
  // tint is FX-ONLY (locked): 0 → native SVG colours; non-zero is a transient
  // FX multiply (hit-flash / status). Base = 0.
  Renderable.tint[eid] = 0;

  addComponent(world, Tower, eid);
  Tower.typeId[eid] = typeId;
  Tower.level[eid] = BASE_TOWER_LEVEL;
  Tower.cooldown[eid] = 0; // ready to fire on first eligible frame
  Tower.lastTarget[eid] = 0;

  return eid;
}

/**
 * Remove a tower: strip its components (so it matches no query) and destroy the
 * entity. Towers are NOT pooled (SPEC §4.4 has no TowerPool — they're low-count
 * and lifecycle-managed directly), so unlike `releaseEnemy` this calls
 * `removeEntity` rather than returning the eid to a pool. Used by sell/teardown
 * (and test resets).
 */
export function releaseTower(world: World, eid: number): void {
  removeComponent(world, Position, eid);
  removeComponent(world, Renderable, eid);
  removeComponent(world, Tower, eid);
  removeEntity(world, eid);
}
