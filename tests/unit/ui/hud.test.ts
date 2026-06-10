import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { consumeRestart } from "../../../src/store/commands";
import { setSnapshot } from "../../../src/store/game-snapshot";
import {
  DefeatView,
  EndlessOverlayView,
  Hud,
  StatusStripView,
  VictoryView,
} from "../../../src/ui/hud/Hud";

// RTL is not wired in this project. The HUD container (`Hud`) wires the snapshot
// hooks to PURE presentational views; we render those views to static markup
// (react-dom/server) with explicit props — no store, no SSR-snapshot caveats.
// A separate test renders the container itself to prove it reads store defaults.
const render = (node: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(node);

describe("StatusStripView", () => {
  it("renders gold / lives / wave pills with the given values", () => {
    const html = render(createElement(StatusStripView, { gold: 150, lives: 20, wave: 1 }));
    expect(html).toContain("20 lives remaining");
    expect(html).toContain("Wave 1");
    expect(html).toContain("150 gold");
  });

  it("formats large numbers with tabular grouping", () => {
    const html = render(createElement(StatusStripView, { gold: 1250, lives: 12, wave: 5 }));
    expect(html).toContain("12 lives remaining");
    expect(html).toContain("Wave 5");
    expect(html).toContain("1,250 gold");
    expect(html).toContain("tabular-nums");
  });

  it("uses design tokens only (no hardcoded hex/rgb colours)", () => {
    const html = render(createElement(StatusStripView, { gold: 150, lives: 20, wave: 1 }));
    expect(html).toMatch(/var\(--gold\)/);
    expect(html).toMatch(/var\(--danger\)/);
    // No raw hex or rgb() colour literals leaked into the markup.
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(html).not.toMatch(/\brgb\(/);
    // Font sizes come from the --fs-* scale, never raw px.
    expect(html).toMatch(/font-size:var\(--fs-/);
    expect(html).not.toMatch(/font-size:\s*\d/);
  });
});

describe("DefeatView", () => {
  it("renders the BASTION FELL defeat treatment with reached wave + gold + Play Again", () => {
    const html = render(createElement(DefeatView, { gold: 80, wave: 6 }));
    expect(html).toContain("BASTION FELL");
    expect(html).toContain("Reached wave 6");
    expect(html).toContain("80 gold left");
    expect(html).toContain("Play Again");
    expect(html).toContain('role="alertdialog"');
  });
});

describe("VictoryView", () => {
  it("renders the BLOOM PREVAILS victory treatment with cleared waves + gold + Play Again", () => {
    const html = render(createElement(VictoryView, { gold: 320, wave: 20 }));
    expect(html).toContain("BLOOM PREVAILS");
    expect(html).toContain("All 20 waves cleared");
    expect(html).toContain("320 gold banked");
    expect(html).toContain("Play Again");
    expect(html).toContain('role="alertdialog"');
    // Celebratory success accent, tokens only.
    expect(html).toContain("var(--success)");
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(html).not.toMatch(/font-size:\s*\d/);
  });
});

describe("EndlessOverlayView", () => {
  it("shows the wave reached (score) and a Play Again, with no win/victory copy", () => {
    const html = render(createElement(EndlessOverlayView, { score: 23 }));
    expect(html).toContain("RUN ENDED");
    expect(html).toContain("Wave Reached: 23");
    expect(html).toContain("Play Again");
    expect(html).toContain('role="alertdialog"');
    expect(html).not.toMatch(/prevail|victory/i);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(html).not.toMatch(/font-size:\s*\d/);
  });
});

describe("Hud container — end-game phase gating", () => {
  // Client render in jsdom: the live snapshot store drives the gating
  // (renderToStaticMarkup would read only zustand's INITIAL server snapshot).
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    setSnapshot({
      gold: 150,
      lives: 20,
      wave: 1,
      enemiesAlive: 0,
      gameStatus: "playing",
      mode: "campaign",
      score: 0,
      skills: [],
      boss: null,
      selectedTower: null,
    });
    container?.remove();
    container = null;
  });

  const renderHudWith = async (
    status: "menu" | "playing" | "won" | "lost",
    wave: number,
    opts: { mode?: "campaign" | "endless"; score?: number } = {},
  ) => {
    setSnapshot({
      gold: 150,
      lives: 14,
      wave,
      enemiesAlive: 0,
      gameStatus: status,
      mode: opts.mode ?? "campaign",
      score: opts.score ?? 0,
      skills: [],
      boss: null,
      selectedTower: null,
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(Hud));
    });
    const html = container.innerHTML;
    await act(async () => {
      root.unmount();
    });
    return html;
  };

  it("renders the start screen on 'menu' (and no skill bar / end overlays)", async () => {
    const html = await renderHudWith("menu", 1);
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain("Bastion");
    expect(html).not.toContain('aria-label="Skills"');
    expect(html).not.toContain("BASTION FELL");
    expect(html).not.toContain("BLOOM PREVAILS");
  });

  it("renders the skill bar (not the menu/end overlays) while playing", async () => {
    const html = await renderHudWith("playing", 1);
    expect(html).toContain('aria-label="Skills"');
    expect(html).not.toContain('role="radiogroup"');
    expect(html).not.toContain("BASTION FELL");
    expect(html).not.toContain("BLOOM PREVAILS");
  });

  it("renders the campaign victory overlay (BLOOM PREVAILS) on win in campaign mode", async () => {
    const html = await renderHudWith("won", 20, { mode: "campaign" });
    expect(html).toContain("BLOOM PREVAILS");
    expect(html).not.toContain('aria-label="Skills"');
    expect(html).not.toContain("BASTION FELL");
  });

  it("renders the campaign defeat overlay (BASTION FELL) on loss in campaign mode", async () => {
    const html = await renderHudWith("lost", 9, { mode: "campaign" });
    expect(html).toContain("BASTION FELL");
    expect(html).not.toContain('aria-label="Skills"');
    expect(html).not.toContain("BLOOM PREVAILS");
  });

  it("shows the ENDLESS game-over summary (Wave Reached + score) on loss in endless mode", async () => {
    const html = await renderHudWith("lost", 14, { mode: "endless", score: 14 });
    expect(html).toContain("RUN ENDED");
    expect(html).toContain("Wave Reached: 14");
    // Endless never claims a win and is not the campaign defeat screen.
    expect(html).not.toContain("BLOOM PREVAILS");
    expect(html).not.toContain("BASTION FELL");
  });

  it("never shows a win state in endless mode (even if status is 'won')", async () => {
    const html = await renderHudWith("won", 30, { mode: "endless", score: 30 });
    expect(html).not.toContain("BLOOM PREVAILS");
    expect(html).not.toMatch(/prevail|victory/i);
  });
});

describe("Play Again button", () => {
  // React-act environment for client-side render + click interaction in jsdom.
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    consumeRestart(); // drain the flag between tests
    container?.remove();
    container = null;
  });

  it("requests a restart when tapped (defeat overlay)", async () => {
    expect(consumeRestart()).toBe(false);
    container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(DefeatView, { gold: 0, wave: 4 }));
    });
    const button = container.querySelector("button");
    expect(button?.textContent).toContain("Play Again");
    await act(async () => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(consumeRestart()).toBe(true);
    await act(async () => {
      root.unmount();
    });
  });
});
