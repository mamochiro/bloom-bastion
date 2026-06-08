import { beforeEach, describe, expect, it } from "vitest";
import {
  Health,
  Projectile,
  Status,
  Velocity,
  enemyQuery,
  projectileQuery,
  world,
} from "../../../src/engine/ecs/world";
import { enemyPool, projectilePool } from "../../../src/engine/pool/pools";
import { SLOW_REDUCTION } from "../../../src/game/config/combat";
import { EnemyType } from "../../../src/game/config/enemies";
import { TowerType } from "../../../src/game/config/towers";
import { START_GOLD, getGold, initResources } from "../../../src/game/ecs/resources";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { placeTower } from "../../../src/game/entities/create-tower";
import { buildLevel } from "../../../src/game/map/level-1";
import { DamageSystem } from "../../../src/game/systems/damage";
import { DeathSystem } from "../../../src/game/systems/death";
import { PathFollowSystem } from "../../../src/game/systems/path-follow";
import { ProjectileSystem } from "../../../src/game/systems/projectile";
import { TowerAISystem } from "../../../src/game/systems/tower-ai";
import { resetGameWorld } from "./_reset";

const STEP = 1 / 60;
const GRUB_HP = 60;
const GRUB_REWARD = 8;
const BLOSSOM_DMG = 15;

// Tower on grass cell (5,3); enemy one cell south on the lane (5,4) — 60px away,
// well inside Blossom's 2.5-tile (150px) range. Stationary unless we run PathFollow.
const TOWER_CELL = { x: 5, y: 3 } as const;
const ENEMY_PX = { x: 5 * 60 + 30, y: 4 * 60 + 30 } as const; // (330, 270)

/** One combat sub-pipeline tick in locked §4.2 order (slots 4→7). */
function combatTick(dt = STEP): void {
  TowerAISystem(world, dt);
  ProjectileSystem(world, dt);
  DamageSystem(world, dt);
  DeathSystem(world, dt);
}

function run(ticks: number): void {
  for (let i = 0; i < ticks; i++) combatTick();
}

describe("combat slice (TowerAI → Projectile → Damage → Death)", () => {
  beforeEach(() => {
    resetGameWorld(world);
    buildLevel();
    initResources(world);
  });

  it("a ready tower fires a projectile at the nearest in-range enemy", () => {
    placeTower(world, TowerType.Blossom, TOWER_CELL.x, TOWER_CELL.y);
    const enemy = spawnEnemy(world, EnemyType.Grub, ENEMY_PX.x, ENEMY_PX.y);

    combatTick(); // cooldown starts at 0 → fires immediately
    const shots = projectileQuery(world);
    expect(shots.length).toBe(1);
    expect(Projectile.targetId[shots[0]]).toBe(enemy);
  });

  it("the projectile travels, hits, and subtracts damage from the enemy", () => {
    placeTower(world, TowerType.Blossom, TOWER_CELL.x, TOWER_CELL.y);
    const enemy = spawnEnemy(world, EnemyType.Grub, ENEMY_PX.x, ENEMY_PX.y);
    expect(Health.current[enemy]).toBe(GRUB_HP);

    run(30); // ~0.5s: one shot lands (next shot is 1.2s away)
    expect(Health.current[enemy]).toBe(GRUB_HP - BLOSSOM_DMG); // 45
    expect(projectileQuery(world).length).toBe(0); // spent projectile recycled
  });

  it("applies Blossom slow on hit, reducing the enemy's speed while active", () => {
    placeTower(world, TowerType.Blossom, TOWER_CELL.x, TOWER_CELL.y);
    const enemy = spawnEnemy(world, EnemyType.Grub, ENEMY_PX.x, ENEMY_PX.y);

    run(30); // land one slow-tagged shot
    expect(Status.slowedUntil[enemy]).toBeGreaterThan(0);

    // One movement tick while slowed: grub base 60px/s → 60·(1-0.4)=36px/s east.
    PathFollowSystem(world, STEP);
    const speed = Math.hypot(Velocity.vx[enemy], Velocity.vy[enemy]);
    expect(speed).toBeCloseTo(60 * (1 - SLOW_REDUCTION), 3); // 36
    expect(speed).toBeLessThan(60); // demonstrably slowed
  });

  it("kills the enemy at 0 HP: credits the kill reward and recycles to pools", () => {
    placeTower(world, TowerType.Blossom, TOWER_CELL.x, TOWER_CELL.y);
    spawnEnemy(world, EnemyType.Grub, ENEMY_PX.x, ENEMY_PX.y);

    // 60hp / 15dmg = 4 hits, one per 1.2s cooldown → ~5s. Run 6s.
    run(360);

    expect(enemyQuery(world).length).toBe(0); // dead + released
    expect(getGold(world)).toBe(START_GOLD + GRUB_REWARD); // 150 + 8
    // Everything returned to the pools (no leak).
    expect(enemyPool.available()).toBe(enemyPool.capacity);
    expect(projectilePool.available()).toBe(projectilePool.capacity);
  });
});
