/**
 * 🐝 Hive (Tower #5) — bee/queen minion tuning (SPEC §6.1). The Hive doesn't
 * fire; it maintains a SWARM of autonomous bees that patrol near it and attack
 * ground enemies. Most numbers below are NOT-LOCKED slice values (§6.1 only
 * specifies bee DMG/lifetime/count + queen DMG/lifetime) — flagged in the report.
 */
import { CELL } from "../map/coords";

// --- §6.1 LOCKED ----------------------------------------------------------
/** Worker bee damage per hit (SPEC §6.1: 5). */
export const BEE_DAMAGE = 5;
/** Worker bee lifetime in seconds (SPEC §6.1: 5s). */
export const BEE_LIFETIME_S = 5;
/** Base swarm size (SPEC §6.1: 3 worker bees). */
export const SWARM_SIZE_BASE = 3;
/** L2 "Bigger Swarm" size (SPEC §6.1: +2 → 5). */
export const SWARM_SIZE_BIG = 5;
/** Queen damage per hit (SPEC §6.1: 20). */
export const QUEEN_DAMAGE = 20;
/** Queen lifetime in seconds (SPEC §6.1: 10s). */
export const QUEEN_LIFETIME_S = 10;

// --- NOT-LOCKED (slice values, flagged) -----------------------------------
/** Hive summon-cooldown: top-up the swarm this often (s). */
export const HIVE_SUMMON_COOLDOWN_S = 1.0;
/** Bee free-flight speed (px/s) toward its target. */
export const BEE_SPEED_PX = 2.5 * CELL; // 150
/** Seconds between a bee's attacks. */
export const BEE_ATTACK_INTERVAL_S = 0.5;
/** A bee seeks the nearest ground enemy within this radius of ITSELF (px). */
export const BEE_SEEK_RADIUS_PX = 2.0 * CELL; // 120
/** A bee attacks once within this range of its target (px). */
export const BEE_ATTACK_RANGE_PX = 0.33 * CELL; // ~20
/**
 * Minions within this radius of a Hive count as "its swarm" for top-up. There is
 * no per-bee home/owner field (engine `Minion` has none), so proximity is the
 * patrol approximation — with multiple hives close together their swarms merge
 * in the count. Generous so a bee chasing an enemy still counts. (flagged)
 */
export const HIVE_COUNT_RADIUS_PX = 3.0 * CELL; // 180

/** Target swarm size at `level` (3 base, 5 at L2 "Bigger Swarm"+). */
export function swarmSize(level: number): number {
  return level >= 2 ? SWARM_SIZE_BIG : SWARM_SIZE_BASE;
}

/** Whether the Hive maintains a Queen at `level` (L3 "Queen Bee"). */
export function hiveHasQueen(level: number): boolean {
  return level >= 3;
}
