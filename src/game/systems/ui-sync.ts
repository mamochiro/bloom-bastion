/**
 * UISyncSystem (SPEC §4.2 slot 10) — the ONE bridge from ECS game state to the
 * React/Zustand HUD. Game state stays authoritative in ECS (Resources, queries);
 * this system pushes a throttled, read-only *mirror* into the store. React never
 * reads ECS directly (SPEC §4.1).
 *
 * Throttle (SPEC: "max 10Hz"): accumulate the per-frame `dt` and push at most
 * once every `PUSH_INTERVAL_S` (0.1s). Frames between pushes do ZERO allocation
 * — the snapshot object is built only at push time. That ≤10Hz boundary alloc is
 * explicitly acceptable (it is NOT the per-frame hot path).
 *
 * `gameStatus` mirrors the authoritative game PHASE ('playing' | 'won' | 'lost',
 * set by DeathSystem) — UISync does not derive or decide it. This system keeps
 * running while the sim is paused so the overlay still updates after the run
 * ends.
 */
import { type World, enemyQuery } from "../../engine/ecs/world";
import type { System } from "../../engine/loop";
import { type GameSnapshot, setSnapshot } from "../../store/game-snapshot";
import { getPhase } from "../ecs/game-state";
import { getGold, getLives } from "../ecs/resources";

/** Minimum seconds between store pushes (≤10Hz). */
export const PUSH_INTERVAL_S = 0.1;

/**
 * Current wave number. No wave-progression state is exposed yet (single
 * scaffold wave this slice), so this is a constant 1; swap to real wave state
 * when the wave system lands.
 */
const CURRENT_WAVE = 1;

/** Build the HUD mirror from authoritative ECS / game state. Allocates one object. */
export function buildSnapshot(world: World): GameSnapshot {
  return {
    gold: getGold(world),
    lives: getLives(world),
    wave: CURRENT_WAVE,
    enemiesAlive: enemyQuery(world).length,
    gameStatus: getPhase(), // authoritative phase (DeathSystem decides win/lose)
  };
}

/**
 * Build a UISyncSystem with its own throttle accumulator. `push` defaults to the
 * store setter; tests inject a spy. Each instance pushes at most every
 * `PUSH_INTERVAL_S`.
 */
export function createUISyncSystem(push: (s: GameSnapshot) => void = setSnapshot): System {
  let acc = 0;
  return (world: World, dt: number): World => {
    acc += dt;
    if (acc >= PUSH_INTERVAL_S) {
      acc -= PUSH_INTERVAL_S; // keep long-term cadence (dt ≤ 50ms < interval → ≤1 push/frame)
      push(buildSnapshot(world));
    }
    return world;
  };
}

/** Default instance wired into the live pipeline (pushes to the store). */
export const UISyncSystem: System = createUISyncSystem();
