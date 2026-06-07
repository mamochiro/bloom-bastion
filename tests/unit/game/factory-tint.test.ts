import { beforeEach, describe, expect, it } from "vitest";
import { Renderable, world } from "../../../src/engine/ecs/world";
import { EnemyType } from "../../../src/game/config/enemies";
import { TowerType } from "../../../src/game/config/towers";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { createProjectile } from "../../../src/game/entities/create-projectile";
import { placeTower } from "../../../src/game/entities/create-tower";
import { resetGameWorld } from "./_reset";

/**
 * REGRESSION GUARD (qa): `Renderable.tint` is FX-ONLY (LOCKED). Factories must
 * leave it 0 at spawn so the RenderSystem shows each sprite's NATIVE SVG colour;
 * a non-zero base tint multiplies the atlas off its real colours (the
 * blue-Snail-times-purple-token bug). Non-zero tint is reserved for transient
 * hit-flash / status FX written later — never the base.
 */
describe("factories leave Renderable.tint = 0 (native sprite colours)", () => {
  beforeEach(() => resetGameWorld(world));

  it("spawnEnemy (Grub) → tint 0", () => {
    const eid = spawnEnemy(world, EnemyType.Grub, 100, 100);
    expect(Renderable.tint[eid]).toBe(0);
  });

  it("spawnEnemy (Snail) → tint 0", () => {
    const eid = spawnEnemy(world, EnemyType.Snail, 100, 100);
    expect(Renderable.tint[eid]).toBe(0);
  });

  it("placeTower (Blossom) → tint 0", () => {
    const eid = placeTower(world, TowerType.Blossom, 5, 3);
    expect(Renderable.tint[eid]).toBe(0);
  });

  it("createProjectile → tint 0", () => {
    const target = spawnEnemy(world, EnemyType.Grub, 200, 200);
    const eid = createProjectile(world, 100, 100, target, 15, 0);
    expect(Renderable.tint[eid]).toBe(0);
  });
});
