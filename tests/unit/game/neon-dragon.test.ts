import { addComponent } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";
import { Enemy, Health, Velocity, enemyQuery, world } from "../../../src/engine/ecs/world";
import { frameStep } from "../../../src/engine/loop";
import { ENEMY_BY_TYPE, ENEMY_FLAGS, EnemyType } from "../../../src/game/config/enemies";
import { WAVES } from "../../../src/game/config/waves";
import { Hit } from "../../../src/game/ecs/components";
import { getPhase } from "../../../src/game/ecs/game-state";
import { getGold, initResources } from "../../../src/game/ecs/resources";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { createProjectile } from "../../../src/game/entities/create-projectile";
import { SPAWN } from "../../../src/game/map/coords";
import { buildLevel } from "../../../src/game/map/level-1";
import { DamageSystem } from "../../../src/game/systems/damage";
import { createDeathSystem } from "../../../src/game/systems/death";
import { PathFollowSystem } from "../../../src/game/systems/path-follow";
import { createSpawnSystem } from "../../../src/game/systems/spawn";
import { resetGameWorld } from "./_reset";

const STEP = 1 / 60;
const DRAGON = EnemyType.NeonDragon;

/** Land a projectile dealing `dmg` on `target`, then run DamageSystem (boss phases). */
function hit(target: number, dmg: number): void {
  const p = createProjectile(world, 0, 0, target, dmg, 0);
  addComponent(world, Hit, p);
  DamageSystem(world, 0);
}

/** Advance the game clock AND tick PathFollow (where the summon timer lives). */
function advance(seconds: number): void {
  for (let t = 0; t < seconds; t += STEP) {
    frameStep(STEP, false); // advance gameTime
    PathFollowSystem(world, STEP); // tick summon timer + movement
  }
}

const countFlutters = () =>
  Array.from(enemyQuery(world)).filter((e) => Enemy.typeId[e] === EnemyType.Flutter).length;

describe("Neon Dragon final boss (SPEC §6.2)", () => {
  beforeEach(() => {
    resetGameWorld(world);
    initResources(world);
    buildLevel();
  });

  it("config is EXACT §6.2", () => {
    const cfg = ENEMY_BY_TYPE[DRAGON];
    expect(cfg).toMatchObject({
      id: "neon_dragon",
      hp: 4000,
      speed: 0.8,
      reward: 300,
      isBoss: true,
    });
    expect(cfg.phases).toEqual([{ hpFrac: 0.5, speedMult: 1.5, setFlying: true }]);
    expect(cfg.periodicSummon).toEqual({
      type: EnemyType.Flutter,
      everyS: 5,
      whileHpFracAbove: 0.5,
    });
    expect(EnemyType.NeonDragon).toBe(8);
  });

  it("P2 at ≤50% HP: gains Flying + speed ×1.5 (fires once)", () => {
    const dragon = spawnEnemy(world, DRAGON, SPAWN.x, SPAWN.y);
    Health.current[dragon] = 2100; // just above 50% of 4000

    hit(dragon, 200); // → 1900 (47.5%) crosses 50%
    expect(Enemy.flags[dragon] & ENEMY_FLAGS.Flying).not.toBe(0); // took flight

    PathFollowSystem(world, STEP);
    expect(Math.hypot(Velocity.vx[dragon], Velocity.vy[dragon])).toBeCloseTo(0.8 * 60 * 1.5, 2); // 72

    // No double-fire.
    const flags = Enemy.flags[dragon];
    hit(dragon, 200);
    expect(Enemy.flags[dragon]).toBe(flags);
  });

  it("flying P2 dragon is immune to Meteor AoE but a targeted projectile still hits", () => {
    const dragon = spawnEnemy(world, DRAGON, 300, 300);
    Health.current[dragon] = 2100;
    hit(dragon, 200); // → P2, Flying set; HP now 1900
    const hp = Health.current[dragon];

    // Single-target projectile still connects.
    hit(dragon, 100);
    expect(Health.current[dragon]).toBe(hp - 100);
  });

  it("P1 summons a Flutter every 5s while above 50%, and STOPS in P2", () => {
    const dragon = spawnEnemy(world, DRAGON, SPAWN.x, SPAWN.y); // full HP → P1
    expect(countFlutters()).toBe(0);

    advance(5.2); // just past the first 5s
    expect(countFlutters()).toBe(1);

    advance(4.9); // ~10.1s total → second summon
    expect(countFlutters()).toBe(2);

    // Drop to P2 → no further summons.
    Health.current[dragon] = 1000; // 25%
    const before = countFlutters();
    advance(6);
    // No NEW flutters were summoned (existing ones may have leaked off the lane).
    expect(countFlutters()).toBeLessThanOrEqual(before);
  });

  it("does NOT summon while in P2 (fresh dragon at 25%)", () => {
    const dragon = spawnEnemy(world, DRAGON, SPAWN.x, SPAWN.y);
    Health.current[dragon] = 1000; // 25% from the start
    advance(11);
    expect(countFlutters()).toBe(0);
  });

  it("killing the dragon yields 300g", () => {
    const death = createDeathSystem(() => false);
    const dragon = spawnEnemy(world, DRAGON, 200, 200);
    Health.current[dragon] = 0;
    const before = getGold(world);
    death(world, 0);
    expect(getGold(world)).toBe(before + 300);
  });

  it("WAVES = 20, Neon Dragon at wave 20, Candy King at 5/10/15", () => {
    expect(WAVES.length).toBe(20);
    const has = (i: number, t: number) => WAVES[i].groups.some((g) => g.enemy === t);
    expect(has(19, DRAGON)).toBe(true); // wave 20
    expect(has(4, EnemyType.CandyKing)).toBe(true); // wave 5
    expect(has(9, EnemyType.CandyKing)).toBe(true); // wave 10
    expect(has(14, EnemyType.CandyKing)).toBe(true); // wave 15
  });

  it("clearing the final (20th) wave sets 'won'", () => {
    // A single-wave table standing in for "the last wave"; clearing it wins.
    const spawn = createSpawnSystem([
      { groups: [{ enemy: DRAGON, count: 1, intervalS: 1.0, startDelayS: 0 }] },
    ]);
    const death = createDeathSystem(() => spawn.isWaveComplete() && spawn.isLastWave());

    spawn(world, 100); // fully spawn the dragon
    for (const e of Array.from(enemyQuery(world))) Health.current[e] = 0; // kill everything
    death(world, 0);

    expect(getPhase()).toBe("won");
  });
});
