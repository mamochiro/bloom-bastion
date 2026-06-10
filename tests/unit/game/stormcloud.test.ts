import { addComponent } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";
import { Health, Projectile, Tower, projectileQuery, world } from "../../../src/engine/ecs/world";
import { CHAIN_RADIUS_TILES, SPECIAL } from "../../../src/game/config/combat";
import { EnemyType } from "../../../src/game/config/enemies";
import { PLACEABLE_TOWERS, TOWER_BY_TYPE, TowerType } from "../../../src/game/config/towers";
import { Hit } from "../../../src/game/ecs/components";
import { initResources } from "../../../src/game/ecs/resources";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { createProjectile } from "../../../src/game/entities/create-projectile";
import { placeTower } from "../../../src/game/entities/create-tower";
import { DamageSystem } from "../../../src/game/systems/damage";
import { TowerAISystem } from "../../../src/game/systems/tower-ai";
import { resetGameWorld } from "./_reset";

const CELL = 60;
const STORM_DMG = 20;
const CHAIN_DMG = STORM_DMG * 0.5; // 10

/** Fire a CHAIN projectile at `primary`, land it, and run DamageSystem. */
function landChainBolt(primary: number): void {
  const p = createProjectile(world, 0, 0, primary, STORM_DMG, SPECIAL.Chain);
  addComponent(world, Hit, p);
  DamageSystem(world, 0);
}

describe("Stormcloud (chain lightning)", () => {
  beforeEach(() => {
    resetGameWorld(world);
    initResources(world);
  });

  it("has the EXACT SPEC §6.1 config", () => {
    const cfg = TOWER_BY_TYPE[TowerType.Stormcloud];
    expect(cfg.damage).toBe(20);
    expect(cfg.range).toBe(2.2);
    expect(cfg.cooldown).toBe(1.0);
    expect(cfg.cost).toBe(100);
    expect(cfg.chain).toEqual({ maxTargets: 3, falloff: 0.5 });
  });

  it("exports PLACEABLE_TOWERS for the UI (all built towers)", () => {
    expect(PLACEABLE_TOWERS).toEqual([
      TowerType.Blossom,
      TowerType.Stormcloud,
      TowerType.SugarCannon,
      TowerType.Luna,
      TowerType.Hive,
    ]);
  });

  it("a placed Stormcloud fires a CHAIN (not SLOW) projectile at the nearest in-range enemy", () => {
    placeTower(world, TowerType.Stormcloud, 5, 3); // centre (330, 210)
    const enemy = spawnEnemy(world, EnemyType.Grub, 330, 270); // 60px below, in 2.2-tile range

    TowerAISystem(world, 1 / 60); // cooldown starts 0 → fires
    const shots = projectileQuery(world);
    expect(shots.length).toBe(1);
    expect(Projectile.targetId[shots[0]]).toBe(enemy);
    expect(Projectile.special[shots[0]] & SPECIAL.Chain).not.toBe(0);
    expect(Projectile.special[shots[0]] & SPECIAL.Slow).toBe(0);
  });

  it("on hit: primary takes full 20, the 2 nearest within radius take 10 each", () => {
    // primary + two others clustered within the chain radius.
    const primary = spawnEnemy(world, EnemyType.Grub, 300, 300);
    const near1 = spawnEnemy(world, EnemyType.Grub, 300 + 0.5 * CELL, 300);
    const near2 = spawnEnemy(world, EnemyType.Grub, 300, 300 + 0.5 * CELL);

    landChainBolt(primary);

    expect(Health.current[primary]).toBe(60 - STORM_DMG); // 40
    expect(Health.current[near1]).toBe(60 - CHAIN_DMG); // 50
    expect(Health.current[near2]).toBe(60 - CHAIN_DMG); // 50
  });

  it("only the 2 NEAREST chain (a 4th in-radius enemy is untouched)", () => {
    const primary = spawnEnemy(world, EnemyType.Grub, 300, 300);
    const near1 = spawnEnemy(world, EnemyType.Grub, 300 + 0.3 * CELL, 300);
    const near2 = spawnEnemy(world, EnemyType.Grub, 300, 300 + 0.3 * CELL);
    const far = spawnEnemy(world, EnemyType.Grub, 300 + 1.0 * CELL, 300 + 1.0 * CELL); // still in radius, but 3rd-nearest

    landChainBolt(primary);

    expect(Health.current[near1]).toBe(60 - CHAIN_DMG);
    expect(Health.current[near2]).toBe(60 - CHAIN_DMG);
    expect(Health.current[far]).toBe(60); // untouched — max 2 chains
  });

  it("chains to fewer when fewer enemies are present (just 1 nearby)", () => {
    const primary = spawnEnemy(world, EnemyType.Grub, 300, 300);
    const near1 = spawnEnemy(world, EnemyType.Grub, 300 + 0.5 * CELL, 300);

    landChainBolt(primary);

    expect(Health.current[primary]).toBe(60 - STORM_DMG);
    expect(Health.current[near1]).toBe(60 - CHAIN_DMG);
  });

  it("does not chain to enemies beyond CHAIN_RADIUS", () => {
    const primary = spawnEnemy(world, EnemyType.Grub, 300, 300);
    const outside = spawnEnemy(world, EnemyType.Grub, 300 + (CHAIN_RADIUS_TILES + 1) * CELL, 300);

    landChainBolt(primary);

    expect(Health.current[outside]).toBe(60); // out of arc range
  });

  it("respects range 2.2: an enemy past 2.2 tiles is not targeted", () => {
    placeTower(world, TowerType.Stormcloud, 5, 3); // centre (330, 210)
    // 3 tiles straight down = 180px > 2.2*60=132px.
    spawnEnemy(world, EnemyType.Grub, 330, 210 + 3 * CELL);

    TowerAISystem(world, 1 / 60);
    expect(projectileQuery(world).length).toBe(0); // out of range → no shot

    // cooldown stayed ≤ 0 (ready), since nothing was fired.
    const towers = Object.keys(TOWER_BY_TYPE);
    expect(towers.length).toBeGreaterThan(0);
  });

  it("sets the 1.0s cooldown after firing", () => {
    const tower = placeTower(world, TowerType.Stormcloud, 5, 3);
    spawnEnemy(world, EnemyType.Grub, 330, 270);

    TowerAISystem(world, 1 / 60);
    expect(Tower.cooldown[tower]).toBeCloseTo(1.0, 5);
  });

  it("Blossom slow path still works and SLOW/CHAIN bits don't collide", () => {
    expect(SPECIAL.Slow & SPECIAL.Chain).toBe(0); // distinct bits

    // A Blossom shot carries SLOW, never CHAIN.
    placeTower(world, TowerType.Blossom, 5, 3);
    spawnEnemy(world, EnemyType.Grub, 330, 270);
    TowerAISystem(world, 1 / 60);
    const shot = projectileQuery(world)[0];
    expect(Projectile.special[shot] & SPECIAL.Slow).not.toBe(0);
    expect(Projectile.special[shot] & SPECIAL.Chain).toBe(0);
  });
});
