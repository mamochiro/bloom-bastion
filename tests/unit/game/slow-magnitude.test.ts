/**
 * Per-application slow magnitude + duration (SPEC §6.1 fidelity). Each slow
 * source now carries its OWN magnitude/duration (Blossom 40%/2s · Sugar L3
 * "Sticky Sugar" 20%/1s · Bubbler 30%/1.5s) via `applySlow` → `Status.slowFactor`
 * + `Status.slowedUntil`, which PathFollow reads while the timer is live.
 *
 * Covers: each tower's magnitude (factor + effective speed), the strongest-wins /
 * refresh-to-longer stacking rule, expiry restoring full speed, pooled-reuse not
 * leaking a stale slow, and the Freeze stun (full stop) being unaffected.
 */
import { addComponent } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";
import { advanceGameClock, resetGameClock } from "../../../src/engine/clock";
import { Status, Velocity, world } from "../../../src/engine/ecs/world";
import { gameTime } from "../../../src/engine/loop";
import { SPECIAL } from "../../../src/game/config/combat";
import { EnemyType } from "../../../src/game/config/enemies";
import { TowerType, towerLevelStats } from "../../../src/game/config/towers";
import { setDamageRng } from "../../../src/game/ecs/apply-damage";
import { Hit } from "../../../src/game/ecs/components";
import { applySlow } from "../../../src/game/ecs/slow";
import { releaseEnemy, spawnEnemy } from "../../../src/game/entities/create-enemy";
import { createProjectile } from "../../../src/game/entities/create-projectile";
import { SPAWN } from "../../../src/game/map/coords";
import { buildLevel } from "../../../src/game/map/level-1";
import { DamageSystem } from "../../../src/game/systems/damage";
import { PathFollowSystem } from "../../../src/game/systems/path-follow";
import { resetGameWorld } from "./_reset";

const STEP = 1 / 60;
const GRUB_BASE_PX = 60; // Grub speed 1.0 tile/s × CELL 60 × normal 1.0 mult

/** Fire a projectile (damage + special) at `target`, land it, run DamageSystem. */
function landHit(target: number, damage: number, special: number): void {
  const p = createProjectile(world, 0, 0, target, damage, special);
  addComponent(world, Hit, p);
  DamageSystem(world, 0);
}

/** Effective px/s after one PathFollow tick at the enemy's current cell. */
function effectiveSpeed(eid: number): number {
  PathFollowSystem(world, STEP);
  return Math.hypot(Velocity.vx[eid], Velocity.vy[eid]);
}

