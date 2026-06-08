import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import type { Difficulty } from "../../../src/store/difficulty";
import { StartScreenView } from "../../../src/ui/hud/StartScreen";

const noop = () => {};
const renderView = (selected: Difficulty) =>
  renderToStaticMarkup(
    createElement(StartScreenView, {
      selected,
      onSelectDifficulty: noop,
      onPlay: noop,
    }),
  );

describe("StartScreenView", () => {
  it("renders the Bloom Bastion title + 3-option difficulty radiogroup + Play", () => {
    const html = renderView("normal");
    expect(html).toContain("Bloom");
    expect(html).toContain("Bastion");
    expect(html).toContain("Tower Defense");
    expect(html).toContain('role="radiogroup"');
    expect((html.match(/type="radio"/g) ?? []).length).toBe(3);
    // Each option shows its start gold/lives in the accessible label.
    expect(html).toContain("Casual — 200 gold, 25 lives");
    expect(html).toContain("Normal — 150 gold, 20 lives");
    expect(html).toContain("Hardcore — 100 gold, 15 lives");
    expect(html).toContain("Play");
  });

  it("highlights exactly the selected difficulty (one checked radio)", () => {
    const html = renderView("hardcore");
    expect((html.match(/type="radio"/g) ?? []).length).toBe(3);
    expect((html.match(/checked=""/g) ?? []).length).toBe(1);
  });

  it("uses design tokens only (no hardcoded hex/rgb, no raw px font-size)", () => {
    const html = renderView("normal");
    expect(html).toMatch(/font-size:var\(--fs-/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(html).not.toMatch(/\brgb\(/);
    expect(html).not.toMatch(/font-size:\s*\d/);
  });
});

describe("StartScreenView — interaction", () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    container?.remove();
    container = null;
  });

  const mount = async (
    selected: Difficulty,
    onSelectDifficulty: (d: Difficulty) => void,
    onPlay: () => void,
  ) => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(StartScreenView, { selected, onSelectDifficulty, onPlay }));
    });
    return root;
  };

  it("tapping a difficulty radio reports its id", async () => {
    const picked: Difficulty[] = [];
    const root = await mount("normal", (d) => picked.push(d), noop);
    const casual = container?.querySelector<HTMLInputElement>('[aria-label^="Casual"]');
    expect(casual?.checked).toBe(false);
    await act(async () => {
      casual?.click();
    });
    expect(picked).toEqual(["casual"]);
    await act(async () => root.unmount());
  });

  it("marks the chosen radio as checked", async () => {
    const root = await mount("casual", noop, noop);
    const casual = container?.querySelector<HTMLInputElement>('[aria-label^="Casual"]');
    const normal = container?.querySelector<HTMLInputElement>('[aria-label^="Normal"]');
    expect(casual?.checked).toBe(true);
    expect(normal?.checked).toBe(false);
    await act(async () => root.unmount());
  });

  it("Play button calls onPlay", async () => {
    let played = 0;
    const root = await mount("normal", noop, () => {
      played += 1;
    });
    const play = [...(container?.querySelectorAll("button") ?? [])].find((b) =>
      b.textContent?.includes("Play"),
    );
    await act(async () => {
      play?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(played).toBe(1);
    await act(async () => root.unmount());
  });
});
