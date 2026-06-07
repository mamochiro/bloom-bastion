/**
 * SpawnSystem (SPEC §4.2 slot 2) — timed enemy creation.
 *
 * Emits one small wave at a fixed interval from `SPAWN`, then stops. Freezes
 * while the game is not actively playing (pause guard). The returned handle also
 * exposes `isComplete()` (every enemy emitted — DeathSystem reads it to decide
 * 'won') and `reset()` (re-arm the wave timer + count on restart).
 *
 * NOTE on balance: the per-wave COUNT and INTERVAL are slice scaffolding, not
 * locked balance. SPEC §6.3 describes wave *content* but does not pin exact
 * counts/intervals — those become real wave tables later. The enemy STATS are
 * SPEC §6.2 locked (config/enemies.ts).
 */
import type { World } from "../../engine/ecs/world";
import type { System } from "../../engine/loop";
import { EnemyType } from "../config/enemies";
import { isSimPaused } from "../ecs/game-state";
import { spawnEnemy } from "../entities/create-enemy";
import { SPAWN } from "../map/coords";

/** A single timed wave for the slice. */
export interface WaveSpec {
  /** Numeric `Enemy.typeId` to spawn. */
  readonly enemyType: number;
  /** Total enemies to emit, then stop. */
  readonly count: number;
  /** Seconds between spawns (and before the first one is 0 → spawn at t=0). */
  readonly intervalS: number;
  /** World-pixel spawn position. */
  readonly at: { readonly x: number; readonly y: number };
}

/** Default slice wave: 5 Grubs, 0.75s apart, from the map entry. */
export const DEFAULT_WAVE: WaveSpec = {
  enemyType: EnemyType.Grub,
  count: 5,
  intervalS: 0.75,
  at: SPAWN,
};

/** A SpawnSystem plus wave-progress introspection + restart reset. */
export interface SpawnSystemHandle extends System {
  /** True once every enemy in the wave has been emitted. */
  isComplete(): boolean;
  /** Re-arm the wave: reset the timer + emitted count to zero. */
  reset(): void;
}

/**
 * Build a SpawnSystem with its own isolated wave timer. The closure is a
 * self-contained `(world, dt) => world`; `isComplete`/`reset` are attached.
 * Spawns happen at t = 0, interval, 2·interval, … until `count` is reached.
 */
export function createSpawnSystem(wave: WaveSpec = DEFAULT_WAVE): SpawnSystemHandle {
  let elapsed = 0;
  let spawned = 0;
  let nextAt = 0; // first enemy spawns on the first tick

  const system = ((world: World, dt: number): World => {
    if (isSimPaused()) return world; // frozen on win/lose
    if (spawned >= wave.count) return world;

    elapsed += dt;
    while (spawned < wave.count && elapsed >= nextAt) {
      spawnEnemy(world, wave.enemyType, wave.at.x, wave.at.y);
      spawned += 1;
      nextAt += wave.intervalS;
    }
    return world;
  }) as SpawnSystemHandle;

  system.isComplete = () => spawned >= wave.count;
  system.reset = () => {
    elapsed = 0;
    spawned = 0;
    nextAt = 0;
  };
  return system;
}

/**
 * The live wave instance — shared by the pipeline (slot 2), DeathSystem (reads
 * `isComplete()` for 'won'), and `restartGame` (calls `reset()`). Tests should
 * use `createSpawnSystem` for a fresh, isolated instance.
 */
export const SpawnSystem: SpawnSystemHandle = createSpawnSystem();
