/**
 * Wave data tables — SPEC §6.3 / ADR-0003 (data, not logic).
 *
 * A wave is an ordered list of spawn GROUPS. Each group emits `count` enemies of
 * one type, `intervalS` apart, beginning `startDelayS` after the wave starts —
 * so groups can sequence (Snails trailing in after Grubs) or overlap. SpawnSystem
 * (slot 2) just walks these timers; balance is a table edit here.
 *
 * Waves 1–3 are the §6.3 table verbatim. Waves 4–10 are a difficulty curve of
 * Grub/Snail + Candy King mini-boss at waves 5 & 10 (SPEC §6.2/§6.3).
 *
 * Wave 4 introduces Flutter and wave 9 introduces Splitter (§6.3-faithful). The
 * per-wave counts/intervals for 4–10 are TUNED (§6.3 gives only a prose plan, no
 * per-wave numbers), not §6.3-exact. Wave-clear bonus is derived per §6.5
 * (`25 + 5*waveNumber`), not stored.
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
  // Wave 4 — INTRODUCE Flutter (SPEC §6.3): 10 Grubs @0.6s + 6 fast fliers @0.9s @+1.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 10, intervalS: 0.6, startDelayS: 0 },
      { enemy: EnemyType.Flutter, count: 6, intervalS: 0.9, startDelayS: 1.0 },
    ],
  },
  // Wave 5 — 👑 CANDY KING mini-boss (SPEC §6.2) + 6 support Grubs trailing.
  {
    groups: [
      { enemy: EnemyType.CandyKing, count: 1, intervalS: 1.0, startDelayS: 0 },
      { enemy: EnemyType.Grub, count: 6, intervalS: 1.0, startDelayS: 1.0 },
    ],
  },
  // Wave 6 — 16 Grubs @0.55s + 5 Snails @1.0s @+2.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 16, intervalS: 0.55, startDelayS: 0 },
      { enemy: EnemyType.Snail, count: 5, intervalS: 1.0, startDelayS: 2.0 },
    ],
  },
  // Wave 7 — snail-heavy: 12 Grubs @0.5s + 7 Snails @0.9s @+1.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 12, intervalS: 0.5, startDelayS: 0 },
      { enemy: EnemyType.Snail, count: 7, intervalS: 0.9, startDelayS: 1.0 },
    ],
  },
  // Wave 8 — 20 Grubs @0.45s + 6 Snails @0.8s @+1.5.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 20, intervalS: 0.45, startDelayS: 0 },
      { enemy: EnemyType.Snail, count: 6, intervalS: 0.8, startDelayS: 1.5 },
    ],
  },
  // Wave 9 — INTRODUCE Splitter (SPEC §6.3): Grub/Snail ramp + 4 Splitters @1.4s @+2.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 12, intervalS: 0.45, startDelayS: 0 },
      { enemy: EnemyType.Snail, count: 6, intervalS: 0.8, startDelayS: 1.0 },
      { enemy: EnemyType.Splitter, count: 4, intervalS: 1.4, startDelayS: 2.0 },
    ],
  },
  // Wave 10 — 👑 CANDY KING (SPEC §6.2) + tougher support: 8 Grubs + 4 Snails.
  {
    groups: [
      { enemy: EnemyType.CandyKing, count: 1, intervalS: 1.0, startDelayS: 0 },
      { enemy: EnemyType.Grub, count: 8, intervalS: 0.9, startDelayS: 1.0 },
      { enemy: EnemyType.Snail, count: 4, intervalS: 1.5, startDelayS: 3.0 },
    ],
  },
];

/** Prep gap (seconds) between a wave clearing and the next wave starting (§6.3). */
export const INTER_WAVE_DELAY_S = 3;
