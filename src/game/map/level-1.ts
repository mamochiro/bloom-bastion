/**
 * Level 1 — the M1 vertical-slice map + flow field.
 *
 * 16×9 cells at 60px (`CELL`) = 960×540, matching the engine renderer grid. A
 * single straight lane runs along row `y=4` (cols 0..15); every other cell is
 * grass. The flow field is Dijkstra-spread from the goal cell (15,4) by the
 * engine — built on load here, and rebuildable on tower placement (cold path).
 *
 * Cost encoding is the engine's: COST_PATH=1 (lane), COST_GRASS=999 (penalised
 * but traversable), COST_BLOCKED=65535 (impassable — towers/walls).
 */
import { COST_GRASS, COST_PATH, buildFlowField } from "../../engine/pathfinding/flow-field";
import { CELL, GRID_H, GRID_W } from "./coords";

/** Lane row (cell Y) the path runs along. */
export const PATH_ROW = 4;

/** Goal cell (right end of the lane) — flow-field sink. */
export const GOAL_CELL = { x: 15, y: PATH_ROW } as const;

/**
 * Row-major (`y*width+x`) cost grid for level 1. Module-owned and mutable so a
 * tower placement can flip a grass cell to `COST_BLOCKED` and rebuild the field
 * without reallocating.
 */
export const costGrid: Uint16Array = new Uint16Array(GRID_W * GRID_H);

/** Reset `costGrid` to the pristine level layout (lane = path, rest = grass). */
function fillInitialGrid(): void {
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      costGrid[y * GRID_W + x] = y === PATH_ROW ? COST_PATH : COST_GRASS;
    }
  }
}
fillInitialGrid();

/** Cost-grid index for a cell (row-major). */
export function cellIndex(cx: number, cy: number): number {
  return cy * GRID_W + cx;
}

/** (Re)compute the flow field from the current `costGrid` toward the goal. */
export function buildLevel(): void {
  buildFlowField(costGrid, GRID_W, GRID_H, CELL, GOAL_CELL.x, GOAL_CELL.y);
}

/**
 * Restore the pristine level: clear all placed-tower walls from `costGrid` and
 * rebuild the flow field. For new-game / level-reload and test isolation.
 */
export function resetLevel(): void {
  fillInitialGrid();
  buildLevel();
}
