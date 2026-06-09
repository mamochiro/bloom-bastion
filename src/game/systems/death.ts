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
import { Enemy, Health, Position, type World, enemyQuery } from "../../engine/ecs/world";
import type { System } from "../../engine/loop";
import { ENEMY_BY_TYPE } from "../config/enemies";
import { TINT } from "../config/tokens";
import { isSimPaused, setPhase } from "../ecs/game-state";
import { addGold, getLives } from "../ecs/resources";
import { goldMultiplier } from "../ecs/skills";
import { releaseEnemy, spawnEnemy } from "../entities/create-enemy";
import { spawnBurst, spawnFloatingText } from "../vfx";
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
      if (cfg) {
        // GoldRush (SPEC §6.4) doubles kill rewards while active.
        const reward = cfg.reward * goldMultiplier();
        addGold(world, reward);

        // VFX (cold on-death event): a death poof in the enemy palette (bigger
        // for bosses) + the kill reward floating up in gold.
        const x = Position.x[eid];
        const y = Position.y[eid];
        spawnBurst(x, y, TINT.shadeGlow, cfg.isBoss ? 40 : 12);
        spawnFloatingText(`+${reward}g`, x, y, TINT.gold);
        // Split on death (SPEC §6.2 Splitter): spawn the minis at the dead
        // enemy's position, fanned out, each on the flow field (spawnEnemy sets
        // Pathfinder + fresh flags). Minis have NO onDeathSplit → no recursion.
        // Cold one-time event — allocation here is fine. Spawning during this
        // backward loop is safe: new entries append at the tail, past the cursor.
        const split = cfg.onDeathSplit;
        if (split) {
          const x = Position.x[eid];
          const y = Position.y[eid];
          for (let k = 0; k < split.count; k++) {
            spawnEnemy(world, split.type, x + (k - (split.count - 1) / 2) * 10, y);
          }
        }
      }
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
