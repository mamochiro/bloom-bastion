import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { PLACEABLE_TOWERS, TOWER_BY_TYPE, TowerType } from "../../../src/game/config/towers";
import {
  TowerCard,
  type TowerCardModel,
  TowerDeck,
  resolveTowerTap,
  towerCardModel,
} from "../../../src/ui/hud/TowerPicker";

const render = (props: Parameters<typeof TowerCard>[0]) =>
  renderToStaticMarkup(createElement(TowerCard, props));

// Synthetic deck: Blossom (50g) + a Stormcloud-like card (100g) so the
// generalized picker is fully exercised without waiting on gameplay's config.
const BLOSSOM_MODEL: TowerCardModel = {
  type: 0 as TowerCardModel["type"],
  name: "Blossom",
  cost: 50,
  spriteId: "tower-blossom-l1",
  accent: "var(--blossom-mid)",
};
const STORM_MODEL: TowerCardModel = {
  // typeId 1 — not yet in the TowerTypeId union (lands with gameplay's
  // Stormcloud config); cast through unknown to exercise the generic deck now.
  type: 1 as unknown as TowerCardModel["type"],
  name: "Stormcloud",
  cost: 100,
  spriteId: "tower-stormcloud-l1",
  accent: "var(--storm-mid)",
};
const DECK = [BLOSSOM_MODEL, STORM_MODEL];
const renderDeck = (gold: number, selected: TowerCardModel["type"] | null) =>
  renderToStaticMarkup(
    createElement(TowerDeck, { towers: DECK, gold, selected, onToggle: () => {} }),
  );

const baseCard = {
  name: "Blossom",
  cost: 50,
  spriteId: "tower-blossom-l1",
  accent: "var(--blossom-mid)",
  onToggle: () => {},
};

describe("resolveTowerTap", () => {
  it("selects an unselected, affordable card", () => {
    expect(resolveTowerTap(false, true)).toBe("select");
  });

  it("does nothing for an unselected, unaffordable card", () => {
    expect(resolveTowerTap(false, false)).toBe("noop");
  });

  it("toggles a selected card off (even if no longer affordable)", () => {
    expect(resolveTowerTap(true, true)).toBe("clear");
    expect(resolveTowerTap(true, false)).toBe("clear");
  });
});

describe("TowerCard", () => {
  it("is disabled and shows danger-coloured cost when gold < cost", () => {
    const html = render({ ...baseCard, affordable: false, selected: false });
    expect(html).toContain("disabled");
    expect(html).toContain("var(--danger)");
    expect(html).toContain("not enough gold");
  });

  it("is enabled and selectable (aria-pressed=false) when affordable", () => {
    const html = render({ ...baseCard, affordable: true, selected: false });
    expect(html).not.toContain("disabled");
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("var(--gold)");
    expect(html).toContain("tower-blossom-l1");
  });

  it("shows the selected state (aria-pressed=true, accent ring) when picked", () => {
    const html = render({ ...baseCard, affordable: true, selected: true });
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("var(--blossom-mid)");
  });

  it("stays enabled while selected even if unaffordable (so it can toggle off)", () => {
    const html = render({ ...baseCard, affordable: false, selected: true });
    expect(html).not.toContain("disabled");
  });

  it("uses design tokens only (no hardcoded hex/rgb colours)", () => {
    const html = render({ ...baseCard, affordable: true, selected: false });
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(html).not.toMatch(/\brgb\(/);
    // Font size from the --fs-* scale, never raw px.
    expect(html).not.toMatch(/font-size:\s*\d/);
  });
});

describe("TowerDeck — one card per placeable tower", () => {
  const countCards = (html: string) => (html.match(/<button/g) ?? []).length;

  it("renders one card per tower in the list (>=2)", () => {
    const html = renderDeck(150, null);
    expect(countCards(html)).toBe(DECK.length);
    expect(DECK.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain("Blossom tower");
    expect(html).toContain("Stormcloud tower");
    expect(html).toContain("tower-blossom-l1");
    expect(html).toContain("tower-stormcloud-l1");
  });

  it("disables only the Stormcloud card when 50 <= gold < 100", () => {
    const html = renderDeck(80, null);
    // Blossom (50) affordable — aria-label has NO "(not enough gold)" suffix
    // (the closing quote right after "gold" proves it).
    expect(html).toContain('aria-label="Blossom tower — 50 gold"');
    // Stormcloud (100) not affordable — suffixed.
    expect(html).toContain("Stormcloud tower — 100 gold (not enough gold)");
    // Exactly one disabled button (the Stormcloud card).
    expect((html.match(/disabled/g) ?? []).length).toBe(1);
  });

  it("enables both cards when gold covers the most expensive", () => {
    const html = renderDeck(100, null);
    expect((html.match(/disabled/g) ?? []).length).toBe(0);
  });

  it("marks the selected card (aria-pressed=true) and uses its family accent", () => {
    const html = renderDeck(150, STORM_MODEL.type);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-label="Stormcloud tower — 100 gold"');
    expect(html).toContain("var(--storm-mid)");
  });

  it("uses design tokens only across the whole deck (no hex/rgb, no raw px font-size)", () => {
    const html = renderDeck(150, null);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(html).not.toMatch(/\brgb\(/);
    expect(html).not.toMatch(/font-size:\s*\d/);
  });
});

describe("PLACEABLE_TOWERS + towerCardModel (derived from gameplay registry)", () => {
  it("lists every configured tower in ascending typeId order", () => {
    expect(PLACEABLE_TOWERS.length).toBe(Object.keys(TOWER_BY_TYPE).length);
    expect(PLACEABLE_TOWERS).toContain(TowerType.Blossom);
    const sorted = [...PLACEABLE_TOWERS].sort((a, b) => a - b);
    expect([...PLACEABLE_TOWERS]).toEqual(sorted);
  });

  it("projects each tower's config (name/cost/sprite/accent) into a card model", () => {
    const blossom = TOWER_BY_TYPE[TowerType.Blossom];
    const model = towerCardModel(TowerType.Blossom);
    expect(model).toMatchObject({
      type: TowerType.Blossom,
      name: blossom.name,
      cost: blossom.cost,
      spriteId: blossom.sprite,
      accent: "var(--blossom-mid)",
    });
  });
});

describe("TowerDeck — tapping a card reports its tower type", () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    container?.remove();
    container = null;
  });

  it("calls onToggle with the tapped tower's type (Stormcloud) when affordable", async () => {
    const picked: number[] = [];
    container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        createElement(TowerDeck, {
          towers: DECK,
          gold: 150,
          selected: null,
          onToggle: (t) => picked.push(t),
        }),
      );
    });
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(2);
    await act(async () => {
      buttons[1]?.dispatchEvent(new MouseEvent("click", { bubbles: true })); // Stormcloud
    });
    expect(picked).toEqual([STORM_MODEL.type]);
    await act(async () => {
      root.unmount();
    });
  });
});
