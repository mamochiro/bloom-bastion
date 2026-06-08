import { describe, expect, it } from "vitest";
import { createObjectPool } from "../../src/engine/pool/object-pool";
import {
  ENEMY_POOL_SIZE,
  FLOATING_TEXT_POOL_SIZE,
  PARTICLE_POOL_SIZE,
  PROJECTILE_POOL_SIZE,
  enemyPool,
  floatingTextPool,
  particlePool,
  projectilePool,
} from "../../src/engine/pool/pools";

/** Assert a pool wasn't unexpectedly exhausted, narrowing `T | undefined` → `T`. */
function must<T>(v: T | undefined): T {
  if (v === undefined) throw new Error("pool unexpectedly exhausted");
  return v;
}

interface Cell {
  id: number;
}

describe("object pool primitive (SPEC §4.4)", () => {
  it("pre-allocates exactly `size` items at construction", () => {
    let made = 0;
    const pool = createObjectPool<Cell>(4, () => ({ id: made++ }));
    expect(made).toBe(4); // factory called up front, exactly size times
    expect(pool.capacity).toBe(4);
    expect(pool.available()).toBe(4);
    expect(pool.active()).toBe(0);
  });

  it("acquire/release recycles the SAME instances (no new allocation)", () => {
    let made = 0;
    const pool = createObjectPool<Cell>(2, () => ({ id: made++ }));
    const a = must(pool.acquire());
    const b = must(pool.acquire());
    expect(pool.active()).toBe(2);
    expect(made).toBe(2); // no extra factory calls
    pool.release(a);
    const c = pool.acquire();
    expect(c).toBe(a); // reused the released instance
    expect(made).toBe(2);
    void b;
  });

  it("returns undefined when exhausted (never grows)", () => {
    let made = 0;
    const pool = createObjectPool<Cell>(2, () => ({ id: made++ }));
    pool.acquire();
    pool.acquire();
    expect(pool.acquire()).toBeUndefined();
    expect(pool.capacity).toBe(2);
    expect(made).toBe(2);
  });

  it("does not grow capacity under sustained churn", () => {
    let made = 0;
    const pool = createObjectPool<Cell>(4, () => ({ id: made++ }));
    for (let i = 0; i < 10_000; i++) {
      const x = must(pool.acquire());
      pool.release(x);
    }
    expect(made).toBe(4); // factory never re-ran → no growth
    expect(pool.available()).toBe(4);
    expect(pool.active()).toBe(0);
  });

  it("runs the reset hook on release", () => {
    let resets = 0;
    const pool = createObjectPool<{ dirty: boolean }>(
      1,
      () => ({ dirty: true }),
      (item) => {
        item.dirty = false;
        resets++;
      },
    );
    const x = must(pool.acquire());
    x.dirty = true;
    pool.release(x);
    expect(resets).toBe(1);
    expect(x.dirty).toBe(false);
  });

  it("guards against over-release past capacity", () => {
    const pool = createObjectPool<Cell>(1, () => ({ id: 0 }));
    const x = must(pool.acquire());
    pool.release(x);
    pool.release(x); // extra release ignored, not double-counted
    expect(pool.available()).toBe(1);
  });
});

describe("pre-allocated §4.4 pools", () => {
  it("expose the SPEC capacities, fully pre-allocated", () => {
    expect(particlePool.capacity).toBe(PARTICLE_POOL_SIZE);
    expect(projectilePool.capacity).toBe(PROJECTILE_POOL_SIZE);
    expect(enemyPool.capacity).toBe(ENEMY_POOL_SIZE);
    expect(floatingTextPool.capacity).toBe(FLOATING_TEXT_POOL_SIZE);

    expect(PARTICLE_POOL_SIZE).toBe(500);
    expect(PROJECTILE_POOL_SIZE).toBe(100);
    expect(ENEMY_POOL_SIZE).toBe(200);
    expect(FLOATING_TEXT_POOL_SIZE).toBe(50);

    expect(particlePool.available()).toBe(PARTICLE_POOL_SIZE);
    expect(enemyPool.available()).toBe(ENEMY_POOL_SIZE);
  });

  it("eid pools hand out reusable entity ids", () => {
    const eid = must(enemyPool.acquire());
    expect(typeof eid).toBe("number");
    expect(enemyPool.active()).toBe(1);
    enemyPool.release(eid);
    expect(enemyPool.acquire()).toBe(eid); // recycled
    enemyPool.release(eid);
    expect(enemyPool.available()).toBe(ENEMY_POOL_SIZE);
  });

  it("Pixi pools reuse the same DisplayObject and hide it on release", () => {
    const g = must(particlePool.acquire());
    g.visible = true;
    particlePool.release(g);
    expect(g.visible).toBe(false); // reset hook hid it
    expect(particlePool.acquire()).toBe(g); // recycled instance
    particlePool.release(g);
  });
});
