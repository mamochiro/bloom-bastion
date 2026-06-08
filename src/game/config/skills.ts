/**
 * Active-skill data — SPEC §6.4 (LOCKED balance; data, not logic).
 *
 * 3 skills, unlocked progressively by waves cleared. `aim:true` skills (Meteor)
 * are tap-to-aim (the next battlefield tap is the target); `aim:false` skills
 * (Freeze/GoldRush) are tap-to-activate (instant). Effect numbers are applied by
 * the skill activation in `src/game/ecs/skills.ts`.
 */
// NOTE: 'goldRush' casing matches the already-landed ui store (src/store/skills.ts),
// which is the shared SkillType contract (its TODO is to import THIS canonical
// type). The task brief wrote 'goldrush'; adopting the store's casing keeps
// gameplay↔ui interoperable. FLAGGED for the orchestrator.
export type SkillType = "meteor" | "freeze" | "goldRush";

export interface SkillConfig {
  readonly type: SkillType;
  /** Cooldown in seconds (SPEC §6.4). */
  readonly cooldownS: number;
  /** Waves-cleared required to unlock (0 = default/always). */
  readonly unlockWave: number;
  /** Tap-to-aim (true → next tap is the target) vs instant (false). */
  readonly aim: boolean;
  // Meteor
  readonly aoeDamage?: number;
  readonly radiusTiles?: number;
  // Freeze All
  readonly stunS?: number;
  // Gold Rush
  readonly goldMult?: number;
  readonly durationS?: number;
}

/** SPEC §6.4, verbatim. */
export const SKILLS: Readonly<Record<SkillType, SkillConfig>> = {
  // 🌠 AoE 200 DMG in 2-tile radius, 60s, default.
  meteor: {
    type: "meteor",
    aoeDamage: 200,
    radiusTiles: 2,
    cooldownS: 60,
    unlockWave: 0,
    aim: true,
  },
  // ❄️ Stun all enemies 3s, 90s, unlock wave 5 cleared.
  freeze: { type: "freeze", stunS: 3, cooldownS: 90, unlockWave: 5, aim: false },
  // 💰 2× gold from kills for 10s, 120s, unlock wave 10 cleared.
  goldRush: {
    type: "goldRush",
    goldMult: 2,
    durationS: 10,
    cooldownS: 120,
    unlockWave: 10,
    aim: false,
  },
} as const;

/** Skill order for the HUD bar (fixed). */
export const SKILL_ORDER: readonly SkillType[] = ["meteor", "freeze", "goldRush"];
