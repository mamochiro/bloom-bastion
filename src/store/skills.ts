import { create } from "zustand";
import type { SkillType } from "../game/config/skills";

// Re-export the canonical type so UI consumers can import it from the store
// alongside the command actions. Single source of truth: config/skills.ts.
export type { SkillType };

/**
 * Skill command store — transient UI→game intent ONLY (no game logic). Two
 * channels mirroring the build/restart command pattern:
 *  - AIM: a targeted skill (Meteor) the player is aiming; gameplay reads
 *    {@link getSkillAim} on a canvas tap to place it, then clears it.
 *  - INSTANT: a fire-and-forget skill (Freeze/GoldRush) queued for gameplay's
 *    next tick via {@link consumeSkillActivation} (true-once).
 */
interface SkillCommandState {
  aim: SkillType | null;
  pendingActivation: SkillType | null;
}

const useSkillCommandStore = create<SkillCommandState>()(() => ({
  aim: null,
  pendingActivation: null,
}));

// ---- AIM (targeted, e.g. Meteor) ----

/** Enter aim mode for a targeted skill (imperative — skill-button handler). */
export const selectSkillAim = (type: SkillType): void => {
  useSkillCommandStore.setState({ aim: type });
};

/** Cancel aim mode (re-tap the skill, tap elsewhere, or after gameplay places). */
export const clearSkillAim = (): void => {
  useSkillCommandStore.setState({ aim: null });
};

/** Non-reactive read for gameplay (canvas tap → place the aimed skill there). */
export const getSkillAim = (): SkillType | null => useSkillCommandStore.getState().aim;

/** Reactive hook for the skill bar (show the aiming affordance). */
export const useSkillAim = (): SkillType | null => useSkillCommandStore((s) => s.aim);

// ---- INSTANT (fire-and-forget, e.g. Freeze / Gold Rush) ----

/** Queue an instant skill activation (imperative — skill-button handler). */
export const requestSkillActivation = (type: SkillType): void => {
  useSkillCommandStore.setState({ pendingActivation: type });
};

/**
 * Consume the queued instant activation (non-reactive — gameplay's InputSystem).
 * Returns the queued skill type exactly ONCE, then clears; `null` if none.
 */
export const consumeSkillActivation = (): SkillType | null => {
  const { pendingActivation } = useSkillCommandStore.getState();
  if (pendingActivation !== null) {
    useSkillCommandStore.setState({ pendingActivation: null });
    return pendingActivation;
  }
  return null;
};
