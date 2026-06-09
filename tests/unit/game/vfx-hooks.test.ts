import { addComponent } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";
import { Health, world } from "../../../src/engine/ecs/world";
import { EnemyType } from "../../../src/game/config/enemies";
import { setDamageRng } from "../../../src/game/ecs/apply-damage";
import { Hit } from "../../../src/game/ecs/components";
import { initResources } from "../../../src/game/ecs/resources";
import { activateSkill, recordWaveCleared } from "../../../src/game/ecs/skills";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { createProjectile } from "../../../src/game/entities/create-projectile";
import { DamageSystem } from "../../../src/game/systems/damage";
import { createDeathSystem } from "../../../src/game/systems/death";
import { type VfxSink, setVfx } from "../../../src/game/vfx";
import { resetGameWorld } from "./_reset";

/** A spy VFX sink recording every call. */
function makeSpy() {
  const calls = {
    burst: [] as { x: number; y: number; tint: number; count?: number }[],
    text: [] as { text: string; x: number; y: number; tint?: number }[],
    flash: [] as number[],
  };
  const sink: VfxSink = {
    spawnBurst: (x, y, tint, count) => calls.burst.push({ x, y, tint, count }),
    spawnFloatingText: (text, x, y, tint) => calls.text.push({ text, x, y, tint }),
    flashEntity: (eid) => calls.flash.push(eid),
  };
  return { sink, calls };
}

/** Land a single-target projectile dealing `dmg` on `target`, then DamageSystem. */
function hit(target: number, dmg: number): void {
  const p = createProjectile(world, 0, 0, target, dmg, 0);
  addComponent(world, Hit, p);
  DamageSystem(world, 0);
}

const death = createDeathSystem(() => false);

describe("VFX hooks fire on combat events", () => {
  beforeEach(() => {
    resetGameWorld(world); // resets the VFX sink to no-op
    initResources(world);
  });

  it("DamageSystem flashes the target on a landing hit", () => {
    const { sink, calls } = makeSpy();
    setVfx(sink);
    const grub = spawnEnemy(world, EnemyType.Grub, 100, 100);

    hit(grub, 15);

    expect(calls.flash).toContain(grub);
  });

  it("DamageSystem does NOT flash on a Shade dodge (0-damage)", () => {
    const { sink, calls } = makeSpy();
    setVfx(sink);
    setDamageRng(() => 0); // force dodge
    const shade = spawnEnemy(world, EnemyType.Shade, 100, 100);

    hit(shade, 30);

    expect(Health.current[shade]).toBe(90); // dodged
    expect(calls.flash).toHaveLength(0); // no flash
  });

  it("DeathSystem bursts + floats the reward on an enemy death", () => {
    const { sink, calls } = makeSpy();
    setVfx(sink);
    const grub = spawnEnemy(world, EnemyType.Grub, 250, 270);
    Health.current[grub] = 0;

    death(world, 0);

    expect(calls.burst).toHaveLength(1);
    expect(calls.burst[0]).toMatchObject({ x: 250, y: 270, count: 12 });
    expect(calls.text).toHaveLength(1);
    expect(calls.text[0].text).toBe("+8g"); // grub reward
  });

  it("a boss death gets a BIGGER burst", () => {
    const { sink, calls } = makeSpy();
    setVfx(sink);
    const king = spawnEnemy(world, EnemyType.CandyKing, 300, 270);
    Health.current[king] = 0;

    death(world, 0);

    expect(calls.burst[0].count).toBe(40); // boss burst
    expect(calls.text[0].text).toBe("+100g");
  });

  it("Meteor spawns an impact burst at the strike point", () => {
    const { sink, calls } = makeSpy();
    setVfx(sink);
    recordWaveCleared(0); // Meteor unlock 0

    activateSkill(world, "meteor", 333, 222);

    const meteorBurst = calls.burst.find((b) => b.x === 333 && b.y === 222);
    expect(meteorBurst).toBeDefined();
    expect(meteorBurst?.count).toBe(30);
  });

  it("Neon Dragon P2 transition emits a one-time enrage burst", () => {
    const { sink, calls } = makeSpy();
    setVfx(sink);
    const dragon = spawnEnemy(world, EnemyType.NeonDragon, 400, 270);
    Health.current[dragon] = 2100; // just above 50%

    hit(dragon, 200); // → 1900 (47.5%) crosses 50% → enrage
    const enrage = calls.burst.filter((b) => b.x === 400 && b.y === 270 && b.count === 40);
    expect(enrage).toHaveLength(1);

    // Firing again does not re-burst (phase fires once).
    hit(dragon, 50);
    const enrage2 = calls.burst.filter((b) => b.x === 400 && b.y === 270 && b.count === 40);
    expect(enrage2).toHaveLength(1);
  });
});
