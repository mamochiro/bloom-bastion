import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { consumeStart, getStartMode, requestStart } from "../../../src/store/commands";
import type { Difficulty } from "../../../src/store/difficulty";
import { StartScreen, StartScreenView } from "../../../src/ui/hud/StartScreen";

const noop = () => {};
const renderView = (selected: Difficulty) =>
  renderToStaticMarkup(
    createElement(StartScreenView, {
      selected,
      onSelectDifficulty: noop,
      onPlay: noop,
      onEndless: noop,
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

  it("renders an Endless action with a no-win hint", () => {
    const html = renderView("normal");
    expect(html).toContain("Endless");
    expect(html).toContain("no win"); // hint + aria-label make the rules clear
    // Endless must not imply a win/victory.
    expect(html).not.toMatch(/prevail|victory/i);
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
    onEndless: () => void = noop,
  ) => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        createElement(StartScreenView, { selected, onSelectDifficulty, onPlay, onEndless }),
      );
    });
    return root;
  };

  const buttonWith = (text: string) =>
    [...(container?.querySelectorAll("button") ?? [])].find((b) => b.textContent?.includes(text));

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
    await act(async () => {
      buttonWith("Play")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(played).toBe(1);
    await act(async () => root.unmount());
  });

  it("Endless button calls onEndless", async () => {
    let endless = 0;
    const root = await mount("normal", noop, noop, () => {
      endless += 1;
    });
    await act(async () => {
      buttonWith("Endless")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(endless).toBe(1);
    await act(async () => root.unmount());
  });
});

describe("StartScreen container — Play vs Endless fire requestStart with the right mode", () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    requestStart(); // reset start mode to campaign
    consumeStart();
    container?.remove();
    container = null;
  });

  const mountScreen = async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(StartScreen));
    });
    return root;
  };
  const click = async (text: string) => {
    const btn = [...(container?.querySelectorAll("button") ?? [])].find((b) =>
      b.textContent?.includes(text),
    );
    await act(async () => {
      btn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  };

  it("Play fires requestStart() in campaign mode", async () => {
    const root = await mountScreen();
    await click("Play");
    expect(consumeStart()).toBe(true);
    expect(getStartMode()).toBe("campaign");
    await act(async () => root.unmount());
  });

  it("Endless fires requestStart('endless')", async () => {
    const root = await mountScreen();
    await click("Endless");
    expect(consumeStart()).toBe(true);
    expect(getStartMode()).toBe("endless");
    await act(async () => root.unmount());
  });
});
