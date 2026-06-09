import { addComponent } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";
import { Health, Renderable, world } from "../../../src/engine/ecs/world";
import { EnemyType } from "../../../src/game/config/enemies";
import { TINT } from "../../../src/game/config/tokens";
import { Hit } from "../../../src/game/ecs/components";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { createProjectile } from "../../../src/game/entities/create-projectile";
import { DamageSystem } from "../../../src/game/systems/damage";
import { resetGameWorld } from "./_reset";

/** Land a projectile dealing `dmg` on `target`, then run DamageSystem (boss phases). */
function hit(target: number, dmg: number): void {
  const p = createProjectile(world, 0, 0, target, dmg, 0);
  addComponent(world, Hit, p);
  DamageSystem(world, 0);
}

describe("Neon Dragon P2 enrage tint", () => {
  beforeEach(() => resetGameWorld(world));

  it("spawns with baseTint 0 (no enrage)", () => {
    const dragon = spawnEnemy(world, EnemyType.NeonDragon, 100, 100);
    expect(Renderable.baseTint[dragon]).toBe(0);
  });

  it("P2 transition (≤50%) sets baseTint to the danger color, fire-once", () => {
    const dragon = spawnEnemy(world, EnemyType.NeonDragon, 100, 100);
    Health.current[dragon] = 2100; // just above 50% of 4000
    expect(Renderable.baseTint[dragon]).toBe(0);

    hit(dragon, 200); // → 1900 (47.5%) crosses 50% → enrage
    expect(Renderable.baseTint[dragon]).toBe(TINT.danger);

    // A later hit does NOT re-apply (phase fired once); the tint stays the red.
    hit(dragon, 50);
    expect(Renderable.baseTint[dragon]).toBe(TINT.danger);
  });

  it("a P1 dragon (above 50%) keeps baseTint 0", () => {
    const dragon = spawnEnemy(world, EnemyType.NeonDragon, 100, 100);
    Health.current[dragon] = 3000; // 75% → still P1
    hit(dragon, 100); // → 2900, no phase crossed
    expect(Renderable.baseTint[dragon]).toBe(0);
  });

  it("non-dragon enemies never get the enrage tint", () => {
    const king = spawnEnemy(world, EnemyType.CandyKing, 100, 100);
    Health.current[king] = 100; // well into its phases
    hit(king, 50); // Candy King phases fire, but no setFlying → no baseTint
    expect(Renderable.baseTint[king]).toBe(0);

    const grub = spawnEnemy(world, EnemyType.Grub, 200, 200);
    hit(grub, 5);
    expect(Renderable.baseTint[grub]).toBe(0);
  });

  it("a recycled eid resets baseTint to 0 on respawn", () => {
    const dragon = spawnEnemy(world, EnemyType.NeonDragon, 100, 100);
    Renderable.baseTint[dragon] = TINT.danger; // simulate a prior enrage

    // Reuse the same eid (release → re-acquire from the pool).
    resetGameWorld(world);
    const reused = spawnEnemy(world, EnemyType.Grub, 100, 100);
    expect(Renderable.baseTint[reused]).toBe(0);
  });
});
