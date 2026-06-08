import { beforeEach, describe, expect, it } from "vitest";
import { Health, Position, Velocity, enemyQuery, world } from "../../../src/engine/ecs/world";
import { getActiveDifficulty, getDifficultyMods } from "../../../src/game/config/difficulty";
import { EnemyType } from "../../../src/game/config/enemies";
import { getPhase, setPhase } from "../../../src/game/ecs/game-state";
import { getGold, getLives } from "../../../src/game/ecs/resources";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { SPAWN } from "../../../src/game/map/coords";
import { buildLevel } from "../../../src/game/map/level-1";
import { restartGame, startGame } from "../../../src/game/restart";
import { type InputDeps, createInputSystem } from "../../../src/game/systems/input";
import { PathFollowSystem } from "../../../src/game/systems/path-follow";
import { createSpawnSystem } from "../../../src/game/systems/spawn";
import { resetGameWorld } from "./_reset";

const STEP = 1 / 60;
const GRUB_HP = 60;

/** Minimal InputDeps that only triggers start with a chosen difficulty. */
function startDeps(difficulty: "casual" | "normal" | "hardcore") {
  const state = { start: true };
  const deps: InputDeps = {
    consumeStart: () => {
      if (!state.start) return false;
      state.start = false;
      return true;
    },
    getSelectedDifficulty: () => difficulty,
    consumeRestart: () => false,
    consumeTap: () => false,
    pointerWorldX: () => 0,
    pointerWorldY: () => 0,
    getSelectedBuild: () => null,
    clearBuild: () => {},
  };
  return deps;
}

describe("start screen + difficulty", () => {
  beforeEach(() => resetGameWorld(world)); // resets phase 'playing' + difficulty 'normal'

  it("the menu phase freezes the sim (no spawn, no movement)", () => {
    setPhase("menu");
    buildLevel();

    const spawn = createSpawnSystem([
      { groups: [{ enemy: EnemyType.Grub, count: 3, intervalS: 0.1, startDelayS: 0 }] },
    ]);
    for (let t = 0; t < 2; t += STEP) spawn(world, STEP);
    expect(enemyQuery(world).length).toBe(0); // SpawnSystem frozen

    const e = spawnEnemy(world, EnemyType.Grub, SPAWN.x, SPAWN.y);
    const x0 = Position.x[e];
    for (let t = 0; t < 1; t += STEP) PathFollowSystem(world, STEP);
    expect(Position.x[e]).toBe(x0); // PathFollow frozen
  });

  it("startGame('normal') → playing, 150 / 20, 1.0× HP, native speed", () => {
    setPhase("menu");
    startGame(world, "normal");

    expect(getPhase()).toBe("playing");
    expect(getGold(world)).toBe(150);
    expect(getLives(world)).toBe(20);
    expect(getActiveDifficulty()).toBe("normal");
    expect(getDifficultyMods()).toEqual({ hpMult: 1.0, speedMult: 1.0 });

    const e = spawnEnemy(world, EnemyType.Grub, 0, 0);
    expect(Health.max[e]).toBe(GRUB_HP); // 60 × 1.0
  });

  it("startGame('casual') → 200 / 25, 0.8× HP, 0.9× speed", () => {
    setPhase("menu");
    startGame(world, "casual");
    buildLevel();

    expect(getGold(world)).toBe(200);
    expect(getLives(world)).toBe(25);
    expect(getDifficultyMods()).toEqual({ hpMult: 0.8, speedMult: 0.9 });

    const e = spawnEnemy(world, EnemyType.Grub, SPAWN.x, SPAWN.y);
    expect(Health.max[e]).toBeCloseTo(GRUB_HP * 0.8, 5); // 48

    PathFollowSystem(world, STEP); // grub speed 1.0 tile/s × 60 × 0.9 = 54 px/s
    expect(Math.hypot(Velocity.vx[e], Velocity.vy[e])).toBeCloseTo(54, 3);
  });

  it("startGame('hardcore') → 100 / 15, 1.3× HP, 1.15× speed", () => {
    setPhase("menu");
    startGame(world, "hardcore");

    expect(getGold(world)).toBe(100);
    expect(getLives(world)).toBe(15);
    expect(getDifficultyMods()).toEqual({ hpMult: 1.3, speedMult: 1.15 });

    const e = spawnEnemy(world, EnemyType.Grub, 0, 0);
    expect(Health.max[e]).toBeCloseTo(GRUB_HP * 1.3, 5); // 78
  });

  it("restartGame keeps the active difficulty (Play Again replays it)", () => {
    startGame(world, "hardcore");
    getGold(world); // spend/lose would happen mid-run
    setPhase("lost");

    restartGame(world);

    expect(getActiveDifficulty()).toBe("hardcore");
    expect(getGold(world)).toBe(100); // hardcore start, NOT normal 150
    expect(getLives(world)).toBe(15);
    expect(getPhase()).toBe("playing");
  });

  it("consumeStart triggers startGame with the selected difficulty", () => {
    setPhase("menu");
    const sys = createInputSystem(startDeps("casual"));

    sys(world, STEP);

    expect(getPhase()).toBe("playing");
    expect(getActiveDifficulty()).toBe("casual");
    expect(getGold(world)).toBe(200);
    expect(getLives(world)).toBe(25);
  });
});
