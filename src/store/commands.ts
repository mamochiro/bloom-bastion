import { create } from "zustand";

/**
 * Transient UI→game command flags (SPEC §8 start + end-game restart). Mirrors
 * the build-store input-command pattern: the UI sets a one-shot intent,
 * gameplay's InputSystem consumes it on its next tick. Holds ONLY the flags —
 * never game logic, never run state.
 */
interface CommandState {
  /** Set by the menu "Play" button; cleared once gameplay starts the run. */
  startRequested: boolean;
  /** Set by the "Play Again" button; cleared once gameplay consumes it. */
  restartRequested: boolean;
}

const useCommandStore = create<CommandState>()(() => ({
  startRequested: false,
  restartRequested: false,
}));

/** Request a run start from the menu (imperative — "Play" handler). */
export const requestStart = (): void => {
  useCommandStore.setState({ startRequested: true });
};

/**
 * Consume the start request (non-reactive — gameplay's InputSystem). Returns
 * `true` exactly ONCE per request, then clears the flag so the run starts once.
 */
export const consumeStart = (): boolean => {
  const { startRequested } = useCommandStore.getState();
  if (startRequested) {
    useCommandStore.setState({ startRequested: false });
    return true;
  }
  return false;
};

/** Request a run restart (imperative — UI "Play Again" handler). */
export const requestRestart = (): void => {
  useCommandStore.setState({ restartRequested: true });
};

/**
 * Consume the restart request (non-reactive — gameplay's InputSystem). Returns
 * `true` exactly ONCE per request, then clears the flag so the restart fires a
 * single time.
 */
export const consumeRestart = (): boolean => {
  const { restartRequested } = useCommandStore.getState();
  if (restartRequested) {
    useCommandStore.setState({ restartRequested: false });
    return true;
  }
  return false;
};
