import { addComponent } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";
import { Health, type World, enemyQuery, world } from "../../../src/engine/ecs/world";
import { EnemyType } from "../../../src/game/config/enemies";
import type { Wave } from "../../../src/game/config/waves";
import { Hit } from "../../../src/game/ecs/components";
import { getPhase } from "../../../src/game/ecs/game-state";
import { getGold, getLives, initResources } from "../../../src/game/ecs/resources";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { createProjectile } from "../../../src/game/entities/create-projectile";
import { restartGame } from "../../../src/game/restart";
import { DamageSystem } from "../../../src/game/systems/damage";
import { createDeathSystem } from "../../../src/game/systems/death";
import {
  SpawnSystem,
  type SpawnSystemHandle,
  createSpawnSystem,
} from "../../../src/game/systems/spawn";
import { resetGameWorld } from "./_reset";

const tiny = (count: number, enemy = EnemyType.Grub): Wave => ({
  groups: [{ enemy, count, intervalS: 0.05, startDelayS: 0 }],
});

/** A death system bound to a specific spawn instance's final-wave state. */
function deathFor(spawn: SpawnSystemHandle) {
  return createDeathSystem(() => spawn.isWaveComplete() && spawn.isLastWave());
}

/** Set every live enemy to 0 HP, then run DeathSystem to reward + recycle them. */
function killAll(death: (w: World, dt: number) => void): void {
  for (const e of Array.from(enemyQuery(world))) Health.current[e] = 0;
  death(world, 0);
}

/** Spawn the whole current wave, then clear the board, then detect the clear. */
function clearWave(spawn: SpawnSystemHandle, death: (w: World, dt: number) => void): void {
  spawn(world, 100); // emit every enemy of the wave
  killAll(death); // kill them all (DeathSystem releases)
  spawn(world, 0.001); // SpawnSystem notices fully-spawned + empty board
}

describe("wave system", () => {
  beforeEach(() => {
    resetGameWorld(world); // resets phase + the live wave instance
    initResources(world); // 150 / 20
  });

  it("advances wave 1 → 2 → 3 after each clears + the inter-wave delay", () => {
    const spawn = createSpawnSystem([tiny(2), tiny(2), tiny(1)]);
    const death = deathFor(spawn);

    expect(spawn.getCurrentWave()).toBe(1);
    clearWave(spawn, death);
    expect(spawn.getCurrentWave()).toBe(1); // still wave 1 during the prep gap
    spawn(world, 3); // inter-wave elapses → advance
    expect(spawn.getCurrentWave()).toBe(2);

    clearWave(spawn, death);
    spawn(world, 3);
    expect(spawn.getCurrentWave()).toBe(3);
    expect(spawn.isLastWave()).toBe(true);
  });

  it("does NOT win after clearing wave 1 or 2 (only inter-wave gaps)", () => {
    const spawn = createSpawnSystem([tiny(2), tiny(2)]);
    const death = deathFor(spawn);

    clearWave(spawn, death); // wave 1 cleared
    expect(getPhase()).toBe("playing"); // NOT a win
    spawn(world, 3); // → wave 2
    expect(spawn.getCurrentWave()).toBe(2);
    expect(getPhase()).toBe("playing");
  });

  it("wins only after the LAST wave clears with lives > 0", () => {
    const spawn = createSpawnSystem([tiny(1)]); // single (final) wave
    const death = deathFor(spawn);

    spawn(world, 100); // fully spawn it
    expect(spawn.isWaveComplete()).toBe(true);
    killAll(death); // board cleared on the final wave → win
    expect(getPhase()).toBe("won");
    expect(getLives(world)).toBe(20);
  });

  it("credits the §6.5 wave-clear economy (bonus + capped interest)", () => {
    const spawn = createSpawnSystem([tiny(2), tiny(2)]);
    const death = deathFor(spawn);

    clearWave(spawn, death);
    const before = getGold(world); // after kill rewards
    spawn(world, 3); // advance → economy for wave 1

    const bonus = 25 + 5 * 1; // 30
    const interest = Math.min(50, Math.floor(0.05 * (before + bonus)));
    expect(getGold(world)).toBe(before + bonus + interest);
  });

  it("armor halves Snail damage; Grub takes full", () => {
    const snail = spawnEnemy(world, EnemyType.Snail, 100, 100);
    const grub = spawnEnemy(world, EnemyType.Grub, 200, 200);

    const p1 = createProjectile(world, 100, 100, snail, 15, 0);
    const p2 = createProjectile(world, 200, 200, grub, 15, 0);
    addComponent(world, Hit, p1);
    addComponent(world, Hit, p2);
    DamageSystem(world, 0);

    expect(Health.current[snail]).toBe(180 - 15 * 0.5); // 172.5 (50% armor)
    expect(Health.current[grub]).toBe(60 - 15); // 45 (no armor)
  });

  it("the live wave table has all 10 defined waves", () => {
    expect(SpawnSystem.TOTAL_WAVES).toBe(10);
  });

  it("restart returns the live run to wave 1", () => {
    const death = deathFor(SpawnSystem); // drive the LIVE instance
    clearWave(SpawnSystem, death); // clear real wave 1 (8 grubs)
    SpawnSystem(world, 3); // advance to wave 2
    expect(SpawnSystem.getCurrentWave()).toBe(2);

    restartGame(world);
    expect(SpawnSystem.getCurrentWave()).toBe(1);
    expect(getGold(world)).toBe(150);
    expect(getLives(world)).toBe(20);
  });
});
