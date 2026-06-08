import { beforeEach, describe, expect, it } from "vitest";
import { Health, Status, Velocity, towerQuery, world } from "../../../src/engine/ecs/world";
import { frameStep } from "../../../src/engine/loop";
import { EnemyType } from "../../../src/game/config/enemies";
import { SKILLS, type SkillType } from "../../../src/game/config/skills";
import { TowerType } from "../../../src/game/config/towers";
import { getGold, initResources } from "../../../src/game/ecs/resources";
import {
  activateSkill,
  cooldownRemaining,
  getClearedWaves,
  goldMultiplier,
  isGoldRushActive,
  isReady,
  isUnlocked,
  recordWaveCleared,
} from "../../../src/game/ecs/skills";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { SPAWN } from "../../../src/game/map/coords";
import { buildLevel } from "../../../src/game/map/level-1";
import { restartGame } from "../../../src/game/restart";
import { createDeathSystem } from "../../../src/game/systems/death";
import { type InputDeps, createInputSystem } from "../../../src/game/systems/input";
import { PathFollowSystem } from "../../../src/game/systems/path-follow";
import { resetGameWorld } from "./_reset";

const STEP = 1 / 60;

/** Advance the global game clock by ~`seconds` (dt is clamped to 50ms/frame). */
function advanceTime(seconds: number): void {
  for (let t = 0; t < seconds; t += 0.05) frameStep(0.05, false);
}

/** A no-killing DeathSystem (won never auto-fires) that still rewards kills. */
const death = createDeathSystem(() => false);

/** Full InputDeps with inert defaults; override what a test needs. */
function makeInput(over: Partial<InputDeps> = {}): InputDeps {
  return {
    consumeStart: () => false,
    getSelectedDifficulty: () => "normal",
    consumeRestart: () => false,
    consumeSkillActivation: () => null,
    getSkillAim: () => null,
    clearSkillAim: () => {},
    consumeTap: () => false,
    pointerWorldX: () => 0,
    pointerWorldY: () => 0,
    getSelectedBuild: () => null,
    clearBuild: () => {},
    ...over,
  };
}

