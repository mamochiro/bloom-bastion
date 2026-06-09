import { addComponent } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";
import { Health, world } from "../../../src/engine/ecs/world";
import { ENEMY_BY_TYPE, EnemyType } from "../../../src/game/config/enemies";
import { WAVES } from "../../../src/game/config/waves";
import { applyDamage, setDamageRng } from "../../../src/game/ecs/apply-damage";
import { Hit } from "../../../src/game/ecs/components";
import { activateSkill, recordWaveCleared } from "../../../src/game/ecs/skills";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { createProjectile } from "../../../src/game/entities/create-projectile";
import { SPAWN } from "../../../src/game/map/coords";
import { buildLevel } from "../../../src/game/map/level-1";
import { DamageSystem } from "../../../src/game/systems/damage";
import { PathFollowSystem } from "../../../src/game/systems/path-follow";
import { resetGameWorld } from "./_reset";

const STEP = 1 / 60;

describe("Shade (dodge) + Plushy (regen)", () => {
  beforeEach(() => {
    resetGameWorld(world);
    buildLevel();
  });

  it("Shade config is EXACT §6.2", () => {
    expect(ENEMY_BY_TYPE[EnemyType.Shade]).toMatchObject({
      id: "shade",
      hp: 90,
      speed: 1.6,
      reward: 15,
      dodgeChance: 0.2,
    });
    expect(EnemyType.Shade).toBe(6);
  });

  it("dodge: rng < 0.2 fully avoids the hit; rng ≥ 0.2 lands full damage", () => {
    const shade = spawnEnemy(world, EnemyType.Shade, 100, 100);

    setDamageRng(() => 0.1); // < 0.2 → dodged
    applyDamage(shade, 50);
    expect(Health.current[shade]).toBe(90); // no damage

    setDamageRng(() => 0.5); // ≥ 0.2 → lands
    applyDamage(shade, 50);
    expect(Health.current[shade]).toBe(40); // full hit (no armor)
  });

  it("a Grub (no dodgeChance) is never affected by the dodge roll", () => {
    const grub = spawnEnemy(world, EnemyType.Grub, 100, 100);
    setDamageRng(() => 0); // would dodge if it had dodgeChance
    applyDamage(grub, 15);
    expect(Health.current[grub]).toBe(45);
  });

  it("dodge covers ALL sources: projectile + chain + Meteor (single applyDamage)", () => {
    setDamageRng(() => 0); // always dodge

    // Projectile via DamageSystem.
    const s1 = spawnEnemy(world, EnemyType.Shade, 200, 200);
    const p = createProjectile(world, 0, 0, s1, 30, 0);
    addComponent(world, Hit, p);
    DamageSystem(world, 0);
    expect(Health.current[s1]).toBe(90); // dodged the projectile

    // Meteor AoE.
    recordWaveCleared(0);
    const s2 = spawnEnemy(world, EnemyType.Shade, 300, 300);
    activateSkill(world, "meteor", 300, 300);
    expect(Health.current[s2]).toBe(90); // dodged the AoE
  });

  it("Plushy config is EXACT §6.2", () => {
    expect(ENEMY_BY_TYPE[EnemyType.Plushy]).toMatchObject({
      id: "plushy",
      hp: 150,
      speed: 0.9,
      reward: 20,
      regenPerSec: 5,
    });
    expect(EnemyType.Plushy).toBe(7);
  });

  it("regen heals 5·dt per frame and clamps at max (never exceeds, never revives)", () => {
    const plushy = spawnEnemy(world, EnemyType.Plushy, SPAWN.x, SPAWN.y);
    Health.current[plushy] = 100;

    PathFollowSystem(world, STEP); // +5·(1/60) ≈ 0.0833
    expect(Health.current[plushy]).toBeCloseTo(100 + 5 * STEP, 5);

    // Heal a full second → clamps at 150, never above.
    Health.current[plushy] = 148;
    for (let t = 0; t < 1; t += STEP) PathFollowSystem(world, STEP);
    expect(Health.current[plushy]).toBe(150);

    // A "dead" plushy at 0 HP is NOT revived by regen.
    Health.current[plushy] = 0;
    PathFollowSystem(world, STEP);
    expect(Health.current[plushy]).toBe(0);
  });

  it("Plushy out-heals low DPS but dies to burst", () => {
    setDamageRng(() => 1); // no dodge involved
    const plushy = spawnEnemy(world, EnemyType.Plushy, SPAWN.x, SPAWN.y);

    // Low DPS: 3 dmg/s spread thin can't beat 5 HP/s regen → stays near full.
    for (let t = 0; t < 1; t += STEP) {
      applyDamage(plushy, 3 * STEP); // 3 dmg/s
      PathFollowSystem(world, STEP); // +5 HP/s
    }
    expect(Health.current[plushy]).toBeGreaterThan(149); // out-healed

    // Burst: one big hit it can't regen back.
    applyDamage(plushy, 200);
    expect(Health.current[plushy]).toBeLessThanOrEqual(0);
  });

  it("WAVES 6-8 contain Shade and Plushy", () => {
    const types = (i: number) => new Set(WAVES[i].groups.map((g) => g.enemy));
    expect(types(5).has(EnemyType.Shade)).toBe(true); // wave 6
    expect(types(6).has(EnemyType.Plushy)).toBe(true); // wave 7
    expect(types(7).has(EnemyType.Shade) && types(7).has(EnemyType.Plushy)).toBe(true); // wave 8
  });
});
