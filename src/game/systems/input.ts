/**
 * InputSystem (SPEC §4.2 slot 1) — interactive tower placement.
 *
 * Each frame, if a tap was registered this frame (edge-consumed exactly once),
 * and the player has a tower selected in the build store, try to place it at the
 * tapped grid cell. Placement is gated on TWO checks and is otherwise a no-op
 * (no spend, no place, selection kept so the player can retry):
 *   1. the cell is GRASS — `costGrid === COST_GRASS`. This one check covers both
 *      "buildable terrain" AND "unoccupied": lane cells are COST_PATH and
 *      already-placed towers are COST_BLOCKED, so neither reads as grass.
 *   2. the player can afford it — `getGold >= TOWER_BY_TYPE[sel].cost`.
 *
 * On success: spend the gold, place the tower, wall the cell (COST_BLOCKED),
 * REBUILD the flow field over the new grid, and clear the build selection.
 *
 * Zero hot-path alloc: on frames without a tap the system returns immediately
 * after the `consumeTap()` edge check — no work, no allocation. The flow-field
 * rebuild is a cold path (only on an actual placement).
 *
 * DEFERRED: a general "placement must not fully wall off the lane" validation.
 * In level-1 grass cells never border-seal the straight lane, so blocking any
 * single grass cell always leaves a valid route; a true reachability check
 * comes with arbitrary maps.
 */
import type { World } from "../../engine/ecs/world";
import { consumeTap, pointerWorldX, pointerWorldY } from "../../engine/input/input";
import type { System } from "../../engine/loop";
import { COST_BLOCKED, COST_GRASS } from "../../engine/pathfinding/flow-field";
import { clearBuild, getSelectedBuild } from "../../store/build";
import { consumeRestart } from "../../store/commands";
import { TOWER_BY_TYPE } from "../config/towers";
import { isSimPaused } from "../ecs/game-state";
import { addGold, getGold } from "../ecs/resources";
import { placeTower } from "../entities/create-tower";
import { CELL, GRID_H, GRID_W } from "../map/coords";
import { buildLevel, cellIndex, costGrid } from "../map/level-1";
import { restartGame } from "../restart";

/** The slice of input/build/placement the system depends on (injectable for tests). */
export interface InputDeps {
  /** True ONCE when "Play Again" was pressed (edge-consume). */
  consumeRestart(): boolean;
  /** True ONCE per tap (edge-consume). */
  consumeTap(): boolean;
  /** Tap position in WORLD px (ECS Position space). */
  pointerWorldX(): number;
  pointerWorldY(): number;
  /** Currently selected tower type, or null. */
  getSelectedBuild(): number | null;
  /** Clear the build selection after a successful placement. */
  clearBuild(): void;
}

/** Default deps wired to the live engine-input + ui-build/commands modules. */
const liveDeps: InputDeps = {
  consumeRestart,
  consumeTap,
  pointerWorldX,
  pointerWorldY,
  getSelectedBuild,
  clearBuild,
};

/** Build an InputSystem over `deps` (defaults to the live engine/ui wiring). */
export function createInputSystem(deps: InputDeps = liveDeps): System {
  return (world: World, _dt: number): World => {
    // Restart is checked BEFORE the pause guard so "Play Again" works while the
    // sim is frozen on a finished run.
    if (deps.consumeRestart()) {
      restartGame(world);
      return world;
    }

    // Drain the tap edge every frame (so a tap during pause can't queue into the
    // next run), then gate placement on an active run.
    const tapped = deps.consumeTap();
    if (isSimPaused()) return world; // not playing → no placement
    if (!tapped) return world; // no tap this frame → zero work

    const sel = deps.getSelectedBuild();
    if (sel === null) return world; // tap but nothing selected → ignore

    const gx = Math.floor(deps.pointerWorldX() / CELL);
    const gy = Math.floor(deps.pointerWorldY() / CELL);
    if (gx < 0 || gy < 0 || gx >= GRID_W || gy >= GRID_H) return world; // off-map

    const idx = cellIndex(gx, gy);
    if (costGrid[idx] !== COST_GRASS) return world; // not grass / occupied / lane

    const cfg = TOWER_BY_TYPE[sel];
    if (!cfg) return world; // unknown tower type
    if (getGold(world) < cfg.cost) return world; // can't afford → no spend, no place

    addGold(world, -cfg.cost); // spend
    placeTower(world, sel, gx, gy);
    costGrid[idx] = COST_BLOCKED; // tower footprint walls the cell
    buildLevel(); // recompute flow field over the updated grid (cold path)
    deps.clearBuild();
    return world;
  };
}

/** Default instance wired into the live pipeline. */
export const InputSystem: System = createInputSystem();
