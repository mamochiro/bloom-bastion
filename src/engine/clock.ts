/**
 * The game clock (SPEC §4.6) — a single accumulated GAME-time source in SECONDS,
 * decoupled from wall-clock time. Extracted into its own dependency-free module
 * so BOTH the RAF loop (which advances/resets it) and consumers like the VFX
 * system (which read it for transient timers) can import it WITHOUT a circular
 * dependency on `loop.ts`.
 *
 * Gameplay compares time-stamped state against {@link gameTime} (e.g.
 * `Status.slowedUntil/stunnedUntil/dotUntil`, VFX `flashUntil`). It sums the
 * same clamped per-frame `dt` the pipeline ticks with and does NOT advance while
 * the loop is paused (the loop simply doesn't call {@link advanceGameClock}).
 */

let gameClock = 0;

/** Accumulated game time in SECONDS. Zero-alloc getter. */
export function gameTime(): number {
  return gameClock;
}

/** Add one (already-clamped) frame `dt` to the clock. Called by the loop. */
export function advanceGameClock(dt: number): void {
  gameClock += dt;
}

/** Reset the clock to 0 (a fresh run). Called by `startLoop`. */
export function resetGameClock(): void {
  gameClock = 0;
}
