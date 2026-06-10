import { beforeEach, describe, expect, it } from "vitest";
import {
  Health,
  Minion,
  Position,
  Renderable,
  Tower,
  minionQuery,
  world,
} from "../../../src/engine/ecs/world";
import { frameStep } from "../../../src/engine/loop";
import { minionPool } from "../../../src/engine/pool/pools";
import { EnemyType } from "../../../src/game/config/enemies";
import { BEE_DAMAGE, QUEEN_DAMAGE } from "../../../src/game/config/hive";
import { spriteId } from "../../../src/game/config/sprites";
import {
  PLACEABLE_TOWERS,
  TowerType,
  sellValue,
  totalInvested,
  upgradeInfo,
} from "../../../src/game/config/towers";
import { setDamageRng } from "../../../src/game/ecs/apply-damage";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { spawnBee } from "../../../src/game/entities/create-minion";
import { placeTower } from "../../../src/game/entities/create-tower";
import { TowerAISystem } from "../../../src/game/systems/tower-ai";
import { resetGameWorld } from "./_reset";

const HIVE = TowerType.Hive;
const STEP = 1 / 60;
const QUEEN_SPRITE = spriteId("minion-queen");

/** Advance the game clock by ~`seconds` (also ticks the no-op stub pipeline). */
function advanceTime(seconds: number): void {
  for (let t = 0; t < seconds; t += 0.05) frameStep(0.05, false);
}

const bees = () => Array.from(minionQuery(world));

describe("Hive (summoner) — SPEC §6.1", () => {
  beforeEach(() => {
    resetGameWorld(world);
    setDamageRng(() => 1); // no dodge
  });

  it("L1 maintains a swarm of 3 bees; L2 'Bigger Swarm' → 5", () => {
    const hive = placeTower(world, HIVE, 5, 3);
    TowerAISystem(world, STEP);
    expect(bees().length).toBe(3);

    // Upgrade to L2 + re-arm the summon cooldown → tops up to 5.
    Tower.level[hive] = 2;
    Tower.cooldown[hive] = 0;
    TowerAISystem(world, STEP);
    expect(bees().length).toBe(5);
  });

  it("a bee seeks and moves toward the nearest ground enemy (free flight)", () => {
    placeTower(world, HIVE, 5, 3); // centre (330, 210)
    const enemy = spawnEnemy(world, EnemyType.Grub, 420, 210); // 90px east — within bee seek (120px)
    TowerAISystem(world, STEP); // spawn swarm + move bees one step

    const swarm = bees();
    expect(swarm.length).toBe(3);
    const b = swarm[0];
    expect(Minion.targetEid[b]).toBe(enemy);
    expect(Position.x[b]).toBeGreaterThan(330); // moved east toward the enemy
  });

  it("a bee attacks on its interval via the shared apply-damage (5 dmg, armor applies)", () => {
    const grub = spawnEnemy(world, EnemyType.Grub, 300, 300);
    spawnBee(world, 300, 300); // adjacent → in attack range, cd ready
    TowerAISystem(world, STEP);
    expect(Health.current[grub]).toBe(60 - BEE_DAMAGE); // 55

    // Armor halves the bee bite (Snail 50% armor).
    const snail = spawnEnemy(world, EnemyType.Snail, 100, 100);
    spawnBee(world, 100, 100);
    TowerAISystem(world, STEP);
    expect(Health.current[snail]).toBeCloseTo(180 - BEE_DAMAGE * 0.5, 5); // 177.5
  });

  it("a bee respects dodge (Shade) through the shared chokepoint", () => {
    setDamageRng(() => 0); // force dodge
    const shade = spawnEnemy(world, EnemyType.Shade, 200, 200);
    spawnBee(world, 200, 200);
    TowerAISystem(world, STEP);
    expect(Health.current[shade]).toBe(90); // dodged
  });

  it("bees ignore FLYING enemies (attack ground only)", () => {
    const flutter = spawnEnemy(world, EnemyType.Flutter, 300, 300);
    const b = spawnBee(world, 300, 300);
    TowerAISystem(world, STEP);
    expect(Minion.targetEid[b]).toBe(0); // no ground target → idle
    expect(Health.current[flutter]).toBe(50); // untouched
  });

  it("a bee expires at its lifetime and is released to the pool", () => {
    const baseline = minionPool.active();
    spawnBee(world, 300, 300);
    expect(minionPool.active()).toBe(baseline + 1);

    advanceTime(5.1); // past the 5s lifetime
    TowerAISystem(world, STEP); // bee AI sees gameTime ≥ expiresAt → release
    expect(minionPool.active()).toBe(baseline);
    expect(bees().length).toBe(0);
  });

  it("L3 'Queen Bee' also maintains a Queen (20 dmg, sprite 401)", () => {
    const hive = placeTower(world, HIVE, 5, 3);
    Tower.level[hive] = 3;
    Tower.cooldown[hive] = 0;
    TowerAISystem(world, STEP);

    const swarm = bees();
    expect(swarm.length).toBe(6); // 5 bees + 1 queen
    const queen = swarm.find((m) => Renderable.spriteId[m] === QUEEN_SPRITE);
    expect(queen).toBeDefined();
    expect(Minion.damage[queen as number]).toBe(QUEEN_DAMAGE); // 20
  });

  it("economy: 125 / +90 / +180 + sell derivation", () => {
    expect(upgradeInfo(HIVE, 1)).toEqual({ label: "Bigger Swarm", cost: 90 });
    expect(upgradeInfo(HIVE, 2)).toEqual({ label: "Queen Bee", cost: 180 });
    expect(upgradeInfo(HIVE, 3)).toBeNull();

    expect(totalInvested(HIVE, 1)).toBe(125);
    expect(totalInvested(HIVE, 2)).toBe(215); // 125 + 90
    expect(totalInvested(HIVE, 3)).toBe(395); // 125 + 90 + 180
    expect(sellValue(HIVE, 1)).toBe(Math.floor(125 * 0.6)); // 75
    expect(sellValue(HIVE, 3)).toBe(Math.floor(395 * 0.4)); // 158
  });

  it("placeable; _reset drains all minions (no stale bee across a shuffle)", () => {
    expect(PLACEABLE_TOWERS).toContain(HIVE);
    expect(TowerType.Hive).toBe(4);

    spawnBee(world, 100, 100);
    spawnBee(world, 200, 200);
    expect(bees().length).toBe(2);
    resetGameWorld(world);
    expect(bees().length).toBe(0);
    expect(minionPool.active()).toBe(0);
  });
});
