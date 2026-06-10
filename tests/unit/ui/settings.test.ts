import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the engine quality seam — no real loop needed. Stateful so getQualityMode
// reflects the last setQualityMode (the store reads it at init).
const eng = vi.hoisted(() => {
  let mode: "auto" | "low" | "high" = "auto";
  return {
    setQualityMode: vi.fn((m: "auto" | "low" | "high") => {
      mode = m;
    }),
    getQualityMode: vi.fn(() => mode),
    getQuality: vi.fn(() => 1),
    getAverageFps: vi.fn(() => 60),
    reset: () => {
      mode = "auto";
    },
  };
});
vi.mock("../../../src/engine/loop", () => ({
  setQualityMode: eng.setQualityMode,
  getQualityMode: eng.getQualityMode,
  getQuality: eng.getQuality,
  getAverageFps: eng.getAverageFps,
}));

import {
  getQualityModeSelection,
  setQualityMode as storeSetQualityMode,
} from "../../../src/store/settings";
import { SettingsPanel } from "../../../src/ui/hud/SettingsPanel";
import { StartScreen } from "../../../src/ui/hud/StartScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  eng.reset();
  eng.setQualityMode.mockClear();
  storeSetQualityMode("auto"); // reset store selection
  eng.setQualityMode.mockClear();
});

describe("settings store", () => {
  it("setQualityMode updates the store AND calls the engine seam", () => {
    storeSetQualityMode("high");
    expect(eng.setQualityMode).toHaveBeenLastCalledWith("high");
    expect(getQualityModeSelection()).toBe("high");

    storeSetQualityMode("low");
    expect(eng.setQualityMode).toHaveBeenLastCalledWith("low");
    expect(getQualityModeSelection()).toBe("low");
  });
});

describe("SettingsPanel (static markup)", () => {
  const render = () => renderToStaticMarkup(createElement(SettingsPanel, { onClose: () => {} }));

  it("is a labelled dialog with a Quality radiogroup of 3 options + close", () => {
    const html = render();
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="Settings"');
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Render quality"');
    expect((html.match(/type="radio"/g) ?? []).length).toBe(3);
    expect(html).toContain("Auto");
    expect(html).toContain("High");
    expect(html).toContain("Low");
    expect(html).toContain('aria-label="Close settings"');
    expect(html).toContain("Auto adapts to your device FPS");
  });

  it("notes audio/haptics are deferred until sound is wired", () => {
    expect(render()).toMatch(/audio.*haptics/i);
  });

  it("uses design tokens only (no hex/rgb, no raw px font-size)", () => {
    const html = render();
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(html).not.toMatch(/\brgb\(/);
    expect(html).not.toMatch(/font-size:\s*\d/);
  });
});

describe("SettingsPanel — quality selection", () => {
  let container: HTMLDivElement | null = null;
  afterEach(() => {
    container?.remove();
    container = null;
  });

  const mount = async (onClose: () => void = () => {}) => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(SettingsPanel, { onClose }));
    });
    return root;
  };
  const radio = (prefix: string) =>
    container?.querySelector<HTMLInputElement>(`[aria-label^="${prefix}"]`) ?? null;

  it("selecting High / Low / Auto calls the engine seam + reflects in the store", async () => {
    const root = await mount();
    await act(async () => radio("High")?.click());
    expect(eng.setQualityMode).toHaveBeenLastCalledWith("high");
    expect(getQualityModeSelection()).toBe("high");
    expect(radio("High")?.checked).toBe(true);

    await act(async () => radio("Low")?.click());
    expect(eng.setQualityMode).toHaveBeenLastCalledWith("low");
    expect(getQualityModeSelection()).toBe("low");

    await act(async () => radio("Auto")?.click());
    expect(eng.setQualityMode).toHaveBeenLastCalledWith("auto");
    expect(getQualityModeSelection()).toBe("auto");
    await act(async () => root.unmount());
  });

  it("the X button calls onClose", async () => {
    let closed = 0;
    const root = await mount(() => {
      closed += 1;
    });
    const x = container?.querySelector<HTMLButtonElement>('[aria-label="Close settings"]');
    await act(async () => x?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(closed).toBe(1);
    await act(async () => root.unmount());
  });
});

describe("StartScreen — Settings gear opens the panel", () => {
  let container: HTMLDivElement | null = null;
  afterEach(() => {
    container?.remove();
    container = null;
  });

  const settingsDialog = () =>
    container?.querySelector('[role="dialog"][aria-label="Settings"]') ?? null;

  it("opens the Settings panel when the gear is tapped", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => root.render(createElement(StartScreen)));
    expect(settingsDialog()).toBeNull();

    const gear = container.querySelector<HTMLButtonElement>('button[aria-label="Settings"]');
    expect(gear).not.toBeNull();
    await act(async () => gear?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(settingsDialog()).not.toBeNull();
    await act(async () => root.unmount());
  });
});
