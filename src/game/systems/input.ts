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
import { Position, type World, towerQuery } from "../../engine/ecs/world";
import { consumeTap, pointerWorldX, pointerWorldY } from "../../engine/input/input";
import type { System } from "../../engine/loop";
import { COST_BLOCKED, COST_GRASS } from "../../engine/pathfinding/flow-field";
import { clearBuild, getSelectedBuild } from "../../store/build";
import {
  consumeClearSelection,
  consumeRestart,
  consumeStart,
  consumeTowerSell,
  consumeTowerUpgrade,
  getStartMode,
} from "../../store/commands";
import { getSelectedDifficulty } from "../../store/difficulty";
import { clearSkillAim, consumeSkillActivation, getSkillAim } from "../../store/skills";
import type { Difficulty } from "../config/difficulty";
import type { SkillType } from "../config/skills";
import { TOWER_BY_TYPE } from "../config/towers";
import type { GameMode } from "../ecs/game-state";
import { isSimPaused } from "../ecs/game-state";
import { addGold, getGold } from "../ecs/resources";
import { clearSelectedTower, getSelectedTower, setSelectedTower } from "../ecs/selection";
import { activateSkill } from "../ecs/skills";
import { placeTower } from "../entities/create-tower";
import { CELL, GRID_H, GRID_W } from "../map/coords";
import { buildLevel, cellIndex, costGrid } from "../map/level-1";
import { restartGame, startGame } from "../restart";
import { sellTower, upgradeTower } from "../tower-actions";

/** The slice of input/build/placement/skills/towers the system depends on (injectable for tests). */
export interface InputDeps {
  /** True ONCE when a start button was pressed on the start screen (edge-consume). */
  consumeStart(): boolean;
  /** The difficulty chosen on the start screen. */
  getSelectedDifficulty(): Difficulty;
  /** The run mode requested by the start button (campaign / endless). */
  getStartMode(): GameMode;
  /** True ONCE when "Play Again" was pressed (edge-consume). */
  consumeRestart(): boolean;
  /** A skill activated instantly this frame (Freeze/GoldRush), or null (true-once). */
  consumeSkillActivation(): SkillType | null;
  /** The skill in aim mode (Meteor) whose target is the next tap, or null. */
  getSkillAim(): SkillType | null;
  /** Clear the aim mode after the aimed tap resolves. */
  clearSkillAim(): void;
  /** True ONCE when the panel "Upgrade" button was pressed (edge-consume). */
  consumeTowerUpgrade(): boolean;
  /** True ONCE when the panel "Sell" button was pressed (edge-consume). */
  consumeTowerSell(): boolean;
  /** True ONCE when the panel was closed / deselected (edge-consume). */
  consumeClearSelection(): boolean;
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

/** Default deps wired to the live engine-input + ui-build/commands/skills modules. */
const liveDeps: InputDeps = {
  consumeStart,
  getSelectedDifficulty,
  getStartMode,
  consumeRestart,
  consumeSkillActivation,
  getSkillAim,
  clearSkillAim,
  consumeTowerUpgrade,
  consumeTowerSell,
  consumeClearSelection,
  consumeTap,
  pointerWorldX,
  pointerWorldY,
  getSelectedBuild,
  clearBuild,
};

/** Find a placed tower occupying grid cell (gx,gy), or -1. Zero-alloc scan. */
function towerAt(world: World, gx: number, gy: number): number {
  const towers = towerQuery(world);
  for (let i = 0; i < towers.length; i++) {
    const t = towers[i];
    if (Math.floor(Position.x[t] / CELL) === gx && Math.floor(Position.y[t] / CELL) === gy)
      return t;
  }
  return -1;
}

/** Build an InputSystem over `deps` (defaults to the live engine/ui wiring). */
export function createInputSystem(deps: InputDeps = liveDeps): System {
  return (world: World, _dt: number): World => {
    // Start / restart are checked BEFORE the pause guard so they work while the
    // sim is frozen (menu / won / lost).
    if (deps.consumeStart()) {
      startGame(world, deps.getSelectedDifficulty(), deps.getStartMode());
      return world;
    }
    if (deps.consumeRestart()) {
      restartGame(world);
      return world;
    }

    // Drain the tap edge every frame (so a tap during pause can't queue into the
    // next run), then gate skills/placement on an active run.
    const tapped = deps.consumeTap();
    if (isSimPaused()) return world; // not playing → no skills, no placement

    // Instant skills (Freeze/GoldRush) — no tap needed; true-once.
    const instant = deps.consumeSkillActivation();
    if (instant !== null) {
      activateSkill(world, instant);
      return world;
    }

    // Tower panel commands act on the selected tower (no tap needed; true-once).
    if (deps.consumeTowerUpgrade()) {
      const s = getSelectedTower();
      if (s >= 0) upgradeTower(world, s); // gold-guarded inside; no-op at max/unaffordable
      return world;
    }
    if (deps.consumeTowerSell()) {
      const s = getSelectedTower();
      if (s >= 0) {
        sellTower(world, s);
        clearSelectedTower();
      }
      return world;
    }
    if (deps.consumeClearSelection()) {
      clearSelectedTower();
      return world;
    }

    if (!tapped) return world; // no tap this frame → zero work

    // A canvas tap while a skill is in AIM mode (Meteor) is the skill's TARGET —
    // it takes priority over tower selection/placement.
    const aim = deps.getSkillAim();
    if (aim !== null) {
      activateSkill(world, aim, deps.pointerWorldX(), deps.pointerWorldY());
      deps.clearSkillAim();
      return world;
    }

    const gx = Math.floor(deps.pointerWorldX() / CELL);
    const gy = Math.floor(deps.pointerWorldY() / CELL);
    if (gx < 0 || gy < 0 || gx >= GRID_W || gy >= GRID_H) {
      clearSelectedTower(); // off-map tap → close panel
      return world;
    }
    const idx = cellIndex(gx, gy);

    // (a) Tap on a cell occupied by a tower → SELECT it (open panel). Priority.
    const towerEid = towerAt(world, gx, gy);
    if (towerEid >= 0) {
      setSelectedTower(towerEid);
      return world;
    }

    // (b) Tap on buildable grass WITH an active build-intent → place.
    const sel = deps.getSelectedBuild();
    if (sel !== null) {
      if (costGrid[idx] !== COST_GRASS) return world; // not grass → ignore (build kept)
      const cfg = TOWER_BY_TYPE[sel];
      if (!cfg) return world; // unknown tower type
      if (getGold(world) < cfg.cost) return world; // can't afford → no spend, build kept

      addGold(world, -cfg.cost); // spend
      placeTower(world, sel, gx, gy);
      costGrid[idx] = COST_BLOCKED; // tower footprint walls the cell
      buildLevel(); // recompute flow field over the updated grid (cold path)
      deps.clearBuild();
      clearSelectedTower();
      return world;
    }

    // (c) Tap elsewhere with no build intent → clear the selection (close panel).
    clearSelectedTower();
    return world;
  };
}

/** Default instance wired into the live pipeline. */
export const InputSystem: System = createInputSystem();
