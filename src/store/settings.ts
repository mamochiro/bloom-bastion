import { create } from "zustand";
import {
  type QualityMode,
  getQualityMode as engineGetQualityMode,
  setQualityMode as engineSetQualityMode,
} from "../engine/loop";

// Re-export the engine's quality type so UI consumers import it from the store.
export type { QualityMode };

/**
 * UI settings store (render/quality config — NOT ECS game state, so a Zustand
 * store is the right home per the architecture rules). Currently holds only the
 * §4.5 quality mode, kept here for React reactivity; the authoritative effective
 * scale lives in the engine loop. {@link setQualityMode} updates the store AND
 * calls the engine seam.
 *
 * TODO(audio): SPEC §6 Settings also lists SFX volume / Music volume / Haptics.
 * Those land when audio (AudioManager / Howler) is wired — out of scope now.
 */
interface SettingsState {
  qualityMode: QualityMode;
}

// Initialize from the engine's current mode (default "auto").
const useSettingsStore = create<SettingsState>()(() => ({
  qualityMode: engineGetQualityMode(),
}));

/**
 * Set the quality mode: pins the engine's §4.5 vfx scale (high→1.0, low→0.2,
 * auto→FPS-driven) AND mirrors it into the store for reactive UI.
 */
export const setQualityMode = (mode: QualityMode): void => {
  engineSetQualityMode(mode);
  useSettingsStore.setState({ qualityMode: mode });
};

/** Non-reactive read of the selected mode. */
export const getQualityModeSelection = (): QualityMode => useSettingsStore.getState().qualityMode;

/** Reactive hook for the settings UI. */
export const useQualityMode = (): QualityMode => useSettingsStore((s) => s.qualityMode);
