import { beforeEach, describe, expect, it } from "vitest";
import { enemyQuery, towerQuery, world } from "../../../src/engine/ecs/world";
import { COST_BLOCKED } from "../../../src/engine/pathfinding/flow-field";
import type { Difficulty } from "../../../src/game/config/difficulty";
import { EnemyType } from "../../../src/game/config/enemies";
import { TowerType } from "../../../src/game/config/towers";
import { getPhase, setPhase } from "../../../src/game/ecs/game-state";
import { getGold, initResources } from "../../../src/game/ecs/resources";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { SPAWN } from "../../../src/game/map/coords";
import { cellIndex, costGrid, resetLevel } from "../../../src/game/map/level-1";
import { type InputDeps, createInputSystem } from "../../../src/game/systems/input";
import { PathFollowSystem } from "../../../src/game/systems/path-follow";
import { resetGameWorld } from "./_reset";

const STEP = 1 / 60;
const CENTER = 30; // cell centre offset (CELL/2)

/** Cell (gx,gy) → its world-pixel centre. */
const px = (g: number) => g * 60 + CENTER;

/** A controllable InputDeps mock (engine input + ui build store stand-ins). */
function makeDeps() {
  const state = {
    tap: false,
    restart: false,
    start: false,
    difficulty: "normal" as Difficulty,
    x: 0,
    y: 0,
    sel: null as number | null,
    cleared: false,
  };
  const deps: InputDeps = {
    consumeStart: () => {
      if (!state.start) return false;
      state.start = false;
      return true;
    },
    getSelectedDifficulty: () => state.difficulty,
    getStartMode: () => "campaign",
    consumeSkillActivation: () => null,
    getSkillAim: () => null,
    clearSkillAim: () => {},
    consumeTowerUpgrade: () => false,
    consumeTowerSell: () => false,
    consumeClearSelection: () => false,
    consumeRestart: () => {
      if (!state.restart) return false;
      state.restart = false;
      return true;
    },
    consumeTap: () => {
      if (!state.tap) return false;
      state.tap = false; // edge-consume: true exactly once per tap
      return true;
    },
    pointerWorldX: () => state.x,
    pointerWorldY: () => state.y,
    getSelectedBuild: () => state.sel,
    clearBuild: () => {
      state.sel = null;
      state.cleared = true;
    },
  };
  return { deps, state };
}

/** Tap cell (gx,gy) with `sel` selected. */
function tapCell(
  state: { tap: boolean; x: number; y: number; sel: number | null },
  gx: number,
  gy: number,
  sel: number | null,
) {
  state.x = px(gx);
  state.y = px(gy);
  state.sel = sel;
  state.tap = true;
}

describe("InputSystem (tower placement)", () => {
  beforeEach(() => {
    resetGameWorld(world);
    resetLevel(); // restore costGrid + flow field (placements mutate them)
    initResources(world); // 150 gold / 20 lives
  });

  it("places a tower on a grass cell when affordable: spends gold, walls the cell, keeps the lane routable", () => {
    const { deps, state } = makeDeps();
    const sys = createInputSystem(deps);

    tapCell(state, 5, 3, TowerType.Blossom); // (5,3) is grass, off the lane
    sys(world, STEP);

    expect(towerQuery(world).length).toBe(1);
    expect(getGold(world)).toBe(100); // 150 − 50 (Blossom)
    expect(costGrid[cellIndex(5, 3)]).toBe(COST_BLOCKED);
    expect(state.cleared).toBe(true); // build selection cleared

    // The rebuilt flow field still routes the lane: a grub reaches the goal.
    spawnEnemy(world, EnemyType.Grub, SPAWN.x, SPAWN.y);
    for (let t = 0; t < 20; t += STEP) PathFollowSystem(world, STEP);
    expect(enemyQuery(world).length).toBe(0);
  });

  it("ignores a tap on a path (lane) cell — no place, no spend", () => {
    const { deps, state } = makeDeps();
    const sys = createInputSystem(deps);

    tapCell(state, 5, 4, TowerType.Blossom); // row 4 is the lane (COST_PATH)
    sys(world, STEP);

    expect(towerQuery(world).length).toBe(0);
    expect(getGold(world)).toBe(150);
    expect(state.cleared).toBe(false);
  });

  it("ignores a tap when the player can't afford it — no place, no spend", () => {
    resetGameWorld(world);
    resetLevel();
    initResources(world, 40, 20); // only 40 gold (< 50)

    const { deps, state } = makeDeps();
    const sys = createInputSystem(deps);

    tapCell(state, 5, 3, TowerType.Blossom);
    sys(world, STEP);

    expect(towerQuery(world).length).toBe(0);
    expect(getGold(world)).toBe(40);
    expect(state.cleared).toBe(false);
  });

  it("is a no-op when nothing is selected", () => {
    const { deps, state } = makeDeps();
    const sys = createInputSystem(deps);

    tapCell(state, 5, 3, null); // grass cell but no build selected
    sys(world, STEP);

    expect(towerQuery(world).length).toBe(0);
    expect(getGold(world)).toBe(150);
  });

  it("consumes the tap once — does not re-place on the next frame", () => {
    const { deps, state } = makeDeps();
    const sys = createInputSystem(deps);

    tapCell(state, 5, 3, TowerType.Blossom);
    sys(world, STEP); // places the tower (tap consumed)
    expect(towerQuery(world).length).toBe(1);
    expect(getGold(world)).toBe(100);

    // Re-select but DON'T tap again: the consumed tap must not re-fire.
    state.sel = TowerType.Blossom;
    sys(world, STEP);
    expect(towerQuery(world).length).toBe(1); // still just one
    expect(getGold(world)).toBe(100); // no extra spend
  });

  it("blocks placement while the run is over (phase != 'playing')", () => {
    const { deps, state } = makeDeps();
    const sys = createInputSystem(deps);
    setPhase("lost");

    tapCell(state, 5, 3, TowerType.Blossom); // valid grass + affordable…
    sys(world, STEP);

    expect(towerQuery(world).length).toBe(0); // …but the run is over
    expect(getGold(world)).toBe(150);
  });

  it("consumes a restart command and re-arms the run — even while paused", () => {
    const { deps, state } = makeDeps();
    const sys = createInputSystem(deps);

    // A finished, messy run.
    tapCell(state, 5, 3, TowerType.Blossom);
    sys(world, STEP); // places a tower, gold 150→100
    setPhase("lost");

    state.restart = true; // player hits "Play Again"
    sys(world, STEP);

    expect(getPhase()).toBe("playing");
    expect(towerQuery(world).length).toBe(0);
    expect(getGold(world)).toBe(150); // re-seeded
  });
});
