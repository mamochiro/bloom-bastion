import { describe, expect, it } from "vitest";
import { frameStep, gameTime, startLoop, stopLoop } from "../../src/engine/loop";

// Bring the loop to a clean, NOT-running state with gameClock reset to 0,
// without leaving a live rAF churning in the background.
function resetClock(): void {
  startLoop(); // resets gameClock to 0 (+ schedules one rAF)
  stopLoop(); // cancels it; running=false so any stray tick is a no-op
}

describe("game clock (SPEC §4.6)", () => {
  it("accumulates the sum of applied (clamped) dt across ticks", () => {
    resetClock();
    const steps = [0.016, 0.02, 0.05, 0.008, 0.1 /* clamps to 0.05 */];
    let expected = 0;
    for (const d of steps) {
      frameStep(d, false);
      expected += Math.min(d, 0.05); // MAX_DT clamp (50ms)
    }
    expect(gameTime()).toBeCloseTo(expected, 6);
  });

  it("does not advance while paused", () => {
    resetClock();
    frameStep(0.02, false);
    const before = gameTime();
    frameStep(0.02, true); // paused
    frameStep(0.5, true); // paused (would-be huge step) — still ignored
    expect(gameTime()).toBe(before);
  });

  it("resets to 0 on startLoop()", () => {
    resetClock();
    frameStep(0.03, false);
    expect(gameTime()).toBeGreaterThan(0);
    startLoop(); // resets
    stopLoop();
    expect(gameTime()).toBe(0);
  });

  it("ignores non-positive dt", () => {
    resetClock();
    frameStep(-1, false);
    frameStep(0, false);
    expect(gameTime()).toBe(0);
  });
});
