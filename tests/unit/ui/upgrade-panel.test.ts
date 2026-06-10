import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import {
  consumeClearSelection,
  consumeTowerSell,
  consumeTowerUpgrade,
} from "../../../src/store/commands";
import { type SelectedTowerSnapshot, setSnapshot } from "../../../src/store/game-snapshot";
import { UpgradePanel, UpgradePanelView } from "../../../src/ui/hud/UpgradePanel";

const tower = (over: Partial<SelectedTowerSnapshot> = {}): SelectedTowerSnapshot => ({
  eid: 7,
  name: "Blossom",
  level: 2,
  upgrade: { label: "Bigger Bloom", cost: 80 },
  sellValue: 35,
  ...over,
});

const renderView = (props: Parameters<typeof UpgradePanelView>[0]) =>
  renderToStaticMarkup(createElement(UpgradePanelView, props));
const noop = () => {};
const base = { onUpgrade: noop, onSell: noop, onClose: noop };

describe("UpgradePanelView", () => {
  it("shows tower name + level, the upgrade label·cost, and sell value", () => {
    const html = renderView({ ...base, tower: tower(), gold: 150 });
    expect(html).toContain("Blossom");
    expect(html).toContain("Lv 2");
    expect(html).toContain("Bigger Bloom · 80g");
    expect(html).toContain("Sell · +35g");
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="Close tower panel"');
  });

  it("enables the Upgrade button when gold >= cost", () => {
    const html = renderView({
      ...base,
      tower: tower({ upgrade: { label: "X", cost: 80 } }),
      gold: 80,
    });
    expect(html).not.toContain('aria-disabled="true"');
    expect(html).toContain('aria-label="Upgrade: X, 80 gold"');
  });

  it("disables + greys the Upgrade button when gold < cost", () => {
    const html = renderView({
      ...base,
      tower: tower({ upgrade: { label: "X", cost: 80 } }),
      gold: 50,
    });
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain("not enough gold");
    expect(html).toContain("opacity:0.5");
  });

  it("shows a MAX state (no upgrade) at level 3", () => {
    const html = renderView({ ...base, tower: tower({ level: 3, upgrade: null }), gold: 9999 });
    expect(html).toContain("MAX");
    expect(html).toContain("Lv 3");
    expect(html).toContain("disabled");
    expect(html).not.toContain("· 80g");
  });

  it("uses design tokens only (no hex/rgb, no raw px font-size)", () => {
    const html = renderView({ ...base, tower: tower(), gold: 150 });
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(html).not.toMatch(/\brgb\(/);
    expect(html).not.toMatch(/font-size:\s*\d/);
  });
});

describe("UpgradePanel container", () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  let container: HTMLDivElement | null = null;

  const snap = (
    selectedTower: SelectedTowerSnapshot | null,
    gameStatus = "playing" as const,
    gold = 150,
  ) =>
    setSnapshot({
      gold,
      lives: 20,
      wave: 5,
      enemiesAlive: 0,
      gameStatus,
      mode: "campaign",
      score: 0,
      skills: [],
      boss: null,
      selectedTower,
    });

  afterEach(() => {
    consumeTowerUpgrade();
    consumeTowerSell();
    consumeClearSelection();
    snap(null);
    container?.remove();
    container = null;
  });

  const mount = async (selectedTower: SelectedTowerSnapshot | null, gold = 150) => {
    snap(selectedTower, "playing", gold);
    container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(UpgradePanel));
    });
    return root;
  };

  const byLabel = (prefix: string) =>
    container?.querySelector<HTMLButtonElement>(`[aria-label^="${prefix}"]`) ?? null;

  it("renders nothing when no tower is selected", async () => {
    const root = await mount(null);
    expect(container?.querySelector('[role="dialog"]')).toBeNull();
    await act(async () => root.unmount());
  });

  it("renders the panel when a tower is selected", async () => {
    const root = await mount(tower());
    expect(container?.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container?.textContent).toContain("Blossom");
    await act(async () => root.unmount());
  });

  it("fires requestTowerUpgrade / Sell / clearSelection on the matching buttons", async () => {
    const root = await mount(tower(), 150);
    await act(async () =>
      byLabel("Upgrade:")?.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
    expect(consumeTowerUpgrade()).toBe(true);

    await act(async () =>
      byLabel("Sell tower")?.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
    expect(consumeTowerSell()).toBe(true);

    await act(async () =>
      byLabel("Close tower")?.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
    expect(consumeClearSelection()).toBe(true);
    await act(async () => root.unmount());
  });

  it("does not fire upgrade when the button is disabled (gold < cost)", async () => {
    const root = await mount(tower({ upgrade: { label: "X", cost: 80 } }), 50);
    await act(async () =>
      byLabel("Upgrade:")?.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
    expect(consumeTowerUpgrade()).toBe(false);
    await act(async () => root.unmount());
  });
});
