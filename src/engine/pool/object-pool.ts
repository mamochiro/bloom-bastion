import { type IWorld, addEntity } from "bitecs";

/**
 * Generic object pool (SPEC §4.4) — pre-allocate N up front, then recycle via a
 * free-list with ZERO allocation in steady state. The free-list is a
 * fixed-capacity stack: `acquire` pops, `release` pushes; the backing array
 * never grows and no objects are created after warmup. When the pool is
 * exhausted `acquire` returns `undefined` (it does NOT grow — that would
 * allocate in the hot path).
 *
 * One primitive backs both pool flavours used in §4.4:
 *   - **eid-backed** (`T = number`): pooled bitECS entities — see {@link createEntityPool}.
 *     Used by ProjectilePool / EnemyPool. The caller owns components (add on
 *     acquire, remove on release); the pool only recycles the entity id.
 *   - **Pixi-object-backed** (`T = Graphics | Text | …`): pooled DisplayObjects —
 *     used by ParticlePool / FloatingTextPool. Supply a `reset` that hides /
 *     clears the object on release.
 */
export interface ObjectPool<T> {
  /** Fixed number of items pre-allocated; never changes. */
  readonly capacity: number;
  /** Take an item from the free-list, or `undefined` if exhausted (no growth). */
  acquire(): T | undefined;
  /** Return an item to the free-list (runs `reset` if provided). Idempotent-guarded. */
  release(item: T): void;
  /** How many items are currently free. */
  available(): number;
  /** How many items are currently checked out. */
  active(): number;
}

/**
 * Create a pool of `size` items produced by `factory(index)` (called exactly
 * `size` times, at construction only). `reset(item)` runs on each `release`.
 */
export function createObjectPool<T>(
  size: number,
  factory: (index: number) => T,
  reset?: (item: T) => void,
): ObjectPool<T> {
  // Fixed-length backing stack. Slots are reused; length never changes.
  const free: T[] = new Array<T>(size);
  for (let i = 0; i < size; i++) free[i] = factory(i);
  let freeCount = size;

  return {
    capacity: size,
    acquire(): T | undefined {
      if (freeCount === 0) return undefined; // exhausted — never grow
      return free[--freeCount];
    },
    release(item: T): void {
      if (freeCount >= size) return; // guard double-release / foreign item
      if (reset) reset(item);
      free[freeCount++] = item;
    },
    available(): number {
      return freeCount;
    },
    active(): number {
      return size - freeCount;
    },
  };
}

/**
 * Create an eid-backed pool: pre-allocates `size` bitECS entities in `world`
 * (componentless, so they match no query until the caller adds components).
 * `reset(eid)` runs on release — wire component stripping there during
 * gameplay integration. The entities stay alive for the pool's lifetime; the
 * pool recycles ids rather than calling `removeEntity` (which would churn
 * bitECS' recycle list).
 */
export function createEntityPool(
  world: IWorld,
  size: number,
  reset?: (eid: number) => void,
): ObjectPool<number> {
  return createObjectPool<number>(size, () => addEntity(world), reset);
}
