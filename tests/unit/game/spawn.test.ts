import { beforeEach, describe, expect, it } from "vitest";
import { Enemy, Pathfinder, Position, enemyQuery, world } from "../../../src/engine/ecs/world";
import { EnemyType } from "../../../src/game/config/enemies";
import type { Wave } from "../../../src/game/config/waves";
import { SPAWN } from "../../../src/game/map/coords";
import { createSpawnSystem } from "../../../src/game/systems/spawn";
import { resetGameWorld } from "./_reset";

const STEP = 1 / 60;

/** Drive a spawn system for `seconds` total in fixed `step`-second ticks. */
function simulate(sys: (w: typeof world, dt: number) => void, seconds: number, step = STEP): void {
  for (let t = 0; t < seconds; t += step) sys(world, step);
}

const GRUB_WAVE: readonly Wave[] = [
  { groups: [{ enemy: EnemyType.Grub, count: 5, intervalS: 0.75, startDelayS: 0 }] },
];

describe("SpawnSystem (wave-driven scheduling)", () => {
  beforeEach(() => resetGameWorld(world));

  it("spawns exactly the group count over the wave", () => {
    const sys = createSpawnSystem(GRUB_WAVE);
    simulate(sys, 5 * 0.75 + 1);
    expect(enemyQuery(world).length).toBe(5);
  });

  it("does not over-spawn once the wave is fully emitted", () => {
    const sys = createSpawnSystem(GRUB_WAVE);
    simulate(sys, 100);
    expect(enemyQuery(world).length).toBe(5);
  });

  it("paces spawns by the interval (only 1 before the second beat)", () => {
    const sys = createSpawnSystem(GRUB_WAVE);
    simulate(sys, 0.75 - 0.1);
    expect(enemyQuery(world).length).toBe(1);
  });

  it("spawns at SPAWN with enemy + pathfinder components", () => {
    const sys = createSpawnSystem(GRUB_WAVE);
    sys(world, 0.001); // first spawn at t≈0
    const eids = enemyQuery(world);
    expect(eids.length).toBe(1);
    const eid = eids[0];
    expect(Position.x[eid]).toBe(SPAWN.x);
    expect(Position.y[eid]).toBe(SPAWN.y);
    expect(Enemy.typeId[eid]).toBe(EnemyType.Grub);
    expect(Pathfinder.followFlowField[eid]).toBe(1);
  });

  it("honours a group's startDelay (trailing group spawns nothing early)", () => {
    const delayed: readonly Wave[] = [
      {
        groups: [
          { enemy: EnemyType.Grub, count: 4, intervalS: 0.5, startDelayS: 0 },
          { enemy: EnemyType.Snail, count: 2, intervalS: 0.5, startDelayS: 2.0 },
        ],
      },
    ];
    const sys = createSpawnSystem(delayed);

    simulate(sys, 1.0); // before the Snail group's 2.0s delay
    const eids = Array.from(enemyQuery(world));
    expect(eids.length).toBeGreaterThan(0);
    expect(eids.every((e) => Enemy.typeId[e] === EnemyType.Grub)).toBe(true); // no Snails yet
  });

  it("reset() re-arms the wave back to the start", () => {
    const sys = createSpawnSystem(GRUB_WAVE);
    simulate(sys, 100); // exhaust the wave
    expect(enemyQuery(world).length).toBe(5);
    expect(sys.getCurrentWave()).toBe(1);

    sys.reset();
    resetGameWorld(world); // clear the spawned enemies too
    sys(world, 0.001);
    expect(enemyQuery(world).length).toBe(1); // spawns again from the top
  });
});
