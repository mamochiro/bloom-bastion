import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { type BossSnapshot, setSnapshot } from "../../../src/store/game-snapshot";
import { BossBar, BossBarView } from "../../../src/ui/hud/BossBar";

const CANDY_KING: BossSnapshot = { name: "Candy King", hpFraction: 0.5 };
const renderView = (boss: BossSnapshot) =>
  renderToStaticMarkup(createElement(BossBarView, { boss }));

describe("BossBarView", () => {
  it("shows the boss name and a progressbar", () => {
    const html = renderView(CANDY_KING);
    expect(html).toContain("Candy King");
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-label="Candy King health"');
  });

  it("drives the fill width and aria-valuenow from hpFraction (0.5 -> 50%)", () => {
    const html = renderView({ name: "Candy King", hpFraction: 0.5 });
    expect(html).toContain("width:50%");
    expect(html).toContain('aria-valuenow="50"');
  });

  it("maps a full / nearly-dead boss correctly", () => {
    expect(renderView({ name: "Candy King", hpFraction: 1 })).toContain("width:100%");
    expect(renderView({ name: "Candy King", hpFraction: 0.07 })).toContain("width:7%");
  });

  it("clamps out-of-range fractions to [0, 100]%", () => {
    expect(renderView({ name: "X", hpFraction: 1.5 })).toContain("width:100%");
    expect(renderView({ name: "X", hpFraction: -0.2 })).toContain("width:0%");
  });

  it("uses design tokens only (no hex/rgb, no raw px font-size)", () => {
    const html = renderView(CANDY_KING);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(html).not.toMatch(/\brgb\(/);
    expect(html).not.toMatch(/font-size:\s*\d/);
  });
});

describe("BossBar container", () => {
  it("renders nothing when there is no boss", () => {
    expect(renderToStaticMarkup(createElement(BossBar))).toBe("");
  });
});

describe("BossBar — gated by snapshot + phase (in Hud)", () => {
  // Note: the Hud only mounts <BossBar/> during 'playing'; here we verify the
  // BossBar container itself shows/hides on the live boss snapshot.
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

  const renderWith = async (boss: BossSnapshot | null) => {
    setSnapshot({
      gold: 150,
      lives: 20,
      wave: 8,
      enemiesAlive: 3,
      gameStatus: "playing",
      mode: "campaign",
      score: 0,
      skills: [],
      boss,
      selectedTower: null,
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(BossBar));
    });
    const html = container.innerHTML;
    await act(async () => root.unmount());
    return html;
  };

  it("shows the bar when a boss is on the field", async () => {
    const html = await renderWith({ name: "Candy King", hpFraction: 0.8 });
    expect(html).toContain("Candy King");
    expect(html).toContain('role="progressbar"');
    // jsdom serializes inline style with a space ("width: 80%"); assert the
    // serialization-independent aria value instead.
    expect(html).toContain('aria-valuenow="80"');
  });

  it("hides the bar when there is no boss", async () => {
    const html = await renderWith(null);
    expect(html).toBe("");
  });
});
