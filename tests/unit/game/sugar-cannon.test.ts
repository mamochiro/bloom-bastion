import { addComponent } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";
import { Health, Status, Tower, towerQuery, world } from "../../../src/engine/ecs/world";
import { SPECIAL } from "../../../src/game/config/combat";
import { EnemyType } from "../../../src/game/config/enemies";
import {
  PLACEABLE_TOWERS,
  TowerType,
  sellValue,
  totalInvested,
  towerLevelStats,
  upgradeInfo,
} from "../../../src/game/config/towers";
import { setDamageRng } from "../../../src/game/ecs/apply-damage";
import { Hit } from "../../../src/game/ecs/components";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { createProjectile } from "../../../src/game/entities/create-projectile";
import { placeTower } from "../../../src/game/entities/create-tower";
import { DamageSystem } from "../../../src/game/systems/damage";
import { resetGameWorld } from "./_reset";

const SUGAR = TowerType.SugarCannon;
const CELL = 60;

/** Fire a projectile (damage + special) at `target`, land it, run DamageSystem. */
function landHit(target: number, damage: number, special: number): void {
  const p = createProjectile(world, 0, 0, target, damage, special);
  addComponent(world, Hit, p);
  DamageSystem(world, 0);
}

describe("Sugar Cannon (AoE splash) — SPEC §6.1", () => {
  beforeEach(() => {
    resetGameWorld(world);
    setDamageRng(() => 1); // no dodge
  });

  it("level stats: base / L2 / L3 incl splashRadius + special bits", () => {
    expect(towerLevelStats(SUGAR, 1)).toMatchObject({
      damage: 30,
      range: 2.0,
      cooldown: 1.8,
      splashRadius: 1.5,
    });
    expect(towerLevelStats(SUGAR, 2)).toMatchObject({ damage: 50, splashRadius: 2.0 });
    expect(towerLevelStats(SUGAR, 3)).toMatchObject({ damage: 50, splashRadius: 2.0 });

    expect(towerLevelStats(SUGAR, 1).special & SPECIAL.Splash).not.toBe(0);
    expect(towerLevelStats(SUGAR, 1).special & SPECIAL.SplashBig).toBe(0);
    expect(towerLevelStats(SUGAR, 2).special & SPECIAL.SplashBig).not.toBe(0);
    expect(towerLevelStats(SUGAR, 3).special & SPECIAL.SplashSlow).not.toBe(0);
  });

  it("splash damages ALL enemies in radius (uncapped — more than 3)", () => {
    const special = towerLevelStats(SUGAR, 1).special; // L1 splash, 1.5 tiles (90px)
    const primary = spawnEnemy(world, EnemyType.Grub, 300, 300);
    // 5 others clustered within 1.5 tiles (90px) of the primary.
    const others = [
      spawnEnemy(world, EnemyType.Grub, 320, 300),
      spawnEnemy(world, EnemyType.Grub, 280, 300),
      spawnEnemy(world, EnemyType.Grub, 300, 330),
      spawnEnemy(world, EnemyType.Grub, 330, 330),
      spawnEnemy(world, EnemyType.Grub, 360, 300), // 60px away — still in 90px radius
    ];

    landHit(primary, 30, special);

    expect(Health.current[primary]).toBe(60 - 30); // direct hit
    for (const e of others) expect(Health.current[e]).toBe(60 - 30); // all splashed (>3!)
  });

  it("splash radius grows L1 (1.5) → L2 (2.0)", () => {
    // An enemy at 1.75 tiles (105px): outside L1 (90px), inside L2 (120px).
    const farX = 300 + 1.75 * CELL;

    // L1 splash misses it.
    const p1 = spawnEnemy(world, EnemyType.Grub, 300, 300);
    const far1 = spawnEnemy(world, EnemyType.Grub, farX, 300);
    landHit(p1, 30, towerLevelStats(SUGAR, 1).special);
    expect(Health.current[far1]).toBe(60); // out of L1 radius

    resetGameWorld(world);
    setDamageRng(() => 1);

    // L2 splash catches it.
    const p2 = spawnEnemy(world, EnemyType.Grub, 300, 300);
    const far2 = spawnEnemy(world, EnemyType.Grub, farX, 300);
    landHit(p2, 50, towerLevelStats(SUGAR, 2).special);
    expect(Health.current[far2]).toBe(60 - 50); // in L2 radius
  });

  it("L3 Sticky Sugar: splashed enemies are slowed", () => {
    const special = towerLevelStats(SUGAR, 3).special;
    const primary = spawnEnemy(world, EnemyType.Grub, 300, 300);
    const near = spawnEnemy(world, EnemyType.Grub, 320, 300);

    landHit(primary, 50, special);
    expect(Health.current[near]).toBe(60 - 50);
    expect(Status.slowedUntil[near]).toBeGreaterThan(0); // sticky slow applied

    // L1 splash (no SplashSlow) does NOT slow.
    resetGameWorld(world);
    setDamageRng(() => 1);
    const p2 = spawnEnemy(world, EnemyType.Grub, 300, 300);
    const near2 = spawnEnemy(world, EnemyType.Grub, 320, 300);
    landHit(p2, 30, towerLevelStats(SUGAR, 1).special);
    expect(Status.slowedUntil[near2]).toBe(0);
  });

  it("splash skips FLYING enemies (ground candy splash)", () => {
    const special = towerLevelStats(SUGAR, 1).special;
    const primary = spawnEnemy(world, EnemyType.Grub, 300, 300);
    const flutter = spawnEnemy(world, EnemyType.Flutter, 320, 300); // flying, in radius

    landHit(primary, 30, special);
    expect(Health.current[primary]).toBe(60 - 30); // ground primary hit
    expect(Health.current[flutter]).toBe(50); // flier untouched by splash
  });

  it("a direct hit on a flier still lands (splash-only is what skips fliers)", () => {
    const flutter = spawnEnemy(world, EnemyType.Flutter, 300, 300);
    // Primary IS the flier — direct projectile hit connects (splash skips others).
    landHit(flutter, 30, towerLevelStats(SUGAR, 1).special);
    expect(Health.current[flutter]).toBe(50 - 30);
  });

  it("economy: costs 75 / +60 / +120; sell derivation works", () => {
    expect(towerLevelStats(SUGAR, 1)).toBeDefined();
    expect(upgradeInfo(SUGAR, 1)).toEqual({ label: "Bigger Boom", cost: 60 });
    expect(upgradeInfo(SUGAR, 2)).toEqual({ label: "Sticky Sugar", cost: 120 });
    expect(upgradeInfo(SUGAR, 3)).toBeNull();

    expect(totalInvested(SUGAR, 1)).toBe(75);
    expect(totalInvested(SUGAR, 2)).toBe(135); // 75 + 60
    expect(totalInvested(SUGAR, 3)).toBe(255); // 75 + 60 + 120
    expect(sellValue(SUGAR, 1)).toBe(Math.floor(75 * 0.6)); // 45 (never upgraded)
    expect(sellValue(SUGAR, 3)).toBe(Math.floor(255 * 0.4)); // 102
  });

  it("placeable + spawns at L1 with the Sugar config", () => {
    expect(PLACEABLE_TOWERS).toContain(SUGAR);
    expect(TowerType.SugarCannon).toBe(2);

    const t = placeTower(world, SUGAR, 5, 3);
    expect(Tower.typeId[t]).toBe(SUGAR);
    expect(Tower.level[t]).toBe(1);
    expect(towerQuery(world).length).toBe(1);
  });

  it("Splash does not trigger Chain or Petal-Storm paths (independent bit)", () => {
    const special = towerLevelStats(SUGAR, 1).special;
    expect(special & SPECIAL.Chain).toBe(0);
    expect(special & SPECIAL.AoeSlow).toBe(0);
    expect(special & SPECIAL.Stun).toBe(0);
  });
});
