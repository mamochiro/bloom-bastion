import { describe, expect, it } from "vitest";
import {
  frameStep,
  getAverageFps,
  getQuality,
  getQualityMode,
  setQualityMode,
  startLoop,
  stopLoop,
} from "../../src/engine/loop";

/** Reset adaptive-quality + clock state without leaving a live rAF running. */
function reset(): void {
  startLoop();
  stopLoop();
}

/** Drive `frames` of ~`fps` frame-rate through frameStep (injected dt). */
function run(fps: number, frames: number): void {
  const dt = 1 / fps;
  for (let i = 0; i < frames; i++) frameStep(dt, false);
}

describe("adaptive quality (SPEC §4.5)", () => {
  it("starts at full quality", () => {
    reset();
    expect(getQuality()).toBe(1.0);
  });

  it("stays at 1.0 for a sustained ~60fps", () => {
    reset();
    run(62, 70); // >1s
    expect(getAverageFps()).toBeGreaterThan(55);
    expect(getQuality()).toBe(1.0);
  });

  it("drops to minimum (0.2) under sustained ~20fps", () => {
    reset();
    run(20, 25); // ≥1s at 20fps
    expect(getAverageFps()).toBeLessThan(35);
    expect(getQuality()).toBeCloseTo(0.2);
  });

  it("maps the mid FPS bands to 0.5 (45-54) and 0.25 (35-44)", () => {
    reset();
    run(50, 55);
    expect(getQuality()).toBe(0.5);

    reset();
    run(40, 45);
    expect(getQuality()).toBe(0.25);
  });

  it("hysteresis: a small dip within the margin does not downgrade", () => {
    reset();
    run(62, 70); // settle at 1.0
    expect(getQuality()).toBe(1.0);
    run(53, 54); // 53 ≥ 55−3 → still within margin, no thrash
    expect(getQuality()).toBe(1.0);
  });
});

describe("manual quality override (Settings, SPEC §4.5)", () => {
  it("defaults to auto on startLoop", () => {
    reset();
    expect(getQualityMode()).toBe("auto");
  });

  it('"high" pins 1.0 even under sustained low FPS', () => {
    reset();
    setQualityMode("high");
    expect(getQualityMode()).toBe("high");
    run(20, 30); // monitor would normally pull to 0.2…
    expect(getQuality()).toBe(1.0); // …but it's pinned high
  });

  it('"low" pins the minimum even at high FPS', () => {
    reset();
    setQualityMode("low");
    run(62, 70); // monitor would normally hold 1.0…
    expect(getQuality()).toBeCloseTo(0.2); // …but it's pinned low
  });

  it('switching back to "auto" resumes adaptation', () => {
    reset();
    setQualityMode("low"); // pinned 0.2
    expect(getQuality()).toBeCloseTo(0.2);
    setQualityMode("auto");
    run(62, 70); // sustained 60fps → adapt back up
    expect(getQuality()).toBe(1.0);
  });

  it("startLoop resets the mode to auto", () => {
    setQualityMode("low");
    expect(getQualityMode()).toBe("low");
    reset(); // startLoop()
    expect(getQualityMode()).toBe("auto");
  });
});
