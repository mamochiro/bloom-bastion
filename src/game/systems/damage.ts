/**
 * DamageSystem (SPEC §4.2 slot 6) — apply landed projectiles' effects.
 *
 * Per `[Projectile, Hit]`: subtract damage from the target's Health, and if the
 * shot carries the slow flag, (re)arm the target's slow timer to
 * `gameTime() + SLOW_DURATION_S`. Then recycle the projectile. DoT/stun hooks
 * land in a later slice.
 *
 * Iterates backward (releasing strips `Hit`, swap-popping the query array).
 */
import { hasComponent } from "bitecs";
import { Enemy, Health, Projectile, Status, type World } from "../../engine/ecs/world";
import { gameTime } from "../../engine/loop";
import type { System } from "../../engine/loop";
import { SLOW_DURATION_S, SPECIAL } from "../config/combat";
import { ENEMY_BY_TYPE } from "../config/enemies";
import { hitQuery } from "../ecs/components";
import { isSimPaused } from "../ecs/game-state";
import { releaseProjectile } from "../entities/create-projectile";

export const DamageSystem: System = (world: World, _dt: number): World => {
  if (isSimPaused()) return world; // frozen on win/lose
  const hits = hitQuery(world);
  for (let i = hits.length - 1; i >= 0; i--) {
    const proj = hits[i];
    const target = Projectile.targetId[proj];

    if (hasComponent(world, Health, target)) {
      // Armor (SPEC §6.2): effective = damage * (1 - armor). Snail 0.5 → half;
      // Grub (armor undefined) → full.
      const armor = ENEMY_BY_TYPE[Enemy.typeId[target]]?.armor ?? 0;
      Health.current[target] -= Projectile.damage[proj] * (1 - armor);

      if ((Projectile.special[proj] & SPECIAL.Slow) !== 0 && hasComponent(world, Status, target)) {
        // Slow magnitude is read by PathFollowSystem (SLOW_REDUCTION); here we
        // only stamp the expiry. Single slow source this slice (Blossom).
        Status.slowedUntil[target] = gameTime() + SLOW_DURATION_S;
      }
    }

    releaseProjectile(world, proj);
  }
  return world;
};
