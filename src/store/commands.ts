import { create } from "zustand";
import type { GameMode } from "../game/ecs/game-state";

/**
 * Transient UI→game command flags (SPEC §8 start + end-game restart). Mirrors
 * the build-store input-command pattern: the UI sets a one-shot intent,
 * gameplay's InputSystem consumes it on its next tick. Holds ONLY the flags —
 * never game logic, never run state.
 */
interface CommandState {
  /** Set by the menu "Play" button; cleared once gameplay starts the run. */
  startRequested: boolean;
  /** Run mode requested by the start button (Play → campaign, Endless → endless). */
  startMode: GameMode;
  /** Set by the "Play Again" button; cleared once gameplay consumes it. */
  restartRequested: boolean;
  /** Set by the tower panel's "Upgrade" button; acts on the selected tower. */
  upgradeRequested: boolean;
  /** Set by the tower panel's "Sell" button; acts on the selected tower. */
  sellRequested: boolean;
  /** Set by the tower panel's close / deselect; clears the selection. */
  clearSelectionRequested: boolean;
}

const useCommandStore = create<CommandState>()(() => ({
  startRequested: false,
  startMode: "campaign",
  restartRequested: false,
  upgradeRequested: false,
  sellRequested: false,
  clearSelectionRequested: false,
}));

/**
 * Request a run start from the menu (imperative — start-button handler). Pass
 * `"endless"` for the Endless button; defaults to `"campaign"` so the existing
 * "Play" call (`requestStart()`) is unchanged. The mode is read by gameplay via
 * {@link getStartMode} when it consumes the start command.
 */
export const requestStart = (mode: GameMode = "campaign"): void => {
  useCommandStore.setState({ startRequested: true, startMode: mode });
};

/** The mode requested by the latest start command (gameplay reads on consume). */
export const getStartMode = (): GameMode => useCommandStore.getState().startMode;

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

/** Request upgrading the SELECTED tower (imperative — panel "Upgrade" handler). */
export const requestTowerUpgrade = (): void => {
  useCommandStore.setState({ upgradeRequested: true });
};

/** Consume the upgrade request (gameplay's InputSystem). True once per request. */
export const consumeTowerUpgrade = (): boolean => {
  if (useCommandStore.getState().upgradeRequested) {
    useCommandStore.setState({ upgradeRequested: false });
    return true;
  }
  return false;
};

/** Request selling the SELECTED tower (imperative — panel "Sell" handler). */
export const requestTowerSell = (): void => {
  useCommandStore.setState({ sellRequested: true });
};

/** Consume the sell request (gameplay's InputSystem). True once per request. */
export const consumeTowerSell = (): boolean => {
  if (useCommandStore.getState().sellRequested) {
    useCommandStore.setState({ sellRequested: false });
    return true;
  }
  return false;
};

/** Request clearing the tower selection (imperative — panel close / deselect). */
export const requestClearSelection = (): void => {
  useCommandStore.setState({ clearSelectionRequested: true });
};

/** Consume the clear-selection request (gameplay's InputSystem). True once. */
export const consumeClearSelection = (): boolean => {
  if (useCommandStore.getState().clearSelectionRequested) {
    useCommandStore.setState({ clearSelectionRequested: false });
    return true;
  }
  return false;
};
