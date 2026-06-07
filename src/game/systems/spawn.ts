/**
 * SpawnSystem (SPEC §4.2 slot 2) — wave-driven enemy creation (ADR-0003).
 *
 * Walks the `WAVES` table: for the current wave, each group spawns `count`
 * enemies `intervalS` apart, starting `startDelayS` after the wave began. When a
 * wave is fully spawned AND the board is clear, it either (non-last wave) waits
 * `INTER_WAVE_DELAY_S` then credits the §6.5 clear economy and advances, or
 * (last wave) credits the economy and stands by for DeathSystem to declare the
 * win. The phase stays 'playing' through the inter-wave gap — stragglers/towers
 * keep acting; the sim is NOT paused.
 *
 * Zero hot-path alloc: schedule is pre-built data; per-group spawn counts live
 * in a fixed `Int32Array` allocated once per instance and `fill(0)`'d on wave
 * change. `enemyQuery(world)` returns bitECS' cached array (no alloc).
 *
 * Balance: counts/intervals are SPEC §6.3 (config/waves.ts); enemy STATS are
 * SPEC §6.2 (config/enemies.ts).
 */
import { type World, enemyQuery } from "../../engine/ecs/world";
import type { System } from "../../engine/loop";
import { INTER_WAVE_DELAY_S, WAVES, type Wave } from "../config/waves";
import { isSimPaused } from "../ecs/game-state";
import { addGold, getGold } from "../ecs/resources";
import { spawnEnemy } from "../entities/create-enemy";
import { SPAWN } from "../map/coords";

/** Wave-clear economy (SPEC §6.5): clear bonus + capped interest. `waveNumber` 1-based. */
function applyWaveClearEconomy(world: World, waveNumber: number): void {
  addGold(world, 25 + 5 * waveNumber); // clear bonus
  // +5% interest, capped at +50g — computed on gold AFTER the clear bonus.
  addGold(world, Math.min(50, Math.floor(0.05 * getGold(world))));
}

/** A wave-driven SpawnSystem plus progress introspection + restart reset. */
export interface SpawnSystemHandle extends System {
  /** True once every group of the CURRENT wave has fully spawned. */
  isWaveComplete(): boolean;
  /** Current wave number, 1-based (for display). */
  getCurrentWave(): number;
  /** True when the current wave is the final defined wave. */
  isLastWave(): boolean;
  /** Total number of defined waves. */
  readonly TOTAL_WAVES: number;
  /** Re-arm: back to wave 0, all timers/counts cleared. */
  reset(): void;
}

/** Largest group count across `waves` — sizes the per-group spawn scratch. */
function maxGroups(waves: readonly Wave[]): number {
  let m = 0;
  for (const w of waves) if (w.groups.length > m) m = w.groups.length;
  return m;
}

/**
 * Build a wave-driven SpawnSystem. `waves` defaults to the SPEC §6.3 table;
 * tests inject a smaller table for fast, deterministic runs.
 */
export function createSpawnSystem(waves: readonly Wave[] = WAVES): SpawnSystemHandle {
  const lastIndex = waves.length - 1;
  const spawnedPerGroup = new Int32Array(Math.max(1, maxGroups(waves)));

  let currentWave = 0;
  let waveElapsed = 0;
  let interWaveRemaining = 0; // > 0 → in the prep gap before the next wave

  const fullySpawned = (): boolean => {
    const groups = waves[currentWave].groups;
    for (let gi = 0; gi < groups.length; gi++) {
      if (spawnedPerGroup[gi] < groups[gi].count) return false;
    }
    return true;
  };

  const system = ((world: World, dt: number): World => {
    if (isSimPaused()) return world; // frozen on win/lose

    // Inter-wave prep gap: count down, then credit economy + advance.
    if (interWaveRemaining > 0) {
      interWaveRemaining -= dt;
      if (interWaveRemaining <= 0) {
        applyWaveClearEconomy(world, currentWave + 1); // for the wave just cleared
        currentWave += 1;
        waveElapsed = 0;
        spawnedPerGroup.fill(0);
        interWaveRemaining = 0;
      }
      return world;
    }

    // Spawning: emit each group's due enemies on its schedule.
    waveElapsed += dt;
    const groups = waves[currentWave].groups;
    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      while (
        spawnedPerGroup[gi] < g.count &&
        waveElapsed >= g.startDelayS + spawnedPerGroup[gi] * g.intervalS
      ) {
        spawnEnemy(world, g.enemy, SPAWN.x, SPAWN.y);
        spawnedPerGroup[gi] += 1;
      }
    }

    // Wave cleared (fully spawned + board empty)?
    if (fullySpawned() && enemyQuery(world).length === 0) {
      if (currentWave < lastIndex) {
        interWaveRemaining = INTER_WAVE_DELAY_S; // prep gap → economy + advance later
      } else {
        // Last wave cleared: credit economy now; DeathSystem declares the win.
        // currentWave stays at lastIndex, so this branch is re-entered every
        // frame until the win pauses the sim — but isSimPaused() (set by Death
        // the same frame) returns us out, and the economy here is idempotent for
        // exactly one frame. Guard against double-credit with a sentinel.
        if (interWaveRemaining !== -1) {
          applyWaveClearEconomy(world, currentWave + 1);
          interWaveRemaining = -1; // sentinel: final economy credited
        }
      }
    }
    return world;
  }) as SpawnSystemHandle;

  system.isWaveComplete = fullySpawned;
  system.getCurrentWave = () => currentWave + 1;
  system.isLastWave = () => currentWave === lastIndex;
  Object.defineProperty(system, "TOTAL_WAVES", { value: waves.length, enumerable: true });
  system.reset = () => {
    currentWave = 0;
    waveElapsed = 0;
    interWaveRemaining = 0;
    spawnedPerGroup.fill(0);
  };
  return system;
}

/**
 * The live wave instance — shared by the pipeline (slot 2), DeathSystem (win
 * detection), and `restartGame` (reset). Tests use `createSpawnSystem` for a
 * fresh, isolated instance.
 */
export const SpawnSystem: SpawnSystemHandle = createSpawnSystem();
