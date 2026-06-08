import { addComponent } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";
import { Enemy, Health, Status, Velocity, enemyQuery, world } from "../../../src/engine/ecs/world";
import { ENEMY_BY_TYPE, ENEMY_FLAGS, EnemyType } from "../../../src/game/config/enemies";
import { WAVES } from "../../../src/game/config/waves";
import { Hit } from "../../../src/game/ecs/components";
import { getGold, initResources } from "../../../src/game/ecs/resources";
import { getClearedWaves, isUnlocked, recordWaveCleared } from "../../../src/game/ecs/skills";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { createProjectile } from "../../../src/game/entities/create-projectile";
import { SPAWN } from "../../../src/game/map/coords";
import { buildLevel } from "../../../src/game/map/level-1";
import { DamageSystem } from "../../../src/game/systems/damage";
import { createDeathSystem } from "../../../src/game/systems/death";
import { PathFollowSystem } from "../../../src/game/systems/path-follow";
import { buildSnapshot } from "../../../src/game/systems/ui-sync";
import { resetGameWorld } from "./_reset";

const STEP = 1 / 60;
const CK = EnemyType.CandyKing;

/** Land a projectile dealing `dmg` on `target` and run DamageSystem (boss phases). */
function hit(target: number, dmg: number): void {
  const p = createProjectile(world, 0, 0, target, dmg, 0);
  addComponent(world, Hit, p);
  DamageSystem(world, 0);
}

/** Speed (px/s) PathFollow assigns the boss this frame, on the lane. */
function bossSpeed(eid: number): number {
  PathFollowSystem(world, STEP);
  return Math.hypot(Velocity.vx[eid], Velocity.vy[eid]);
}

describe("Candy King mini-boss (SPEC §6.2)", () => {
  beforeEach(() => {
    resetGameWorld(world);
    initResources(world);
    buildLevel();
  });

  it("config is EXACT §6.2", () => {
    const cfg = ENEMY_BY_TYPE[CK];
    expect(cfg).toMatchObject({
      id: "candy_king",
      hp: 1200,
      speed: 0.7,
      reward: 100,
      isBoss: true,
      armor: 0,
    });
    expect(cfg.phases).toEqual([
      { hpFrac: 0.5, summonGrubs: 4, speedMult: 1.2 },
      { hpFrac: 0.25, speedMult: 1.4, slowImmune: true },
    ]);
    expect(EnemyType.CandyKing).toBe(2);
  });

  it("phase 1 fires at ≤50% HP: summons 4 Grubs + speed ×1.2 (once)", () => {
    const king = spawnEnemy(world, CK, SPAWN.x, SPAWN.y);
    Health.current[king] = 650; // just above 50% of 1200

    hit(king, 100); // → 550 (45.8%) crosses 50%
    expect(Enemy.flags[king] & ENEMY_FLAGS.Phase1Done).not.toBe(0);
    // 1 king + 4 summoned grubs.
    expect(enemyQuery(world).length).toBe(5);
    // Speed: 0.7 tile/s × 60 × 1.0 (normal) × 1.2 = 50.4 px/s.
    expect(bossSpeed(king)).toBeCloseTo(50.4, 2);

    // Firing again does NOT re-summon.
    hit(king, 50);
    expect(enemyQuery(world).length).toBe(5);
  });

  it("phase 2 fires at ≤25%: speed ×1.4 + slow-immune (a slowed berserk king still moves full speed)", () => {
    const king = spawnEnemy(world, CK, SPAWN.x, SPAWN.y);
    Enemy.flags[king] |= ENEMY_FLAGS.Phase1Done; // already past phase 1
    Health.current[king] = 320; // just above 25% of 1200

    hit(king, 50); // → 270 (22.5%) crosses 25%
    expect(Enemy.flags[king] & ENEMY_FLAGS.Phase2Done).not.toBe(0);
    expect(Enemy.flags[king] & ENEMY_FLAGS.SlowImmune).not.toBe(0);

    // Apply a slow — the berserk king must IGNORE it.
    Status.slowedUntil[king] = 9999;
    expect(bossSpeed(king)).toBeCloseTo(0.7 * 60 * 1.4, 2); // 58.8, NOT reduced
  });

  it("both phases can fire in one big hit", () => {
    const king = spawnEnemy(world, CK, SPAWN.x, SPAWN.y);
    Health.current[king] = 1200;
    hit(king, 1000); // → 200 (16.7%) crosses both 50% and 25%
    expect(Enemy.flags[king] & ENEMY_FLAGS.Phase1Done).not.toBe(0);
    expect(Enemy.flags[king] & ENEMY_FLAGS.Phase2Done).not.toBe(0);
    expect(enemyQuery(world).length).toBe(5); // king + 4 summoned grubs
  });

  it("dropping the king to 0 HP yields 100g", () => {
    const death = createDeathSystem(() => false);
    const king = spawnEnemy(world, CK, 200, 200);
    Health.current[king] = 0;
    const before = getGold(world);
    death(world, 0);
    expect(getGold(world)).toBe(before + 100);
    expect(enemyQuery(world).length).toBe(0);
  });

  it("WAVES has 10 entries with Candy King at waves 5 and 10", () => {
    expect(WAVES.length).toBe(10);
    const hasCK = (i: number) => WAVES[i].groups.some((g) => g.enemy === CK);
    expect(hasCK(4)).toBe(true); // wave 5
    expect(hasCK(9)).toBe(true); // wave 10
    // No CK in the non-boss waves.
    expect([0, 1, 2, 3, 5, 6, 7, 8].some(hasCK)).toBe(false);
  });

  it("clearing waves 5 / 10 unlocks Freeze / Gold Rush", () => {
    expect(isUnlocked("freeze")).toBe(false);
    recordWaveCleared(5);
    expect(isUnlocked("freeze")).toBe(true);
    expect(isUnlocked("goldRush")).toBe(false);
    recordWaveCleared(10);
    expect(isUnlocked("goldRush")).toBe(true);
    expect(getClearedWaves()).toBe(10);
  });

  it("boss snapshot reflects the live king's hpFraction (null when none)", () => {
    expect(buildSnapshot(world).boss).toBeNull();

    const king = spawnEnemy(world, CK, 200, 200);
    Health.current[king] = 600; // 50%
    const snap = buildSnapshot(world);
    expect(snap.boss).toEqual({ name: "Candy King", hpFraction: 0.5 });
  });
});
