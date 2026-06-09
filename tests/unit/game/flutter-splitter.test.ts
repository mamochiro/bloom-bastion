import { addComponent } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  Enemy,
  Health,
  Pathfinder,
  Position,
  enemyQuery,
  world,
} from "../../../src/engine/ecs/world";
import { ENEMY_BY_TYPE, ENEMY_FLAGS, EnemyType } from "../../../src/game/config/enemies";
import { WAVES } from "../../../src/game/config/waves";
import { Hit } from "../../../src/game/ecs/components";
import { getGold, initResources } from "../../../src/game/ecs/resources";
import { activateSkill, recordWaveCleared } from "../../../src/game/ecs/skills";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { createProjectile } from "../../../src/game/entities/create-projectile";
import { DamageSystem } from "../../../src/game/systems/damage";
import { createDeathSystem } from "../../../src/game/systems/death";
import { resetGameWorld } from "./_reset";

/** Land a single-target projectile dealing `dmg` on `target`, then DamageSystem. */
function hit(target: number, dmg: number): void {
  const p = createProjectile(world, 0, 0, target, dmg, 0);
  addComponent(world, Hit, p);
  DamageSystem(world, 0);
}

describe("Flutter (flying) + Splitter (split-on-death)", () => {
  beforeEach(() => {
    resetGameWorld(world);
    initResources(world);
  });

  it("Flutter config is EXACT §6.2 and spawns with the Flying flag", () => {
    const cfg = ENEMY_BY_TYPE[EnemyType.Flutter];
    expect(cfg).toMatchObject({ id: "flutter", hp: 50, speed: 2.0, reward: 12, flying: true });
    expect(EnemyType.Flutter).toBe(3);

    const f = spawnEnemy(world, EnemyType.Flutter, 100, 100);
    expect(Enemy.flags[f] & ENEMY_FLAGS.Flying).not.toBe(0);

    const g = spawnEnemy(world, EnemyType.Grub, 100, 100);
    expect(Enemy.flags[g] & ENEMY_FLAGS.Flying).toBe(0); // ground enemy → no flag
  });

  it("Meteor AoE skips flying Flutter but hits a ground Grub in the same cluster", () => {
    recordWaveCleared(0); // Meteor is unlock 0 — always available
    const flutter = spawnEnemy(world, EnemyType.Flutter, 300, 300);
    const grub = spawnEnemy(world, EnemyType.Grub, 310, 300); // both well within radius

    activateSkill(world, "meteor", 300, 300); // 200 AoE in a 2-tile radius

    expect(Health.current[flutter]).toBe(50); // flying → immune to ground-splash
    expect(Health.current[grub]).toBe(60 - 200); // ground → full AoE
  });

  it("a single-target projectile STILL damages Flutter (only splash is immune)", () => {
    const flutter = spawnEnemy(world, EnemyType.Flutter, 200, 200);
    hit(flutter, 15);
    expect(Health.current[flutter]).toBe(50 - 15); // targeted shot connects
  });

  it("Splitter config is EXACT §6.2; death bursts into exactly 2 Mini-Splitters on the flow field", () => {
    const cfg = ENEMY_BY_TYPE[EnemyType.Splitter];
    expect(cfg).toMatchObject({ id: "splitter", hp: 160, speed: 1.0, reward: 22 });
    expect(cfg.onDeathSplit).toEqual({ type: EnemyType.MiniSplitter, count: 2 });
    expect(EnemyType.Splitter).toBe(4);

    const death = createDeathSystem(() => false);
    const sp = spawnEnemy(world, EnemyType.Splitter, 250, 270);
    Health.current[sp] = 0;
    const goldBefore = getGold(world);

    death(world, 0);

    const alive = Array.from(enemyQuery(world));
    expect(alive.length).toBe(2); // splitter gone, 2 minis born
    for (const e of alive) {
      expect(Enemy.typeId[e]).toBe(EnemyType.MiniSplitter);
      expect(Pathfinder.followFlowField[e]).toBe(1); // on the flow field
      expect(Position.y[e]).toBe(270); // at the splitter's position
    }
    expect(getGold(world)).toBe(goldBefore + 22); // splitter's own reward
  });

  it("Mini-Splitter does NOT split again (no recursion) and awards 8g", () => {
    const cfg = ENEMY_BY_TYPE[EnemyType.MiniSplitter];
    expect(cfg).toMatchObject({ id: "mini_splitter", hp: 40, speed: 1.2, reward: 8 });
    expect(cfg.onDeathSplit).toBeUndefined();
    expect(EnemyType.MiniSplitter).toBe(5);

    const death = createDeathSystem(() => false);
    const mini = spawnEnemy(world, EnemyType.MiniSplitter, 250, 270);
    Health.current[mini] = 0;
    const goldBefore = getGold(world);

    death(world, 0);

    expect(enemyQuery(world).length).toBe(0); // no further minis
    expect(getGold(world)).toBe(goldBefore + 8);
  });

  it("WAVES introduces Flutter at wave 4 and Splitter at wave 9", () => {
    const has = (i: number, t: number) => WAVES[i].groups.some((g) => g.enemy === t);
    expect(has(3, EnemyType.Flutter)).toBe(true); // wave 4
    expect(has(8, EnemyType.Splitter)).toBe(true); // wave 9
  });
});
