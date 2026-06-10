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
  // Wave 6 — mix of all basics (§6.3): 16 Grub@0.55 + 5 Snail@1.0 + 4 Shade@1.1 dodgers.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 16, intervalS: 0.55, startDelayS: 0 },
      { enemy: EnemyType.Snail, count: 5, intervalS: 1.0, startDelayS: 2.0 },
      { enemy: EnemyType.Shade, count: 4, intervalS: 1.1, startDelayS: 3.0 },
    ],
  },
  // Wave 7 — mix (§6.3): 12 Grub@0.5 + 7 Snail@0.9 + 3 Plushy@1.5 tanks.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 12, intervalS: 0.5, startDelayS: 0 },
      { enemy: EnemyType.Snail, count: 7, intervalS: 0.9, startDelayS: 1.0 },
      { enemy: EnemyType.Plushy, count: 3, intervalS: 1.5, startDelayS: 2.5 },
    ],
  },
  // Wave 8 — full mix (§6.3): 18 Grub@0.45 + 5 Snail@0.8 + 5 Shade@1.0 + 3 Plushy@1.6.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 18, intervalS: 0.45, startDelayS: 0 },
      { enemy: EnemyType.Snail, count: 5, intervalS: 0.8, startDelayS: 1.5 },
      { enemy: EnemyType.Shade, count: 5, intervalS: 1.0, startDelayS: 2.0 },
      { enemy: EnemyType.Plushy, count: 3, intervalS: 1.6, startDelayS: 3.5 },
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
  // Wave 11 — density spike, fast enemies (§6.3): 20 Grub@0.4 + 8 Flutter + 6 Shade.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 20, intervalS: 0.4, startDelayS: 0 },
      { enemy: EnemyType.Flutter, count: 8, intervalS: 0.7, startDelayS: 1.0 },
      { enemy: EnemyType.Shade, count: 6, intervalS: 0.9, startDelayS: 2.0 },
    ],
  },
  // Wave 12 — faster spike (§6.3): 18 Grub@0.35 + 10 Flutter@0.6 + 8 Shade@0.8.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 18, intervalS: 0.35, startDelayS: 0 },
      { enemy: EnemyType.Flutter, count: 10, intervalS: 0.6, startDelayS: 1.0 },
      { enemy: EnemyType.Shade, count: 8, intervalS: 0.8, startDelayS: 2.0 },
    ],
  },
  // Wave 13 — dense + fast (§6.3): 24 Grub@0.3 + 8 Flutter@0.5 + 6 Snail@0.7.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 24, intervalS: 0.3, startDelayS: 0 },
      { enemy: EnemyType.Flutter, count: 8, intervalS: 0.5, startDelayS: 1.0 },
      { enemy: EnemyType.Snail, count: 6, intervalS: 0.7, startDelayS: 2.0 },
    ],
  },
  // Wave 14 — Plushy-heavy / regen counter (§6.3): 12 Grub + 6 Plushy + 4 Snail.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 12, intervalS: 0.5, startDelayS: 0 },
      { enemy: EnemyType.Plushy, count: 6, intervalS: 1.0, startDelayS: 1.0 },
      { enemy: EnemyType.Snail, count: 4, intervalS: 0.8, startDelayS: 2.5 },
    ],
  },
  // Wave 15 — 👑 CANDY KING + Splitters (§6.3): CK x1 + 6 Splitter + 8 Grub.
  {
    groups: [
      { enemy: EnemyType.CandyKing, count: 1, intervalS: 1.0, startDelayS: 0 },
      { enemy: EnemyType.Splitter, count: 6, intervalS: 1.3, startDelayS: 1.0 },
      { enemy: EnemyType.Grub, count: 8, intervalS: 0.9, startDelayS: 2.0 },
    ],
  },
  // Wave 16 — hardcore mix (§6.3): all basics simultaneously.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 16, intervalS: 0.4, startDelayS: 0 },
      { enemy: EnemyType.Snail, count: 6, intervalS: 0.9, startDelayS: 1.0 },
      { enemy: EnemyType.Flutter, count: 6, intervalS: 0.7, startDelayS: 1.5 },
      { enemy: EnemyType.Shade, count: 4, intervalS: 0.9, startDelayS: 2.0 },
      { enemy: EnemyType.Plushy, count: 2, intervalS: 1.5, startDelayS: 3.0 },
    ],
  },
  // Wave 17 — hardcore mix (§6.3): +Splitters.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 14, intervalS: 0.35, startDelayS: 0 },
      { enemy: EnemyType.Snail, count: 6, intervalS: 0.8, startDelayS: 1.0 },
      { enemy: EnemyType.Flutter, count: 8, intervalS: 0.6, startDelayS: 1.5 },
      { enemy: EnemyType.Shade, count: 6, intervalS: 0.8, startDelayS: 2.0 },
      { enemy: EnemyType.Splitter, count: 3, intervalS: 1.4, startDelayS: 3.0 },
    ],
  },
  // Wave 18 — hardcore mix (§6.3): +Plushies.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 18, intervalS: 0.35, startDelayS: 0 },
      { enemy: EnemyType.Snail, count: 8, intervalS: 0.75, startDelayS: 1.0 },
      { enemy: EnemyType.Flutter, count: 6, intervalS: 0.6, startDelayS: 1.5 },
      { enemy: EnemyType.Shade, count: 6, intervalS: 0.8, startDelayS: 2.0 },
      { enemy: EnemyType.Plushy, count: 4, intervalS: 1.3, startDelayS: 3.0 },
    ],
  },
  // Wave 19 — hardcore finale before the dragon (§6.3): everything.
  {
    groups: [
      { enemy: EnemyType.Grub, count: 20, intervalS: 0.3, startDelayS: 0 },
      { enemy: EnemyType.Snail, count: 8, intervalS: 0.7, startDelayS: 1.0 },
      { enemy: EnemyType.Flutter, count: 8, intervalS: 0.55, startDelayS: 1.5 },
      { enemy: EnemyType.Shade, count: 8, intervalS: 0.7, startDelayS: 2.0 },
      { enemy: EnemyType.Splitter, count: 4, intervalS: 1.3, startDelayS: 3.0 },
      { enemy: EnemyType.Plushy, count: 3, intervalS: 1.4, startDelayS: 4.0 },
    ],
  },
  // Wave 20 — 🐲 NEON DRAGON, final boss (SPEC §6.2) + light support. Win on clear.
  {
    groups: [
      { enemy: EnemyType.NeonDragon, count: 1, intervalS: 1.0, startDelayS: 0 },
      { enemy: EnemyType.Flutter, count: 6, intervalS: 1.0, startDelayS: 2.0 },
      { enemy: EnemyType.Grub, count: 6, intervalS: 1.0, startDelayS: 3.0 },
    ],
  },
];

