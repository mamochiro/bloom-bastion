import { afterEach, describe, expect, it } from "vitest";
import {
  consumeTap,
  initInput,
  pointerWorldX,
  pointerWorldY,
  teardownInput,
} from "../../src/engine/input/input";

/** Build a canvas with a fixed logical (backing) size and CSS rect. */
function makeCanvas(backingW: number, backingH: number, rect: Partial<DOMRect>): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = backingW;
  c.height = backingH;
  const r = { left: 0, top: 0, width: backingW, height: backingH, ...rect } as DOMRect;
  c.getBoundingClientRect = () => r;
  return c;
}

/** Dispatch a pointer-typed event (MouseEvent carries clientX/clientY in jsdom). */
function pointer(c: HTMLCanvasElement, type: string, clientX: number, clientY: number): void {
  c.dispatchEvent(new MouseEvent(type, { clientX, clientY, bubbles: true }));
}

afterEach(() => {
  teardownInput();
});

describe("pointer input primitive", () => {
  it("maps a tap to world px and edge-consumes the tap once", () => {
    // DPR 1: logical == backing == rect, so world px == client px.
    Object.defineProperty(window, "devicePixelRatio", { value: 1, configurable: true });
    const c = makeCanvas(300, 180, { left: 0, top: 0, width: 300, height: 180 });
    expect(initInput(c)).toBe(true);

    pointer(c, "pointerdown", 120, 90);
    pointer(c, "pointerup", 120, 90);

    expect(pointerWorldX()).toBeCloseTo(120, 6);
    expect(pointerWorldY()).toBeCloseTo(90, 6);
    expect(consumeTap()).toBe(true); // fires once
    expect(consumeTap()).toBe(false); // then cleared
  });

  it("maps into Position space under canvas CSS scaling (rect != logical)", () => {
    Object.defineProperty(window, "devicePixelRatio", { value: 1, configurable: true });
    // Logical 300×180 but the canvas is CSS-shrunk to 150×90 → scale ×2.
    const c = makeCanvas(300, 180, { left: 10, top: 20, width: 150, height: 90 });
    initInput(c);

    pointer(c, "pointerdown", 10 + 75, 20 + 45); // rect-local (75,45)
    pointer(c, "pointerup", 10 + 75, 20 + 45);

    expect(pointerWorldX()).toBeCloseTo(150, 6); // 75 × (300/150)
    expect(pointerWorldY()).toBeCloseTo(90, 6); // 45 × (180/90)
    expect(consumeTap()).toBe(true);
  });

  it("does not register a tap when the pointer drags past the slop", () => {
    Object.defineProperty(window, "devicePixelRatio", { value: 1, configurable: true });
    const c = makeCanvas(300, 180, { width: 300, height: 180 });
    initInput(c);

    pointer(c, "pointerdown", 100, 100);
    pointer(c, "pointermove", 140, 100); // 40px > slop
    pointer(c, "pointerup", 140, 100);

    expect(consumeTap()).toBe(false);
    expect(pointerWorldX()).toBeCloseTo(140, 6); // position still tracked
  });

  it("is a safe no-op before boot / with no canvas", () => {
    // No initInput target available (renderer not booted in jsdom).
    expect(initInput()).toBe(false);
    expect(() => pointerWorldX()).not.toThrow();
    expect(pointerWorldX()).toBe(0);
    expect(pointerWorldY()).toBe(0);
    expect(consumeTap()).toBe(false);
  });
});
