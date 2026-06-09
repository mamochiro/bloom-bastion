import { addComponent, addEntity } from "bitecs";
import { afterEach, describe, expect, it } from "vitest";
import { Position, Renderable, world } from "../../src/engine/ecs/world";
import { frameStep, startLoop, stopLoop } from "../../src/engine/loop";
import { floatingTextPool, particlePool } from "../../src/engine/pool/pools";
import {
  AnimationSystem,
  flashEntity,
  spawnBurst,
  spawnFloatingText,
} from "../../src/engine/renderer/vfx";

/** Reset the game clock to 0 without leaving a live rAF running. */
function resetClock(): void {
  startLoop();
  stopLoop();
}

/** Drive the VFX system directly for `seconds`, no real stage needed. */
function advanceVfx(seconds: number, step = 0.05): void {
  for (let t = 0; t < seconds; t += step) AnimationSystem(world, step);
}

afterEach(() => {
  // Drain any lingering actives so pools return to full between tests.
  advanceVfx(2);
});

describe("VFX particle bursts", () => {
  it("acquires from the pool on spawn and releases on expiry (zero growth)", () => {
    const before = particlePool.available();
    spawnBurst(100, 100, 0xff4d6d, 10);
    expect(particlePool.available()).toBe(before - 10); // 10 acquired

    advanceVfx(1); // particle life ≤ 0.55s → all expired
    expect(particlePool.available()).toBe(before); // all released
  });

  it("skips gracefully when the pool is exhausted (no throw, no negative)", () => {
    const cap = particlePool.capacity;
    expect(() => spawnBurst(0, 0, 0xffffff, cap + 25)).not.toThrow();
    expect(particlePool.available()).toBe(0); // capped at capacity, never negative
    advanceVfx(1);
    expect(particlePool.available()).toBe(cap);
  });
});

describe("VFX floating text", () => {
  it("acquires one label and releases it after drift", () => {
    const before = floatingTextPool.available();
    spawnFloatingText("99", 50, 50, 0x44e08a);
    expect(floatingTextPool.available()).toBe(before - 1);

    advanceVfx(1.2); // FLOAT_TEXT_LIFE 0.9s → expired
    expect(floatingTextPool.available()).toBe(before);
  });
});

describe("hit-flash", () => {
  it("sets a transient tint then AnimationSystem clears it after the window", () => {
    resetClock(); // gameTime() == 0
    const eid = addEntity(world);
    addComponent(world, Position, eid);
    addComponent(world, Renderable, eid);
    Renderable.tint[eid] = 0;
    Renderable.flashUntil[eid] = 0;

    flashEntity(eid); // flashUntil = 0 + 0.1
    expect(Renderable.tint[eid]).not.toBe(0);
    expect(Renderable.flashUntil[eid]).toBeGreaterThan(0);

    frameStep(0.05, false); // gameTime 0.05 < 0.1 → still flashed
    expect(Renderable.tint[eid]).not.toBe(0);

    frameStep(0.05, false); // gameTime 0.10 >= 0.1 → cleared
    frameStep(0.05, false);
    expect(Renderable.tint[eid]).toBe(0);
    expect(Renderable.flashUntil[eid]).toBe(0);
  });
});
