import { beforeEach, describe, expect, it } from "vitest";
import { Enemy, Pathfinder, Position, enemyQuery, world } from "../../../src/engine/ecs/world";
import { EnemyType } from "../../../src/game/config/enemies";
import { SPAWN } from "../../../src/game/map/coords";
import { type WaveSpec, createSpawnSystem } from "../../../src/game/systems/spawn";
import { resetGameWorld } from "./_reset";

/** Drive a system for `seconds` total in fixed `step`-second ticks. */
function simulate(
  system: ReturnType<typeof createSpawnSystem>,
  seconds: number,
  step = 1 / 60,
): void {
  for (let t = 0; t < seconds; t += step) {
    system(world, step);
  }
}

const WAVE: WaveSpec = {
  enemyType: EnemyType.Grub,
  count: 5,
  intervalS: 0.75,
  at: SPAWN,
};

describe("SpawnSystem", () => {
  beforeEach(() => resetGameWorld(world));

  it("spawns exactly `count` enemies over the wave duration", () => {
    const system = createSpawnSystem(WAVE);
    simulate(system, WAVE.count * WAVE.intervalS + 1);
    expect(enemyQuery(world).length).toBe(WAVE.count);
  });

  it("does not over-spawn once the wave is exhausted", () => {
    const system = createSpawnSystem(WAVE);
    simulate(system, 100); // run far longer than the wave
    expect(enemyQuery(world).length).toBe(WAVE.count);
  });

  it("paces spawns by the interval (only 1 enemy before the second beat)", () => {
    const system = createSpawnSystem(WAVE);
    simulate(system, WAVE.intervalS - 0.1);
    expect(enemyQuery(world).length).toBe(1);
  });

  it("spawns enemies at the SPAWN coordinate with enemy + pathfinder components", () => {
    const system = createSpawnSystem(WAVE);
    system(world, 0); // single tick → first spawn at t=0
    const eids = enemyQuery(world);

    expect(eids.length).toBe(1);
    const eid = eids[0];
    expect(Position.x[eid]).toBe(SPAWN.x);
    expect(Position.y[eid]).toBe(SPAWN.y);
    expect(Enemy.typeId[eid]).toBe(EnemyType.Grub);
    expect(Pathfinder.followFlowField[eid]).toBe(1);
  });

  it("gives each instance its own timer (a fresh system still spawns)", () => {
    const a = createSpawnSystem(WAVE);
    simulate(a, 100); // exhaust A
    expect(enemyQuery(world).length).toBe(WAVE.count);

    // A new system has its own timer starting at 0 → spawns on its first tick.
    const b = createSpawnSystem(WAVE);
    b(world, 0);
    expect(enemyQuery(world).length).toBe(WAVE.count + 1);
  });
});
