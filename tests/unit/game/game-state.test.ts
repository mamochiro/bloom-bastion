import { beforeEach, describe, expect, it } from "vitest";
import {
  Health,
  Position,
  projectileQuery,
  towerQuery,
  world,
} from "../../../src/engine/ecs/world";
import { enemyQuery } from "../../../src/engine/ecs/world";
import { EnemyType } from "../../../src/game/config/enemies";
import { TowerType } from "../../../src/game/config/towers";
import { getPhase, setPhase } from "../../../src/game/ecs/game-state";
import { getGold, getLives, initResources, loseLives } from "../../../src/game/ecs/resources";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { placeTower } from "../../../src/game/entities/create-tower";
import { SPAWN } from "../../../src/game/map/coords";
import { buildLevel } from "../../../src/game/map/level-1";
import { restartGame } from "../../../src/game/restart";
import { createDeathSystem } from "../../../src/game/systems/death";
import { PathFollowSystem } from "../../../src/game/systems/path-follow";
import { TowerAISystem } from "../../../src/game/systems/tower-ai";
import { resetGameWorld } from "./_reset";

const STEP = 1 / 60;

// Tower (5,3) grass; enemy on the lane one cell south (5,4) — 60px, in range.
const ENEMY_PX = { x: 5 * 60 + 30, y: 4 * 60 + 30 } as const;

describe("game phase: win / lose / pause / restart", () => {
  beforeEach(() => {
    resetGameWorld(world); // resets phase → 'playing', re-arms the wave
    buildLevel();
    initResources(world); // 150 / 20
  });

  it("sets phase 'lost' when lives reach 0", () => {
    const death = createDeathSystem(() => false); // wave not complete
    loseLives(world, 20); // lives → 0

    death(world, STEP);

    expect(getPhase()).toBe("lost");
  });

  it("sets phase 'won' when the wave is fully spawned and no enemies remain", () => {
    const death = createDeathSystem(() => true); // wave complete

    // A lone enemy dies this tick → 0 remain, lives intact → win.
    const eid = spawnEnemy(world, EnemyType.Grub, SPAWN.x, SPAWN.y);
    Health.current[eid] = 0;

    death(world, STEP);

    expect(enemyQuery(world).length).toBe(0);
    expect(getLives(world)).toBe(20);
    expect(getPhase()).toBe("won");
  });

  it("does NOT win while enemies are still alive", () => {
    const death = createDeathSystem(() => true); // wave complete...
    spawnEnemy(world, EnemyType.Grub, SPAWN.x, SPAWN.y); // ...but one is alive

    death(world, STEP);

    expect(getPhase()).toBe("playing");
  });

  it("freezes the simulation when phase is not 'playing'", () => {
    const enemy = spawnEnemy(world, EnemyType.Grub, ENEMY_PX.x, ENEMY_PX.y);
    placeTower(world, TowerType.Blossom, 5, 3);
    const startX = Position.x[enemy];

    setPhase("lost"); // end the run

    for (let t = 0; t < 1; t += STEP) {
      PathFollowSystem(world, STEP); // would move the enemy…
      TowerAISystem(world, STEP); // …and fire the tower
    }

    expect(Position.x[enemy]).toBe(startX); // enemy didn't move
    expect(projectileQuery(world).length).toBe(0); // tower didn't fire
  });

  it("restartGame clears entities, re-seeds 150/20, resumes the sim", () => {
    // Simulate a finished, messy run.
    placeTower(world, TowerType.Blossom, 5, 3);
    spawnEnemy(world, EnemyType.Grub, SPAWN.x, SPAWN.y);
    spawnEnemy(world, EnemyType.Grub, SPAWN.x, SPAWN.y);
    loseLives(world, 5); // 15
    setPhase("lost");

    restartGame(world);

    expect(enemyQuery(world).length).toBe(0);
    expect(towerQuery(world).length).toBe(0);
    expect(projectileQuery(world).length).toBe(0);
    expect(getGold(world)).toBe(150);
    expect(getLives(world)).toBe(20);
    expect(getPhase()).toBe("playing");

    // Sim resumes: a fresh enemy moves again down the rebuilt lane.
    const eid = spawnEnemy(world, EnemyType.Grub, SPAWN.x, SPAWN.y);
    const startX = Position.x[eid];
    PathFollowSystem(world, STEP);
    expect(Position.x[eid]).toBeGreaterThan(startX);
  });
});
