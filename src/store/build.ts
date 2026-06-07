import { create } from "zustand";
import type { TowerTypeId } from "../game/config/towers";

/**
 * Build-intent store (SPEC §8 tower placement). Holds ONLY the transient player
 * intent — "which tower am I about to place" — never game state. The picker UI
 * writes it on tap; gameplay's InputSystem reads {@link getSelectedBuild}
 * non-reactively on a canvas tap to know what to place, then clears it.
 *
 * Selection is a `TowerTypeId` (the numeric `Tower.typeId` from the game config:
 * Blossom = 0), reusing the real config enum so both layers agree. `null` = no
 * tower selected (nothing to place).
 */
export interface BuildState {
  selected: TowerTypeId | null;
}

/** Internal Zustand store. Holds ONLY the selection — no logic. */
const useBuildStore = create<BuildState>()(() => ({ selected: null }));

/** Select a tower to place (imperative — UI tap handler). */
export const selectBuild = (tower: TowerTypeId): void => {
  useBuildStore.setState({ selected: tower });
};

/** Clear the build selection (imperative — toggle-off, or after placement). */
export const clearBuild = (): void => {
  useBuildStore.setState({ selected: null });
};

/** Non-reactive read for gameplay's InputSystem (canvas tap → place this). */
export const getSelectedBuild = (): TowerTypeId | null => useBuildStore.getState().selected;

/** Reactive hook for the picker UI. */
export const useSelectedBuild = (): TowerTypeId | null => useBuildStore((s) => s.selected);
