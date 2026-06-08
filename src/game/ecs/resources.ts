/**
 * Game-specific run resources (gold + lives) — a single-entity bitECS
 * singleton. Lives in GAME-land, NOT engine/world.ts (the engine is generic and
 * has no economy concept). ECS-pure: this is the authoritative store; React/
 * Zustand only ever read a throttled snapshot of it (via UISync, later slice).
 *
 * Starting values come from SPEC §6.5 "Starting Conditions" — Normal difficulty
 * (150 gold / 20 lives). Difficulty selection (Casual/Hardcore) is a later slice;
 * the slice hardcodes Normal.
 */
import { Types, addComponent, addEntity, defineComponent, defineQuery } from "bitecs";
import type { World } from "../../engine/ecs/world";

/** Run economy: current gold + remaining lives. One entity holds it. */
export const Resources = defineComponent({ gold: Types.f32, lives: Types.i32 });

const resourcesQuery = defineQuery([Resources]);

/** SPEC §6.5 Normal difficulty starting conditions. */
export const START_GOLD = 150;
export const START_LIVES = 20;

/** The singleton resources entity, created lazily by `initResources`. */
let resourcesEid = -1;

/**
 * Create (or re-seed) the resources singleton in `world` and return its eid.
 * Idempotent: a second call re-seeds the existing entity rather than making a
 * new one (handy for test resets and new-game restarts).
 */
export function initResources(world: World, gold = START_GOLD, lives = START_LIVES): number {
  // Reuse an existing singleton (cache or query) before creating — keeps test
  // resets and new-game restarts from leaking duplicate resource entities.
  let eid = resourcesEntity(world);
  if (eid < 0) {
    eid = addEntity(world);
    addComponent(world, Resources, eid);
    resourcesEid = eid;
  }
  Resources.gold[eid] = gold;
  Resources.lives[eid] = lives;
  return eid;
}

/** The resources singleton eid (looked up if not yet cached). Returns -1 if unseeded. */
export function resourcesEntity(world: World): number {
  if (resourcesEid >= 0) return resourcesEid;
  const ents = resourcesQuery(world);
  resourcesEid = ents.length > 0 ? ents[0] : -1;
  return resourcesEid;
}

/** Add `amount` gold to the singleton (no-op if unseeded). */
export function addGold(world: World, amount: number): void {
  const eid = resourcesEntity(world);
  if (eid >= 0) Resources.gold[eid] += amount;
}

/** Current gold (0 if unseeded). */
export function getGold(world: World): number {
  const eid = resourcesEntity(world);
  return eid >= 0 ? Resources.gold[eid] : 0;
}

/** Current lives (0 if unseeded). */
export function getLives(world: World): number {
  const eid = resourcesEntity(world);
  return eid >= 0 ? Resources.lives[eid] : 0;
}

/** Subtract `amount` lives, clamped at 0 (no-op if unseeded). */
export function loseLives(world: World, amount: number): void {
  const eid = resourcesEntity(world);
  if (eid < 0) return;
  Resources.lives[eid] = Math.max(0, Resources.lives[eid] - amount);
}

/** Test/restart hook: forget the cached singleton eid. */
export function _resetResourcesCache(): void {
  resourcesEid = -1;
}