describe("per-application slow magnitude + duration (SPEC §6.1)", () => {
  beforeEach(() => {
    resetGameWorld(world);
    buildLevel(); // flow field (lane row 4 points +x)
    setDamageRng(() => 1); // no dodge
    resetGameClock(); // deterministic gameTime (slow timers are absolute)
  });

  it("Blossom slow = 40% (factor 0.6) for 2s; effective speed ×0.6", () => {
    const e = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y);
    landHit(e, 15, SPECIAL.Slow);
    expect(Status.slowFactor[e]).toBeCloseTo(0.6, 5);
    expect(Status.slowedUntil[e]).toBeCloseTo(gameTime() + 2, 5);
    expect(effectiveSpeed(e)).toBeCloseTo(GRUB_BASE_PX * 0.6, 3); // 36
  });

  it("Sugar L3 Sticky Sugar slow = 20% (factor 0.8) for 1s on SPLASHED enemies", () => {
    const special = towerLevelStats(TowerType.SugarCannon, 3).special;
    const primary = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y);
    const near = spawnEnemy(world, EnemyType.Grub, 330, SPAWN.y); // 0.5 tile away (in splash)

    landHit(primary, 50, special);
    expect(Status.slowFactor[near]).toBeCloseTo(0.8, 5);
    expect(Status.slowedUntil[near]).toBeCloseTo(gameTime() + 1, 5);
    expect(effectiveSpeed(near)).toBeCloseTo(GRUB_BASE_PX * 0.8, 3); // 48
    // The primary takes the direct hit but Sugar carries no SPECIAL.Slow → not slowed.
    expect(Status.slowedUntil[primary]).toBe(0);
  });

  it("Bubbler slow = 30% (factor 0.7) for 1.5s (disambiguated by the Push bit)", () => {
    const e = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y);
    landHit(e, 12, SPECIAL.Slow | SPECIAL.Push); // Push present → Bubbler, not Blossom
    expect(Status.slowFactor[e]).toBeCloseTo(0.7, 5);
    expect(Status.slowedUntil[e]).toBeCloseTo(gameTime() + 1.5, 5);
    expect(effectiveSpeed(e)).toBeCloseTo(GRUB_BASE_PX * 0.7, 3); // 42
  });

  it("a plain SPECIAL.Slow (no Push) is the Blossom 40%, NOT the Bubbler 30%", () => {
    const e = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y);
    landHit(e, 12, SPECIAL.Slow);
    expect(Status.slowFactor[e]).toBeCloseTo(0.6, 5); // Blossom, not 0.7
  });

  it("strongest magnitude wins while a slow is active (40% then 20% stays 40%)", () => {
    const e = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y);
    applySlow(e, 0.4, 2); // factor 0.6, until +2
    applySlow(e, 0.2, 1); // weaker while active → factor stays 0.6, timer not shortened
    expect(Status.slowFactor[e]).toBeCloseTo(0.6, 5);
    expect(Status.slowedUntil[e]).toBeCloseTo(gameTime() + 2, 5);
  });

  it("a STRONGER slow upgrades an active weaker one (20% then 40% → 40%)", () => {
    const e = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y);
    applySlow(e, 0.2, 1); // factor 0.8
    applySlow(e, 0.4, 2); // stronger → factor drops to 0.6
    expect(Status.slowFactor[e]).toBeCloseTo(0.6, 5);
  });

  it("duration refreshes to the LONGER expiry; a shorter re-slow never trims it", () => {
    const e = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y);
    applySlow(e, 0.4, 1); // until +1
    advanceGameClock(0.5); // now +0.5, still active
    applySlow(e, 0.4, 2); // until max(1, 0.5+2)=2.5
    expect(Status.slowedUntil[e]).toBeCloseTo(2.5, 5);
    applySlow(e, 0.4, 0.1); // shorter → max(2.5, 0.5+0.1)=2.5 unchanged
    expect(Status.slowedUntil[e]).toBeCloseTo(2.5, 5);
  });

  it("slow EXPIRES → full speed restored (factor no longer applied)", () => {
    const e = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y);
    landHit(e, 15, SPECIAL.Slow); // 40% for 2s
    expect(effectiveSpeed(e)).toBeCloseTo(GRUB_BASE_PX * 0.6, 3);
    advanceGameClock(2.5); // past slowedUntil
    expect(effectiveSpeed(e)).toBeCloseTo(GRUB_BASE_PX, 3); // 60 — full speed
  });

  it("pooled reuse: a recycled eid carries no stale slow", () => {
    const e = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y);
    landHit(e, 15, SPECIAL.Slow); // slow it
    expect(Status.slowedUntil[e]).toBeGreaterThan(0);
    releaseEnemy(world, e);
    const reused = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y); // likely same eid
    expect(Status.slowedUntil[reused]).toBe(0);
    expect(Status.slowFactor[reused]).toBe(0);
    expect(effectiveSpeed(reused)).toBeCloseTo(GRUB_BASE_PX, 3); // full speed, no stale slow
  });

  it("Freeze stun fully STOPS movement, unaffected by slowFactor", () => {
    const e = spawnEnemy(world, EnemyType.Grub, 300, SPAWN.y);
    landHit(e, 15, SPECIAL.Slow); // also slowed (factor 0.6)
    Status.stunnedUntil[e] = gameTime() + 1; // Freeze All path (full stop)
    PathFollowSystem(world, STEP);
    expect(Velocity.vx[e]).toBe(0);
    expect(Velocity.vy[e]).toBe(0);
  });
});
