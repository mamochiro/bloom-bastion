/**
 * ProjectileSystem (SPEC §4.2 slot 5) — homing movement + hit detection.
 *
 * Per projectile: if its target is gone (released/dead → no Position+Health),
 * recycle the projectile. Otherwise steer toward the target at `PROJECTILE_SPEED`
 * and, once within `HIT_RADIUS`, tag it `Hit` (keeping `targetId`+`damage`+
 * `special`) for DamageSystem (slot 6, same frame) to resolve.
 *
 * Iterates backward so releasing a projectile (swap-pop on the query's dense
 * array) never skips an entry — zero-alloc, no snapshot copy.
 */
import { addComponent, hasComponent } from "bitecs";
import { Health, Position, Projectile, type World, projectileQuery } from "../../engine/ecs/world";
import type { System } from "../../engine/loop";
import { HIT_RADIUS, PROJECTILE_SPEED } from "../config/combat";
import { Hit } from "../ecs/components";
import { isSimPaused } from "../ecs/game-state";
import { releaseProjectile } from "../entities/create-projectile";

const HIT_RADIUS_SQ = HIT_RADIUS * HIT_RADIUS;

export const ProjectileSystem: System = (world: World, dt: number): World => {
  if (isSimPaused()) return world; // frozen on win/lose
  const ents = projectileQuery(world);
  for (let i = ents.length - 1; i >= 0; i--) {
    const eid = ents[i];
    if (hasComponent(world, Hit, eid)) continue; // already landed (awaiting Damage)

    const target = Projectile.targetId[eid];
    // Target invalid (despawned/recycled) → drop the shot.
    if (!hasComponent(world, Position, target) || !hasComponent(world, Health, target)) {
      releaseProjectile(world, eid);
      continue;
    }

    const dx = Position.x[target] - Position.x[eid];
    const dy = Position.y[target] - Position.y[eid];
    const distSq = dx * dx + dy * dy;

    if (distSq <= HIT_RADIUS_SQ) {
      addComponent(world, Hit, eid); // landed → DamageSystem resolves it
      continue;
    }

    const dist = Math.sqrt(distSq);
    const step = PROJECTILE_SPEED * dt;
    if (step >= dist) {
      // Would overshoot this frame → snap onto target and mark landed.
      Position.x[eid] = Position.x[target];
      Position.y[eid] = Position.y[target];
      addComponent(world, Hit, eid);
      continue;
    }
    const inv = step / dist;
    Position.x[eid] += dx * inv;
    Position.y[eid] += dy * inv;
  }
  return world;
};
