/**
 * Tower upgrade + sell (SPEC §6.1 levels + §6.7 economy). ECS-pure; called by
 * InputSystem (slot 1) when the panel's Upgrade/Sell commands fire.
 */
import { Position, Tower, type World } from "../engine/ecs/world";
import { COST_GRASS } from "../engine/pathfinding/flow-field";
import { sellValue, upgradeInfo } from "./config/towers";
import { addGold, getGold } from "./ecs/resources";
import { releaseTower } from "./entities/create-tower";
import { CELL } from "./map/coords";
import { buildLevel, cellIndex, costGrid } from "./map/level-1";

/**
 * Upgrade `eid` to the next level if it isn't max and the player can afford it:
 * spend the upgrade cost and bump `Tower.level`. TowerAI reads the new level's
 * stats automatically.
 *
 * @returns true if upgraded, false if max level or unaffordable.
 */
export function upgradeTower(world: World, eid: number): boolean {
  const typeId = Tower.typeId[eid];
  const level = Tower.level[eid];
  const next = upgradeInfo(typeId, level);
  if (!next) return false; // already max level
  if (getGold(world) < next.cost) return false; // can't afford → no spend
  addGold(world, -next.cost);
  Tower.level[eid] = level + 1;
  return true;
}

/**
 * Sell `eid`: refund per SPEC §6.7 (60% if never upgraded, else 40% of total
 * invested), free its cell (back to grass) + rebuild the flow field (towers are
 * obstacles), then release the tower.
 */
export function sellTower(world: World, eid: number): void {
  const typeId = Tower.typeId[eid];
  const level = Tower.level[eid];
  addGold(world, sellValue(typeId, level));

  // Free the footprint cell + recompute the flow field (cold path).
  const gx = Math.floor(Position.x[eid] / CELL);
  const gy = Math.floor(Position.y[eid] / CELL);
  costGrid[cellIndex(gx, gy)] = COST_GRASS;
  releaseTower(world, eid);
  buildLevel();
}
