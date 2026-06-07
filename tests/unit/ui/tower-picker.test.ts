import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TowerCard, resolveTowerTap } from "../../../src/ui/hud/TowerPicker";

const render = (props: Parameters<typeof TowerCard>[0]) =>
  renderToStaticMarkup(createElement(TowerCard, props));

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
