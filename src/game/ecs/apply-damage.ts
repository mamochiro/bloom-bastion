/**
 * Shared damage application — the ONE place HP is reduced, so armor (SPEC §6.2)
 * is honoured uniformly by every damage source: projectiles (DamageSystem),
 * chain lightning, and skills (Meteor). Zero-alloc.
 */
import { Enemy, Health } from "../../engine/ecs/world";
import { ENEMY_BY_TYPE } from "../config/enemies";

/** Apply `rawDamage` to `eid`, reduced by its armor: effective = raw·(1 − armor). */
export function applyDamage(eid: number, rawDamage: number): void {
  const armor = ENEMY_BY_TYPE[Enemy.typeId[eid]]?.armor ?? 0;
  Health.current[eid] -= rawDamage * (1 - armor);
}
