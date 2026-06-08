import { beforeEach, describe, expect, it } from "vitest";
import { Position, Velocity, enemyQuery, world } from "../../../src/engine/ecs/world";
import { EnemyType } from "../../../src/game/config/enemies";
import { getLives, initResources } from "../../../src/game/ecs/resources";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { SPAWN } from "../../../src/game/map/coords";
import { buildLevel } from "../../../src/game/map/level-1";
import { PathFollowSystem } from "../../../src/game/systems/path-follow";
import { resetGameWorld } from "./_reset";

const STEP = 1 / 60;

/** Tick PathFollowSystem for `seconds`. */
function run(seconds: number): void {
  for (let t = 0; t < seconds; t += STEP) {
    PathFollowSystem(world, STEP);
  }
}

describe("PathFollowSystem", () => {
  beforeEach(() => {
    resetGameWorld(world);
    buildLevel();
    initResources(world); // 150 gold / 20 lives
  });

  it("drives a grub eastward along the lane toward the goal", () => {
    const eid = spawnEnemy(world, EnemyType.Grub, SPAWN.x, SPAWN.y);

    PathFollowSystem(world, STEP);
    expect(Velocity.vx[eid]).toBeGreaterThan(0);
    expect(Math.abs(Velocity.vy[eid])).toBeLessThan(1e-6);
    expect(Position.x[eid]).toBeGreaterThan(SPAWN.x);
    expect(Position.y[eid]).toBeCloseTo(SPAWN.y, 5); // stays on row 4
  });

  it("moves at the SPEC speed (1.0 tile/s · 60px = 60px/s)", () => {
    const eid = spawnEnemy(world, EnemyType.Grub, SPAWN.x, SPAWN.y);
    run(1); // ~1 second of travel
    expect(Position.x[eid]).toBeGreaterThan(SPAWN.x + 55);
    expect(Position.x[eid]).toBeLessThan(SPAWN.x + 65);
  });

  it("reaches the goal and despawns (recycled to the pool), costing 1 life", () => {
    spawnEnemy(world, EnemyType.Grub, SPAWN.x, SPAWN.y);
    expect(enemyQuery(world).length).toBe(1);
    const livesBefore = getLives(world);

    run(20); // lane is 900px @ 60px/s ≈ 15s; 20s is ample

    expect(enemyQuery(world).length).toBe(0);
    expect(getLives(world)).toBe(livesBefore - 1); // leaked grub costs a life
  });
});
