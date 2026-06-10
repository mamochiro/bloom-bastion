import { addComponent } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";
import { Enemy, Health, Position, Status, world } from "../../../src/engine/ecs/world";
import { SPECIAL } from "../../../src/game/config/combat";
import { ENEMY_FLAGS, EnemyType } from "../../../src/game/config/enemies";
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
import { SPAWN } from "../../../src/game/map/coords";
import { buildLevel } from "../../../src/game/map/level-1";
import { DamageSystem } from "../../../src/game/systems/damage";
import { resetGameWorld } from "./_reset";

const BUBBLER = TowerType.Bubbler;
const CELL = 60;

/** Fire a projectile (damage + special) at `target`, land it, run DamageSystem. */
function landHit(target: number, damage: number, special: number): void {
  const p = createProjectile(world, 0, 0, target, damage, special);
  addComponent(world, Hit, p);
  DamageSystem(world, 0);
}

describe("Bubbler (crowd-control) — SPEC §6.1", () => {
  beforeEach(() => {
    resetGameWorld(world);
    buildLevel(); // flow field for push-back
    setDamageRng(() => 1); // no dodge
  });

  it("level stats + bits (L1 slow+push, L2 +pushBig+DMG, L3 +line)", () => {
    expect(towerLevelStats(BUBBLER, 1)).toMatchObject({ damage: 12, range: 2.0, cooldown: 0.8 });
    expect(towerLevelStats(BUBBLER, 2)).toMatchObject({ damage: 20 });
    expect(towerLevelStats(BUBBLER, 3)).toMatchObject({ damage: 20 });

    const s1 = towerLevelStats(BUBBLER, 1).special;
    expect(s1 & SPECIAL.Slow).not.toBe(0);
    expect(s1 & SPECIAL.Push).not.toBe(0);
    expect(s1 & SPECIAL.PushBig).toBe(0);
    expect(towerLevelStats(BUBBLER, 2).special & SPECIAL.PushBig).not.toBe(0);
    expect(towerLevelStats(BUBBLER, 3).special & SPECIAL.Line).not.toBe(0);
  });

  it("push-back shoves the target backward 0.5 tile along the reverse flow (1.0 with PushBig)", () => {
    // Enemy mid-lane (row 4). Flow there points +x (toward goal); push = −x.
    const e1 = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y);
    landHit(e1, 12, SPECIAL.Push);
    expect(Position.x[e1]).toBeCloseTo(300 - 0.5 * CELL, 5); // 270

    const e2 = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y);
    landHit(e2, 12, SPECIAL.Push | SPECIAL.PushBig);
    expect(Position.x[e2]).toBeCloseTo(300 - 1.0 * CELL, 5); // 240
  });

  it("push CLAMPS at the map edge — no teleport off-map / behind spawn", () => {
    // At the spawn cell, flow points +x; pushing −x would go off the west edge.
    const e = spawnEnemy(world, EnemyType.Grub, SPAWN.x, SPAWN.y); // (30, 270)
    const x0 = Position.x[e];
    landHit(e, 12, SPECIAL.Push | SPECIAL.PushBig); // would push to x ≈ −30 (off-map)
    expect(Position.x[e]).toBe(x0); // skipped — stayed put (clamp)
  });

  it("slow is applied on hit", () => {
    const e = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y);
    landHit(e, 12, SPECIAL.Slow | SPECIAL.Push);
    expect(Status.slowedUntil[e]).toBeGreaterThan(0);
  });

  it("L3 Tsunami hits MULTIPLE enemies along the lane; off-line enemy missed", () => {
    const special = towerLevelStats(BUBBLER, 3).special;
    const primary = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y);
    const onLine1 = spawnEnemy(world, EnemyType.Grub, 360, SPAWN.y); // +1 tile along lane
    const onLine2 = spawnEnemy(world, EnemyType.Grub, 240, SPAWN.y); // −1 tile
    const offLine = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y + 90); // 1.5 tiles off the lane

    landHit(primary, 20, special);

    expect(Health.current[primary]).toBe(60 - 20); // direct hit
    expect(Health.current[onLine1]).toBe(60 - 20); // line hit
    expect(Health.current[onLine2]).toBe(60 - 20);
    expect(Health.current[offLine]).toBe(60); // off the lane line
    expect(Status.slowedUntil[onLine1]).toBeGreaterThan(0); // line also slows
  });

  it("Tsunami line skips FLYING enemies", () => {
    const special = towerLevelStats(BUBBLER, 3).special;
    const primary = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y);
    const flutter = spawnEnemy(world, EnemyType.Flutter, 360, SPAWN.y);
    expect(Enemy.flags[flutter] & ENEMY_FLAGS.Flying).not.toBe(0);

    landHit(primary, 20, special);
    expect(Health.current[flutter]).toBe(50); // flier untouched by the line
  });

  it("economy: 80 / +70 / +140 + sell derivation", () => {
    expect(upgradeInfo(BUBBLER, 1)).toEqual({ label: "Tidal Wave", cost: 70 });
    expect(upgradeInfo(BUBBLER, 2)).toEqual({ label: "Tsunami", cost: 140 });
    expect(upgradeInfo(BUBBLER, 3)).toBeNull();

    expect(totalInvested(BUBBLER, 1)).toBe(80);
    expect(totalInvested(BUBBLER, 2)).toBe(150); // 80 + 70
    expect(totalInvested(BUBBLER, 3)).toBe(290); // 80 + 70 + 140
    expect(sellValue(BUBBLER, 1)).toBe(Math.floor(80 * 0.6)); // 48
    expect(sellValue(BUBBLER, 3)).toBe(Math.floor(290 * 0.4)); // 116
  });

  it("completes the 6-tower set (PLACEABLE_TOWERS has all 6)", () => {
    expect(PLACEABLE_TOWERS).toContain(BUBBLER);
    expect(TowerType.Bubbler).toBe(5);
    expect(PLACEABLE_TOWERS.length).toBe(6);
  });

  it("existing-special guard: a plain Slow shot does NOT push (Bubbler bits are isolated)", () => {
    const g = spawnEnemy(world, EnemyType.Grub, 500, SPAWN.y);
    landHit(g, 15, SPECIAL.Slow); // no Push bit → no knockback
    expect(Position.x[g]).toBe(500); // unmoved
    expect(Status.slowedUntil[g]).toBeGreaterThan(0);
  });
});
