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

/**
 * Run mode: 'campaign' (the 20 authored waves → 'won') or 'endless' (procedural
 * waves past the authored set, no win — ends only on lose). Chosen on startGame;
 * PRESERVED across restart (Play Again replays the same mode).
 */
export type GameMode = "campaign" | "endless";

let phase: GamePhase = "menu"; // boot into the start screen
let mode: GameMode = "campaign";

/** Current run mode. */
export function getGameMode(): GameMode {
  return mode;
}

/** Set the run mode (startGame). */
export function setGameMode(next: GameMode): void {
  mode = next;
}

/** True in endless mode (no win; procedural waves past the authored set). */
export function isEndless(): boolean {
  return mode === "endless";
}

/** Reset the mode to campaign (tests / fresh boot). Restart PRESERVES the mode. */
export function resetGameMode(): void {
  mode = "campaign";
}

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
