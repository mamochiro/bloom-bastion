/**
 * Wave data tables — SPEC §6.3 / ADR-0003 (LOCKED; data, not logic).
 *
 * A wave is an ordered list of spawn GROUPS. Each group emits `count` enemies of
 * one type, `intervalS` apart, beginning `startDelayS` after the wave starts —
 * so groups can sequence (Snails trailing in after Grubs) or overlap. SpawnSystem
 * (slot 2) just walks these timers; balance is a table edit here.
 *
 * Numbers are EXACTLY the SPEC §6.3 waves 1–3 table (Normal difficulty, ×1.0).
 * Wave-clear bonus is derived per §6.5 (`25 + 5*waveNumber`), not stored.
 */
import { EnemyType, type EnemyTypeId } from "./enemies";

export interface SpawnGroup {
  /** Enemy `typeId` to spawn (SPEC §6.2). */
  readonly enemy: EnemyTypeId;
  /** Number of enemies in this group. */
  readonly count: number;
  /** Seconds between spawns within the group. */
  readonly intervalS: number;
  /** Seconds from wave start before this group begins. */
  readonly startDelayS: number;
}

export interface Wave {
  readonly groups: readonly SpawnGroup[];
}

/** Waves 1–3 (index 0 = wave 1), SPEC §6.3 / ADR-0003. */
export const WAVES: readonly Wave[] = [
  // Wave 1 — pure intro: 8 Grubs @1.0s.
  { groups: [{ enemy: EnemyType.Grub, count: 8, intervalS: 1.0, startDelayS: 0 }] },
  // Wave 2 — density bump: 12 Grubs @0.8s.
  { groups: [{ enemy: EnemyType.Grub, count: 12, intervalS: 0.8, startDelayS: 0 }] },
  // Wave 3 — light Snails: 10 Grubs @0.7s, then 3 Snails @1.5s trailing in at +2s.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 10, intervalS: 0.7, startDelayS: 0 },
      { enemy: EnemyType.Snail, count: 3, intervalS: 1.5, startDelayS: 2.0 },
    ],
  },
];

/** Prep gap (seconds) between a wave clearing and the next wave starting (§6.3). */
export const INTER_WAVE_DELAY_S = 3;
