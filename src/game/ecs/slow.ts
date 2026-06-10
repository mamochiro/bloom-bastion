/**
 * Slow application (SPEC §6.1) — the ONE place an on-hit slow is stamped, so all
 * slow sources (Blossom 40%/2s, Sugar L3 Sticky Sugar 20%/1s, Bubbler 30%/1.5s)
 * share the SAME stacking rule and write the SAME ECS fields. GAME-side helper
 * over the engine `Status` component; zero-alloc (scalar timestamp/field writes).
 *
 * MULTIPLE-SLOW RULE — **STRONGEST-magnitude-wins, refresh-to-longer** [FLAG,
 * NOT-LOCKED — §6 says nothing about stacking]:
 *   - while a slow is ACTIVE (slowedUntil > now): keep the STRONGER magnitude
 *     (`slowFactor = min(current, 1−reduction)` — smaller factor = bigger slow)
 *     and extend the timer to whichever expiry is LATER
 *     (`slowedUntil = max(current, now+durationS)`). So a weaker-but-longer slow
 *     can extend the duration without weakening an active stronger slow.
 *   - otherwise (no active slow): the new slow simply takes effect.
 * PathFollow reads `slowFactor` ONLY while `slowedUntil > now`, so a stale factor
 * from a lapsed slow is never applied.
 */
import { Status } from "../../engine/ecs/world";
import { gameTime } from "../../engine/loop";

/**
 * Apply a slow of `reduction` (0..1, e.g. 0.4 = −40%) for `durationS` seconds to
 * `eid`. Sets `Status.slowFactor` (the speed multiplier) + `Status.slowedUntil`
 * per the strongest-wins / refresh-to-longer rule above.
 */
export function applySlow(eid: number, reduction: number, durationS: number): void {
  const now = gameTime();
  const factor = 1 - reduction; // speed multiplier (0.6 for a 40% slow)
  const until = now + durationS;
  if (now < Status.slowedUntil[eid]) {
    // A slow is already active: strongest magnitude wins, longer duration wins.
    Status.slowFactor[eid] = Math.min(Status.slowFactor[eid], factor);
    if (until > Status.slowedUntil[eid]) Status.slowedUntil[eid] = until;
  } else {
    Status.slowFactor[eid] = factor;
    Status.slowedUntil[eid] = until;
  }
}