describe("active skills (SPEC §6.4)", () => {
  beforeEach(() => {
    resetGameWorld(world);
    initResources(world);
  });

  it("config is EXACT §6.4", () => {
    expect(SKILLS.meteor).toMatchObject({
      aoeDamage: 200,
      radiusTiles: 2,
      cooldownS: 60,
      unlockWave: 0,
    });
    expect(SKILLS.freeze).toMatchObject({ stunS: 3, cooldownS: 90, unlockWave: 5 });
    expect(SKILLS.goldRush).toMatchObject({
      goldMult: 2,
      durationS: 10,
      cooldownS: 120,
      unlockWave: 10,
    });
  });

  it("Meteor: damages only enemies in radius (armor-adjusted), starts a 60s cooldown", () => {
    const near = spawnEnemy(world, EnemyType.Grub, 340, 300); // 40px from impact
    const snail = spawnEnemy(world, EnemyType.Snail, 300, 340); // 40px, 50% armor
    const far = spawnEnemy(world, EnemyType.Grub, 520, 300); // 220px > 120px radius

    expect(activateSkill(world, "meteor", 300, 300)).toBe(true);

    expect(Health.current[near]).toBe(60 - 200); // full 200
    expect(Health.current[snail]).toBe(180 - 200 * 0.5); // armor halves → 80
    expect(Health.current[far]).toBe(60); // outside radius → untouched

    expect(isReady("meteor")).toBe(false);
    expect(cooldownRemaining("meteor")).toBeCloseTo(60, 3);
  });

  it("cooldown blocks re-use until ready", () => {
    expect(activateSkill(world, "meteor", 0, 0)).toBe(true);
    expect(activateSkill(world, "meteor", 0, 0)).toBe(false); // still on cooldown
  });

  it("Freeze is LOCKED until 5 waves cleared, then stuns ALL enemies (PathFollow holds them)", () => {
    expect(isUnlocked("freeze")).toBe(false);
    expect(activateSkill(world, "freeze")).toBe(false); // locked → no-op

    recordWaveCleared(5);
    expect(isUnlocked("freeze")).toBe(true);

    buildLevel();
    const e = spawnEnemy(world, EnemyType.Grub, SPAWN.x, SPAWN.y);
    expect(activateSkill(world, "freeze")).toBe(true);
    expect(Status.stunnedUntil[e]).toBeGreaterThan(0);

    PathFollowSystem(world, STEP);
    expect(Velocity.vx[e]).toBe(0); // frozen — no movement
    expect(Velocity.vy[e]).toBe(0);
  });

  it("Gold Rush is LOCKED until 10 cleared, then doubles kill reward for 10s, then expires", () => {
    expect(isUnlocked("goldRush")).toBe(false);
    expect(activateSkill(world, "goldRush")).toBe(false); // locked

    recordWaveCleared(10);
    expect(activateSkill(world, "goldRush")).toBe(true);
    expect(isGoldRushActive()).toBe(true);
    expect(goldMultiplier()).toBe(2);

    // Kill a grub while active → 2× reward (8 → 16).
    const g = spawnEnemy(world, EnemyType.Grub, 0, 0);
    Health.current[g] = 0;
    const before = getGold(world);
    death(world, 0);
    expect(getGold(world)).toBe(before + 16);

    advanceTime(11); // past the 10s buff
    expect(isGoldRushActive()).toBe(false);
    expect(goldMultiplier()).toBe(1);

    const g2 = spawnEnemy(world, EnemyType.Grub, 0, 0);
    Health.current[g2] = 0;
    const before2 = getGold(world);
    death(world, 0);
    expect(getGold(world)).toBe(before2 + 8); // back to base reward
  });

  it("clearedWaves increments on wave clear and gates unlocks", () => {
    expect(getClearedWaves()).toBe(0);
    recordWaveCleared(5);
    expect(getClearedWaves()).toBe(5);
    expect(isUnlocked("freeze")).toBe(true);
    expect(isUnlocked("goldRush")).toBe(false);
    recordWaveCleared(10);
    expect(isUnlocked("goldRush")).toBe(true);
    recordWaveCleared(3); // never decreases
    expect(getClearedWaves()).toBe(10);
  });

  it("restart resets cooldowns, buffs, and clearedWaves", () => {
    activateSkill(world, "meteor", 0, 0);
    recordWaveCleared(5);
    expect(isReady("meteor")).toBe(false);

    restartGame(world);

    expect(isReady("meteor")).toBe(true); // cooldown cleared
    expect(getClearedWaves()).toBe(0); // unlocks reset
    expect(isUnlocked("freeze")).toBe(false);
  });

  it("InputSystem: a tap in Meteor AIM mode targets the skill, not tower placement", () => {
    buildLevel();
    const grub = spawnEnemy(world, EnemyType.Grub, 330, 270);
    let aimCleared = false;
    const sys = createInputSystem(
      makeInput({
        getSkillAim: () => "meteor" as SkillType,
        clearSkillAim: () => {
          aimCleared = true;
        },
        consumeTap: () => true,
        pointerWorldX: () => 330,
        pointerWorldY: () => 270,
        getSelectedBuild: () => TowerType.Blossom, // would-be placement…
      }),
    );

    sys(world, STEP);

    expect(Health.current[grub]).toBe(60 - 200); // meteor hit the tapped cluster
    expect(towerQuery(world).length).toBe(0); // …but NO tower placed
    expect(aimCleared).toBe(true);
  });

  it("InputSystem: consumeSkillActivation fires an instant skill", () => {
    recordWaveCleared(10); // unlock GoldRush
    let fired = false;
    const sys = createInputSystem(
      makeInput({
        consumeSkillActivation: () => {
          if (fired) return null;
          fired = true;
          return "goldRush" as SkillType;
        },
      }),
    );

    sys(world, STEP);
    expect(isGoldRushActive()).toBe(true);
  });
});
