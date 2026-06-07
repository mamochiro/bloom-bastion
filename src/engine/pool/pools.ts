import { Graphics, Text } from "pixi.js";
import { world } from "../ecs/world";
import { type ObjectPool, createEntityPool, createObjectPool } from "./object-pool";

/**
 * Pre-allocated hot-path pools (SPEC §4.4). Capacities are fixed; all entities
 * and DisplayObjects are created at module load so the game loop never
 * allocates. TowerPool is intentionally absent — towers are low-count and
 * lifecycle-managed directly.
 *
 * Integration note (later slice): gameplay's spawn/projectile factories acquire
 * from the eid pools and add/set components; on death they remove components
 * and release. The Pixi pools are driven by the particle/floating-text systems.
 */

// --- Capacities (SPEC §4.4) ------------------------------------------------
export const PARTICLE_POOL_SIZE = 500;
export const PROJECTILE_POOL_SIZE = 100;
export const ENEMY_POOL_SIZE = 200;
export const FLOATING_TEXT_POOL_SIZE = 50;

// --- eid-backed pools (ECS entities) ---------------------------------------
// Caller owns components: add/set on acquire, remove on release (integration TBD).

/** Pooled projectile entities (eid). */
export const projectilePool: ObjectPool<number> = createEntityPool(world, PROJECTILE_POOL_SIZE);

/** Pooled enemy entities (eid). */
export const enemyPool: ObjectPool<number> = createEntityPool(world, ENEMY_POOL_SIZE);

// --- Pixi-object pools (visual only, no ECS) -------------------------------
// Hidden on release; the consuming system positions + shows them on acquire.

/** Hide a DisplayObject on release (reset hook). */
function hideOnRelease(obj: { visible: boolean }): void {
  obj.visible = false;
}

/** Pooled particle sprites (placeholder `Graphics`; real art assigned by the system). */
export const particlePool: ObjectPool<Graphics> = createObjectPool<Graphics>(
  PARTICLE_POOL_SIZE,
  () => {
    const g = new Graphics();
    g.visible = false;
    return g;
  },
  hideOnRelease,
);

/** Pooled floating-text labels (damage numbers, gold gain, etc.). */
export const floatingTextPool: ObjectPool<Text> = createObjectPool<Text>(
  FLOATING_TEXT_POOL_SIZE,
  () => {
    // No colour/style set here — gameplay assigns text + token-derived tint on
    // acquire (keeps the engine free of design hex).
    const t = new Text({ text: "" });
    t.visible = false;
    return t;
  },
  hideOnRelease,
);
