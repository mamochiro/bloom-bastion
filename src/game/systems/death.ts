/**
 * DeathSystem (SPEC §4.2 slot 7) — reward + cleanup for dead enemies, AND the
 * fold-in home of win/lose detection (no new §4.2 slot — reordering needs an
 * ADR). Runs last among the simulation systems, so it sees the frame's final
 * lives + enemy count.
 *
 * Per enemy with Health ≤ 0: grant the SPEC §6.2 kill reward, recycle to the
 * pool. Then (SPEC §6.6):
 *   - lives ≤ 0                         → setPhase('lost')
 *   - wave fully spawned && 0 enemies   → setPhase('won')   (last wave cleared;
 *                                          multi-wave 'won' arrives with waves)
 * Once the phase leaves 'playing' the pause guard freezes this + the other sim
 * systems next frame.
 *
 * Iterates backward (releasing strips Enemy, swap-popping the query array).
 * Death particles / floating text are DEFERRED (pure juice, later slice).
 */
import { Enemy, Health, type World, enemyQuery } from "../../engine/ecs/world";
import type { System } from "../../engine/loop";
import { ENEMY_BY_TYPE } from "../config/enemies";
import { isSimPaused, setPhase } from "../ecs/game-state";
import { addGold, getLives } from "../ecs/resources";
import { releaseEnemy } from "../entities/create-enemy";
import { SpawnSystem } from "./spawn";

/**
 * Build a DeathSystem. `isWaveComplete` defaults to the live wave instance;
 * tests inject a stub to control the 'won' condition deterministically.
 */
export function createDeathSystem(
  isWaveComplete: () => boolean = () => SpawnSystem.isComplete(),
): System {
  return (world: World, _dt: number): World => {
    if (isSimPaused()) return world; // run already ended → frozen

    const enemies = enemyQuery(world);
    for (let i = enemies.length - 1; i >= 0; i--) {
      const eid = enemies[i];
      if (Health.current[eid] > 0) continue;

      const cfg = ENEMY_BY_TYPE[Enemy.typeId[eid]];
      if (cfg) addGold(world, cfg.reward);
      releaseEnemy(world, eid);
    }

    // End-of-run detection (SPEC §6.6). Lose takes priority over win.
    if (getLives(world) <= 0) {
      setPhase("lost");
    } else if (isWaveComplete() && enemyQuery(world).length === 0) {
      setPhase("won");
    }
    return world;
  };
}

/** Live instance wired into the pipeline (reads the live wave's completion). */
export const DeathSystem: System = createDeathSystem();
