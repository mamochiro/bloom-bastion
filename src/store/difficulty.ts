import { create } from "zustand";
import { DEFAULT_DIFFICULTY, type Difficulty } from "../game/config/difficulty";

// Re-export the canonical type so UI consumers can import it from the store
// alongside the selection hooks. Single source of truth: config/difficulty.ts.
export type { Difficulty };

/**
 * Difficulty SELECTION store — transient UI intent only (which difficulty the
 * player has highlighted on the menu). No game logic, no start stats. gameplay
 * reads {@link getSelectedDifficulty} when it consumes the start command to seed
 * the run economy.
 */
interface DifficultyState {
  selected: Difficulty;
}

const useDifficultyStore = create<DifficultyState>()(() => ({ selected: DEFAULT_DIFFICULTY }));

/** Set the selected difficulty (imperative — menu radio handler). */
export const setDifficulty = (difficulty: Difficulty): void => {
  useDifficultyStore.setState({ selected: difficulty });
};

/** Non-reactive read for gameplay (seed the run on start). */
export const getSelectedDifficulty = (): Difficulty => useDifficultyStore.getState().selected;

/** Reactive hook for the menu UI. */
export const useSelectedDifficulty = (): Difficulty => useDifficultyStore((s) => s.selected);
