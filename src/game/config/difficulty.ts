/**
 * Difficulty table — SPEC §6.5 "Starting Conditions" (LOCKED balance; data).
 *
 * Each difficulty sets the run's starting economy (gold / lives) and the global
 * enemy HP / speed multipliers. The ACTIVE difficulty is module state chosen on
 * `startGame`; `getDifficultyMods()` returns a SHARED, cached object (updated in
 * place on `setActiveDifficulty`) so the per-frame/per-spawn hot paths read the
 * multipliers with ZERO allocation. Callers must treat it as read-only.
 */
export type Difficulty = "casual" | "normal" | "hardcore";

export interface DifficultyConfig {
  /** Starting gold (SPEC §6.5). */
  readonly gold: number;
  /** Starting lives (SPEC §6.5). */
  readonly lives: number;
  /** Enemy HP multiplier (SPEC §6.5). */
  readonly hpMult: number;
  /** Enemy speed multiplier (SPEC §6.5). */
  readonly speedMult: number;
}

/** SPEC §6.5 starting conditions, verbatim. */
export const DIFFICULTY: Readonly<Record<Difficulty, DifficultyConfig>> = {
  casual: { gold: 200, lives: 25, hpMult: 0.8, speedMult: 0.9 },
  normal: { gold: 150, lives: 20, hpMult: 1.0, speedMult: 1.0 },
  hardcore: { gold: 100, lives: 15, hpMult: 1.3, speedMult: 1.15 },
} as const;

/** The default difficulty before any selection. */
export const DEFAULT_DIFFICULTY: Difficulty = "normal";

let active: Difficulty = DEFAULT_DIFFICULTY;
// Shared, mutable mods object — reused (never re-allocated) so hot-path reads
// of `.hpMult` / `.speedMult` allocate nothing.
const mods = {
  hpMult: DIFFICULTY[DEFAULT_DIFFICULTY].hpMult,
  speedMult: DIFFICULTY[DEFAULT_DIFFICULTY].speedMult,
};

/** Currently active difficulty. */
export function getActiveDifficulty(): Difficulty {
  return active;
}

/** Set the active difficulty (startGame) and refresh the cached mods in place. */
export function setActiveDifficulty(d: Difficulty): void {
  active = d;
  mods.hpMult = DIFFICULTY[d].hpMult;
  mods.speedMult = DIFFICULTY[d].speedMult;
}

/**
 * Active enemy HP / speed multipliers. Returns the SHARED cached object (no
 * allocation) — read `.hpMult` / `.speedMult`; do NOT mutate.
 */
export function getDifficultyMods(): { hpMult: number; speedMult: number } {
  return mods;
}
