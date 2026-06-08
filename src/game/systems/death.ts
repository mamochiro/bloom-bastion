/**
 * DeathSystem (SPEC §4.2 slot 7) — reward + cleanup for dead enemies, AND the
 * fold-in home of win/lose detection (no new §4.2 slot). Runs last among the
 * simulation systems, so it sees the frame's final lives + enemy count.
 *
 * Per enemy with Health ≤ 0: grant the SPEC §6.2 kill reward, recycle to the
 * pool. Then (SPEC §6.6):
 *   - lives ≤ 0                                    → setPhase('lost')
 *   - LAST wave complete && 0 enemies && lives > 0 → setPhase('won')
 * The last-wave guard is critical: clearing wave 1 or 2 leaves 0 enemies during
 * the inter-wave gap, which must NOT win — only the final wave's clear wins.
 *
 * Iterates backward (releasing strips Enemy, swap-popping the query array).
 * Death particles / floating text are DEFERRED (pure juice, later slice).
 */
import { Enemy, Health, type World, enemyQuery } from "../../engine/ecs/world";
import type { System } from "../../engine/loop";
import { ENEMY_BY_TYPE } from "../config/enemies";
import { isSimPaused, setPhase } from "../ecs/game-state";
import { addGold, getLives } from "../ecs/resources";
import { goldMultiplier } from "../ecs/skills";
import { releaseEnemy } from "../entities/create-enemy";
import { SpawnSystem } from "./spawn";

/**
 * Build a DeathSystem. `isFinalWaveComplete` defaults to "the live wave is the
 * last AND fully spawned"; tests inject a stub to control the 'won' condition.
 */
export function createDeathSystem(
  isFinalWaveComplete: () => boolean = () =>
    SpawnSystem.isWaveComplete() && SpawnSystem.isLastWave(),
): System {
  return (world: World, _dt: number): World => {
    if (isSimPaused()) return world; // run already ended → frozen

    const enemies = enemyQuery(world);
    for (let i = enemies.length - 1; i >= 0; i--) {
      const eid = enemies[i];
      if (Health.current[eid] > 0) continue;

      const cfg = ENEMY_BY_TYPE[Enemy.typeId[eid]];
      // GoldRush (SPEC §6.4) doubles kill rewards while active.
      if (cfg) addGold(world, cfg.reward * goldMultiplier());
      releaseEnemy(world, eid);
    }

    // End-of-run detection (SPEC §6.6). Lose takes priority over win; win only
    // on the FINAL wave's clear (not the inter-wave gaps after waves 1/2).
    if (getLives(world) <= 0) {
      setPhase("lost");
    } else if (isFinalWaveComplete() && enemyQuery(world).length === 0) {
      setPhase("won");
    }
    return world;
  };
}

/** Live instance wired into the pipeline (reads the live wave's progress). */
export const DeathSystem: System = createDeathSystem();
