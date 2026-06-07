/**
 * restartGame — tear down the current run and arm a fresh one (SPEC §6.6 "Play
 * Again"). ECS-pure: clears authoritative game state only; the React store
 * re-syncs on the next UISync push.
 *
 * Steps:
 *   1. release every enemy / projectile / tower back to their pools (towers are
 *      destroyed — no TowerPool, §4.4),
 *   2. resetLevel() — clear placed-tower walls from the cost grid + rebuild the
 *      flow field,
 *   3. re-arm the live wave (SpawnSystem.reset()),
 *   4. re-seed resources to the SPEC §6.5 start (150 gold / 20 lives),
 *   5. clear any pending build selection,
 *   6. setPhase('playing') — unfreezes the simulation.
 *
 * Invoked from InputSystem (slot 1) when `consumeRestart()` fires, BEFORE the
 * pause guard, so it works while the sim is frozen on a finished run.
 */
import { type World, enemyQuery, projectileQuery, towerQuery } from "../engine/ecs/world";
import { clearBuild } from "../store/build";
import { resetPhase } from "./ecs/game-state";
import { initResources } from "./ecs/resources";
import { releaseEnemy } from "./entities/create-enemy";
import { releaseProjectile } from "./entities/create-projectile";
import { releaseTower } from "./entities/create-tower";
import { resetLevel } from "./map/level-1";
import { SpawnSystem } from "./systems/spawn";

export function restartGame(world: World): void {
  // 1. Recycle all live entities. Snapshot the query arrays first (releasing
  //    mutates them); restart is a cold path, so the copies are fine.
  for (const eid of Array.from(enemyQuery(world))) releaseEnemy(world, eid);
  for (const eid of Array.from(projectileQuery(world))) releaseProjectile(world, eid);
  for (const eid of Array.from(towerQuery(world))) releaseTower(world, eid);

  // 2–6. Rebuild the level, re-arm the wave, re-seed run state, unfreeze.
  resetLevel();
  SpawnSystem.reset();
  initResources(world); // 150 gold / 20 lives (SPEC §6.5 Normal)
  clearBuild();
  resetPhase();
}
