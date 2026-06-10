/**
 * Run lifecycle — `startGame` (menu → playing) and `restartGame` (Play Again).
 * ECS-pure: clears/seeds authoritative game state only; the React store re-syncs
 * on the next UISync push. Both are invoked from InputSystem (slot 1) BEFORE the
 * pause guard, so they work while the sim is frozen (menu / won / lost).
 */
import { type World, enemyQuery, projectileQuery, towerQuery } from "../engine/ecs/world";
import { clearBuild } from "../store/build";
import {
  DIFFICULTY,
  type Difficulty,
  getActiveDifficulty,
  setActiveDifficulty,
} from "./config/difficulty";
import { setPhase } from "./ecs/game-state";
import { initResources } from "./ecs/resources";
import { resetSelection } from "./ecs/selection";
import { resetSkills } from "./ecs/skills";
import { releaseEnemy } from "./entities/create-enemy";
import { releaseProjectile } from "./entities/create-projectile";
import { releaseTower } from "./entities/create-tower";
import { resetLevel } from "./map/level-1";
import { resetBossSummon } from "./systems/path-follow";
import { SpawnSystem } from "./systems/spawn";

/** Release every live enemy / projectile / tower back to its pool. */
function clearEntities(world: World): void {
  // Snapshot the query arrays first (releasing mutates them); cold path.
  for (const eid of Array.from(enemyQuery(world))) releaseEnemy(world, eid);
  for (const eid of Array.from(projectileQuery(world))) releaseProjectile(world, eid);
  for (const eid of Array.from(towerQuery(world))) releaseTower(world, eid);
}

/**
 * Start a run at `difficulty` (from the start screen). Sets the active
 * difficulty (drives the §6.5 HP/speed mults), seeds the run economy to that
 * difficulty's gold/lives, re-arms the wave, clears any build selection, and
 * unfreezes the sim. The board is already clean in 'menu', so no teardown.
 */
export function startGame(world: World, difficulty: Difficulty): void {
  setActiveDifficulty(difficulty);
  const d = DIFFICULTY[difficulty];
  initResources(world, d.gold, d.lives);
  SpawnSystem.reset(); // wave 1
  resetSkills(); // cooldowns, buffs, clearedWaves → 0
  resetBossSummon(); // Neon Dragon summon timer
  resetSelection(); // clear tower selection
  clearBuild();
  setPhase("playing");
}

/**
 * Restart the run (Play Again) — KEEPS the current active difficulty (replays
 * the same one). Tears down all entities, rebuilds the level + flow field,
 * re-arms the wave, re-seeds resources to the active difficulty's gold/lives,
 * clears the build selection, and unfreezes the sim.
 */
export function restartGame(world: World): void {
  clearEntities(world);
  resetLevel();
  SpawnSystem.reset();
  resetSkills(); // cooldowns, buffs, clearedWaves → 0
  resetBossSummon(); // Neon Dragon summon timer
  resetSelection(); // clear tower selection
  const d = DIFFICULTY[getActiveDifficulty()];
  initResources(world, d.gold, d.lives); // same difficulty's start (SPEC §6.5)
  clearBuild();
  setPhase("playing");
}
