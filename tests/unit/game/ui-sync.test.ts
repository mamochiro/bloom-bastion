import { beforeEach, describe, expect, it } from "vitest";
import { world } from "../../../src/engine/ecs/world";
import { EnemyType } from "../../../src/game/config/enemies";
import { setPhase } from "../../../src/game/ecs/game-state";
import { addGold, initResources, loseLives } from "../../../src/game/ecs/resources";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { SPAWN } from "../../../src/game/map/coords";
import { PUSH_INTERVAL_S, createUISyncSystem } from "../../../src/game/systems/ui-sync";
import { resetGameWorld } from "./_reset";

const STEP = 1 / 60;

describe("UISyncSystem", () => {
  beforeEach(() => {
    resetGameWorld(world);
    initResources(world); // 150 gold / 20 lives
  });

  it("pushes a snapshot mirroring gold / lives / enemiesAlive", () => {
    addGold(world, 25); // 175
    loseLives(world, 3); // 17
    spawnEnemy(world, EnemyType.Grub, SPAWN.x, SPAWN.y);
    spawnEnemy(world, EnemyType.Grub, SPAWN.x, SPAWN.y);

    let last = null as null | {
      gold: number;
      lives: number;
      wave: number;
      enemiesAlive: number;
      gameStatus: string;
    };
    const sync = createUISyncSystem((s) => {
      last = s;
    });

    // Advance past one push interval.
    for (let t = 0; t <= PUSH_INTERVAL_S; t += STEP) sync(world, STEP);

    expect(last).not.toBeNull();
    expect(last?.gold).toBe(175);
    expect(last?.lives).toBe(17);
    expect(last?.enemiesAlive).toBe(2);
    expect(last?.wave).toBe(1);
    expect(last?.gameStatus).toBe("playing");
  });

  it("throttles to ≤10Hz (≈1 push per 0.1s of sim time)", () => {
    let pushes = 0;
    const sync = createUISyncSystem(() => {
      pushes++;
    });

    // 1.0s of sim at 60fps = 60 frames; at ≤10Hz that is at most ~10 pushes.
    for (let i = 0; i < 60; i++) sync(world, STEP);

    expect(pushes).toBeLessThanOrEqual(10);
    expect(pushes).toBeGreaterThanOrEqual(9); // and it actually fires (~10)
  });

  it("mirrors the authoritative phase into gameStatus", () => {
    loseLives(world, 999); // clamps to 0 — but phase is authoritative, not lives
    setPhase("lost");

    let last = null as null | { gameStatus: string; lives: number };
    const sync = createUISyncSystem((s) => {
      last = s;
    });
    for (let t = 0; t <= PUSH_INTERVAL_S; t += STEP) sync(world, STEP);

    expect(last?.lives).toBe(0);
    expect(last?.gameStatus).toBe("lost");
  });

  it("mirrors a 'won' phase", () => {
    setPhase("won");
    let last = null as null | { gameStatus: string };
    const sync = createUISyncSystem((s) => {
      last = s;
    });
    for (let t = 0; t <= PUSH_INTERVAL_S; t += STEP) sync(world, STEP);
    expect(last?.gameStatus).toBe("won");
  });
});
