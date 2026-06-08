/**
 * Test helper: pool-integrated factories bind their eids to the engine `world`
 * singleton, so game unit tests share that one world (not `createWorld()`).
 * `resetGameWorld` drains every active enemy, projectile AND tower so the shared
 * world is fully clean between tests — otherwise leaked towers fire in later
 * tests (order-dependent failures under `--sequence.shuffle`).
 *
 * Hit-tagged projectiles are covered: they still carry Projectile+Position, so
 * they appear in `projectileQuery` and `releaseProjectile` strips the `Hit` tag.
 *
 * Test code may allocate freely (this is NOT the hot path), so the snapshot
 * copies via `Array.from` are fine here.
 */
import { type World, enemyQuery, projectileQuery, towerQuery } from "../../../src/engine/ecs/world";
import { DEFAULT_DIFFICULTY, setActiveDifficulty } from "../../../src/game/config/difficulty";
import { resetPhase } from "../../../src/game/ecs/game-state";
import { _resetResourcesCache } from "../../../src/game/ecs/resources";
import { releaseEnemy } from "../../../src/game/entities/create-enemy";
import { releaseProjectile } from "../../../src/game/entities/create-projectile";
import { releaseTower } from "../../../src/game/entities/create-tower";
import { SpawnSystem } from "../../../src/game/systems/spawn";

export function resetGameWorld(world: World): void {
  for (const eid of Array.from(enemyQuery(world))) releaseEnemy(world, eid);
  for (const eid of Array.from(projectileQuery(world))) releaseProjectile(world, eid);
  for (const eid of Array.from(towerQuery(world))) releaseTower(world, eid);
  _resetResourcesCache();
  resetPhase(); // back to 'playing' so the pause guard doesn't freeze the next test
  SpawnSystem.reset(); // re-arm the live wave instance (shared singleton)
  setActiveDifficulty(DEFAULT_DIFFICULTY); // back to 'normal' (1.0× mults) for isolation
}
