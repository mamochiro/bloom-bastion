/**
 * Authoritative game PHASE — 'playing' | 'won' | 'lost' (SPEC §6.6 win/lose).
 *
 * This is GAME-side state (a module-local enum), NOT React/Zustand — the store's
 * `gameStatus` is only a throttled mirror pushed by UISyncSystem. Kept as a
 * world-free module value (rather than an ECS component) so the per-frame pause
 * guard `isSimPaused()` — read at the top of every simulation system — needs no
 * world lookup and allocates nothing.
 *
 * Detection lives in DeathSystem (slot 7); the simulation systems (slots 1–7)
 * freeze when the phase leaves 'playing'; Render (9) + UISync (10) keep running
 * so the final frame + the overlay still update. `resetPhase()` re-arms a run.
 */
export type GamePhase = "playing" | "won" | "lost";

let phase: GamePhase = "playing";

/** Current authoritative phase. */
export function getPhase(): GamePhase {
  return phase;
}

/** Set the phase (DeathSystem on win/lose; restart back to 'playing'). */
export function setPhase(next: GamePhase): void {
  phase = next;
}

/** Reset to a fresh run. */
export function resetPhase(): void {
  phase = "playing";
}

/** True when the simulation should be frozen (anything but an active run). */
export function isSimPaused(): boolean {
  return phase !== "playing";
}