/** Prep gap (seconds) between a wave clearing and the next wave starting (§6.3). */
export const INTER_WAVE_DELAY_S = 3;

// --- ENDLESS MODE (SPEC §6.3 "Endless") ------------------------------------
/**
 * Endless scales count + HP with the wave index past the authored set. Per §6.3:
 * **HP ×1.15ⁿ, count ×1.05ⁿ**, **boss every 5 waves (rotating)**. The composition
 * below is DETERMINISTIC (no RNG → reproducible/testable); §6.3 says "random
 * composition" — using an n-cycle instead (FLAGGED). `n` = waves into endless
 * (1 at the first generated wave). The generated `Wave` object is built ONCE when
 * the wave starts (SpawnSystem), never per-frame.
 */
export const ENDLESS_HP_GROWTH = 0.15; // §6.3: HP ×1.15ⁿ
export const ENDLESS_COUNT_GROWTH = 0.05; // §6.3: count ×1.05ⁿ

/** Enemy-HP multiplier for `waveIndex` (1.0 for the authored waves, before `baseWaveCount`). */
export function endlessHpMult(waveIndex: number, baseWaveCount: number = WAVES.length): number {
  if (waveIndex < baseWaveCount) return 1;
  const n = waveIndex - baseWaveCount + 1;
  return (1 + ENDLESS_HP_GROWTH) ** n;
}

/**
 * Procedurally build the endless `Wave` at `waveIndex` (0-based, ≥ baseWaveCount).
 * Counts scale ×1.05ⁿ; HP scaling is applied at spawn via {@link endlessHpMult}.
 * A boss reprises every 5 waves (Neon Dragon every 10, else Candy King). ≤7 groups.
 */
export function genEndlessWave(waveIndex: number, baseWaveCount: number = WAVES.length): Wave {
  const n = Math.max(1, waveIndex - baseWaveCount + 1);
  const cm = (1 + ENDLESS_COUNT_GROWTH) ** n;
  const waveNumber = waveIndex + 1; // 1-based, for the boss cadence
  const groups: SpawnGroup[] = [];

  // Boss every 5 waves (rotating): Neon Dragon every 10, Candy King on the others.
  if (waveNumber % 5 === 0) {
    groups.push({
      enemy: waveNumber % 10 === 0 ? EnemyType.NeonDragon : EnemyType.CandyKing,
      count: 1,
      intervalS: 1,
      startDelayS: 0,
    });
  }
  // Always-present scaling core (monotonic with n).
  groups.push({
    enemy: EnemyType.Grub,
    count: Math.ceil(12 * cm),
    intervalS: Math.max(0.25, 0.5 - n * 0.005),
    startDelayS: 0.5,
  });
  groups.push({
    enemy: EnemyType.Snail,
    count: Math.ceil(4 * cm),
    intervalS: 0.9,
    startDelayS: 1.5,
  });
  groups.push({
    enemy: EnemyType.Flutter,
    count: Math.ceil(4 * cm),
    intervalS: 0.6,
    startDelayS: 2,
  });
  groups.push({
    enemy: EnemyType.Shade,
    count: Math.ceil(3 * cm),
    intervalS: 0.8,
    startDelayS: 2.5,
  });
  // Tougher enemies cycle in.
  if (n % 2 === 0)
    groups.push({
      enemy: EnemyType.Splitter,
      count: 2 + Math.floor(n / 4),
      intervalS: 1.3,
      startDelayS: 3,
    });
  if (n % 3 === 0)
    groups.push({ enemy: EnemyType.Plushy, count: 2, intervalS: 1.2, startDelayS: 3.5 });

  return { groups };
}
