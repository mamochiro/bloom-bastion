/**
 * Slice-local map coordinates.
 *
 * PLACEHOLDER for round 1 only: a full Tiled cost-grid map + flow field arrive
 * in round 2 (blocked on the engine's flow-field API). Until then SpawnSystem
 * needs a fixed entry point, and tower placement needs a tile→pixel scale, so
 * those two constants live here as plain data.
 */

/**
 * Pixels per tile. Mirrors the engine renderer's grid baseline (60px cells,
 * ADR-0002 / `src/engine/renderer/pixi-app.ts`). Round 2 should import this
 * from a single shared source once the map module exists.
 */
export const CELL = 60;

/** Battlefield grid size in cells (16×9 @ 60px = 960×540, the renderer grid). */
export const GRID_W = 16;
export const GRID_H = 9;

/** Convert a grid-cell index to the pixel position of that cell's centre. */
export function cellCenter(grid: number): number {
  return grid * CELL + CELL / 2;
}

/** Enemy entry point in world pixels (left edge, row 4 centre). */
export const SPAWN = { x: cellCenter(0), y: cellCenter(4) } as const;

/** Path goal / bastion in world pixels (right side, row 4 centre). */
export const GOAL = { x: cellCenter(15), y: cellCenter(4) } as const;
