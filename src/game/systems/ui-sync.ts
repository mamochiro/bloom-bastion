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
import { Enemy, Health, type World, enemyQuery } from "../../engine/ecs/world";
import type { System } from "../../engine/loop";
import { type BossSnapshot, type GameSnapshot, setSnapshot } from "../../store/game-snapshot";
import { ENEMY_BY_TYPE } from "../config/enemies";
import { SKILL_ORDER } from "../config/skills";
import { getPhase } from "../ecs/game-state";
import { getGold, getLives } from "../ecs/resources";
import { cooldownFraction, cooldownRemaining, isReady, isUnlocked } from "../ecs/skills";
import { SpawnSystem } from "./spawn";

/** Minimum seconds between store pushes (≤10Hz). */
export const PUSH_INTERVAL_S = 0.1;

/** The first live boss enemy's HP-bar state, or null when none is on the field. */
function findBoss(world: World): BossSnapshot | null {
  const enemies = enemyQuery(world);
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    const cfg = ENEMY_BY_TYPE[Enemy.typeId[e]];
    if (cfg?.isBoss) {
      const max = Health.max[e];
      return { name: cfg.name, hpFraction: max > 0 ? Health.current[e] / max : 0 };
    }
  }
  return null;
}

/** Build the HUD mirror from authoritative ECS / game state. Allocates one object. */
export function buildSnapshot(world: World): GameSnapshot {
  return {
    gold: getGold(world),
    lives: getLives(world),
    wave: SpawnSystem.getCurrentWave(), // live 1-based wave number
    enemiesAlive: enemyQuery(world).length,
    gameStatus: getPhase(), // authoritative phase (DeathSystem decides win/lose)
    // Per-skill cooldown/lock state (SPEC §6.4), fixed order. ≤10Hz boundary
    // alloc (the snapshot itself allocates) — not the per-frame hot path.
    skills: SKILL_ORDER.map((type) => ({
      type,
      ready: isReady(type) && isUnlocked(type), // tappable = off cooldown AND unlocked
      cooldownRemaining: cooldownRemaining(type),
      cooldownFraction: cooldownFraction(type),
      unlocked: isUnlocked(type),
    })),
    boss: findBoss(world), // live mini-boss HP bar (SPEC §6.2), or null
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
