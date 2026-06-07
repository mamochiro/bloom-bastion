/**
 * Game-land ECS additions (not in the engine-generic `engine/ecs/world.ts`).
 *
 * `Hit` is a zero-field TAG component: presence alone marks a projectile that
 * has reached its target this frame. ProjectileSystem adds it on landing;
 * DamageSystem queries `[Projectile, Hit]`, applies the effect, then releases
 * the projectile (which strips the tag). Tagging via a component keeps the hot
 * path allocation-free — no per-frame arrays of "landed" ids.
 */
import { defineComponent, defineQuery } from "bitecs";
import { Projectile } from "../../engine/ecs/world";

/** Tag: this projectile has landed on its target (set by ProjectileSystem). */
export const Hit = defineComponent();

/** Landed projectiles awaiting damage application (DamageSystem). */
export const hitQuery = defineQuery([Projectile, Hit]);
