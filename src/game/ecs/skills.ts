/**
 * Active-skill RUNTIME state + activation (SPEC §6.4). GAME-side module state
 * (NOT React) — the store mirrors it via UISync.
 *
 * Cooldowns are `gameTime()` TIMESTAMPS (`readyAt`), so there is NO per-frame
 * cooldown-tick system: "ready" = `gameTime() >= readyAt`. Unlocks gate on
 * `clearedWaves` (highest wave cleared), bumped by SpawnSystem on each clear.
 * GoldRush is a timed buff (`goldRushActiveUntil`) read by DeathSystem; Freeze
 * writes `Status.stunnedUntil` read by PathFollowSystem. Zero-alloc (timestamp
 * compares + a scalar AoE scan).
 *
 * Effects only — skill VFX (meteor impact / freeze flash / gold sparkle) are
 * DEFERRED to a juice slice.
 */
import { Enemy, Position, type World, enemyQuery } from "../../engine/ecs/world";
import { Status } from "../../engine/ecs/world";
import { gameTime } from "../../engine/loop";
import { ENEMY_FLAGS } from "../config/enemies";
import { SKILLS, type SkillType } from "../config/skills";
import { TINT } from "../config/tokens";
import { CELL } from "../map/coords";
import { spawnBurst } from "../vfx";
import { applyDamage } from "./apply-damage";

/** gameTime at which each skill is usable again (≤ now ⇒ ready). */
const readyAt: Record<SkillType, number> = { meteor: 0, freeze: 0, goldRush: 0 };
/** gameTime until which kill rewards are doubled (GoldRush). */
let goldRushActiveUntil = 0;
/** Highest wave number cleared — drives unlock gates. */
let clearedWaves = 0;

/** Unlocked when enough waves cleared (Meteor unlockWave 0 ⇒ always). */
export function isUnlocked(type: SkillType): boolean {
  return clearedWaves >= SKILLS[type].unlockWave;
}

/** Off cooldown. */
export function isReady(type: SkillType): boolean {
  return gameTime() >= readyAt[type];
}

/** Seconds of cooldown left (0 when ready). */
export function cooldownRemaining(type: SkillType): number {
  return Math.max(0, readyAt[type] - gameTime());
}

/** Cooldown progress as a 0..1 fraction (1 = just used, 0 = ready). */
export function cooldownFraction(type: SkillType): number {
  const cd = SKILLS[type].cooldownS;
  return cd > 0 ? cooldownRemaining(type) / cd : 0;
}

/** Highest wave cleared (for tests/unlock display). */
export function getClearedWaves(): number {
  return clearedWaves;
}

/** SpawnSystem calls this on each wave clear to advance unlock gates. */
export function recordWaveCleared(waveNumber: number): void {
  if (waveNumber > clearedWaves) clearedWaves = waveNumber;
}

/** True while the GoldRush buff is active (DeathSystem reads this). */
export function isGoldRushActive(): boolean {
  return gameTime() < goldRushActiveUntil;
}

/** Reset all skill state for a fresh run (startGame / restart). */
export function resetSkills(): void {
  readyAt.meteor = 0;
  readyAt.freeze = 0;
  readyAt.goldRush = 0;
  goldRushActiveUntil = 0;
  clearedWaves = 0;
}

/** Meteor: armor-adjusted AoE damage to every enemy within radius of (x,y). */
function meteorStrike(
  world: World,
  x: number,
  y: number,
  aoeDamage: number,
  radiusPx: number,
): void {
  const radiusSq = radiusPx * radiusPx;
  const enemies = enemyQuery(world);
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    // Flying enemies (Flutter) are immune to AoE / ground-splash (SPEC §6.2).
    // Future splash towers (Sugar Cannon, Bubbler) must apply the SAME guard.
    if ((Enemy.flags[e] & ENEMY_FLAGS.Flying) !== 0) continue;
    const dx = Position.x[e] - x;
    const dy = Position.y[e] - y;
    if (dx * dx + dy * dy <= radiusSq) applyDamage(e, aoeDamage);
  }
  // VFX (cold skill event): a fiery/gold impact boom at the strike point.
  spawnBurst(x, y, TINT.gold, 30);
}

/**
 * Activate `type` (optionally aimed at world `x`,`y` for Meteor). Guards
 * unlock + cooldown; on success starts the cooldown and applies the effect.
 *
 * @returns true if activated, false if locked or still on cooldown.
 */
export function activateSkill(world: World, type: SkillType, x = 0, y = 0): boolean {
  if (!isUnlocked(type) || !isReady(type)) return false;

  const cfg = SKILLS[type];
  const now = gameTime();
  readyAt[type] = now + cfg.cooldownS; // start cooldown (using a skill always consumes it)

  switch (type) {
    case "meteor":
      // NOTE: §6.4 says "200 DMG" — applied armor-adjusted (via applyDamage) for
      // consistency with all other damage. FLAGGED in case §6.4 means raw.
      meteorStrike(world, x, y, cfg.aoeDamage ?? 0, (cfg.radiusTiles ?? 0) * CELL);
      break;
    case "freeze": {
      const until = now + (cfg.stunS ?? 0);
      const enemies = enemyQuery(world);
      for (let i = 0; i < enemies.length; i++) Status.stunnedUntil[enemies[i]] = until;
      break;
    }
    case "goldRush":
      goldRushActiveUntil = now + (cfg.durationS ?? 0);
      break;
  }
  return true;
}

/** GoldRush multiplier (DeathSystem applies it while active). */
export function goldMultiplier(): number {
  return isGoldRushActive() ? (SKILLS.goldRush.goldMult ?? 1) : 1;
}
