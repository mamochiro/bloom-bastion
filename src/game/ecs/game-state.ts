/**
 * Authoritative game PHASE — 'menu' | 'playing' | 'won' | 'lost'.
 *
 * GAME-side state (a module-local enum), NOT React/Zustand — the store's
 * `gameStatus` is only a throttled mirror pushed by UISyncSystem. World-free so
 * the per-frame pause guard `isSimPaused()` (read at the top of every simulation
 * system) needs no world lookup and allocates nothing.
 *
 * The game BOOTS into 'menu' (start screen): the sim is frozen, the board
 * renders behind the overlay; `startGame` moves it to 'playing'. Win/lose is
 * detected in DeathSystem (slot 7); the simulation systems (slots 1–7) freeze
 * whenever the phase is not 'playing'; Render (9) + UISync (10) keep running.
 * `resetPhase()` re-arms a RUN to 'playing' (used by restart).
 */
export type GamePhase = "menu" | "playing" | "won" | "lost";

let phase: GamePhase = "menu"; // boot into the start screen

/** Current authoritative phase. */
export function getPhase(): GamePhase {
  return phase;
}

/** Set the phase (startGame → 'playing'; DeathSystem on win/lose; restart). */
export function setPhase(next: GamePhase): void {
  phase = next;
}

/** Reset to a fresh, active RUN (restart). */
export function resetPhase(): void {
  phase = "playing";
}

/** True when the simulation should be frozen (menu, won, lost — anything but an active run). */
export function isSimPaused(): boolean {
  return phase !== "playing";
}
