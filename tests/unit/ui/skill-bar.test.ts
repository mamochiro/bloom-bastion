import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { setSnapshot } from "../../../src/store/game-snapshot";
import {
  type SkillType,
  clearSkillAim,
  consumeSkillActivation,
  getSkillAim,
} from "../../../src/store/skills";
import {
  SkillBar,
  SkillBarView,
  type SkillRow,
  resolveSkillTap,
} from "../../../src/ui/hud/SkillBar";

const row = (type: SkillType, over: Partial<SkillRow> = {}): SkillRow => ({
  type,
  ready: false,
  unlocked: false,
  cooldownRemaining: 0,
  cooldownFraction: 0,
  ...over,
});

const READY = row("meteor", { ready: true, unlocked: true });
const COOLING = row("freeze", {
  ready: false,
  unlocked: true,
  cooldownRemaining: 3,
  cooldownFraction: 0.6,
});
const LOCKED = row("goldRush", { ready: false, unlocked: false });
const ROWS = [READY, COOLING, LOCKED];

const renderView = (rows: readonly SkillRow[], aimingType: SkillType | null = null) =>
  renderToStaticMarkup(createElement(SkillBarView, { rows, aimingType, onTap: () => {} }));

describe("resolveSkillTap", () => {
  it("noops a cooling-down or locked skill", () => {
    expect(resolveSkillTap(true, false, true, false)).toBe("noop"); // cooling
    expect(resolveSkillTap(false, true, false, false)).toBe("noop"); // locked
  });
  it("aims / cancels a targeted skill, activates an instant one", () => {
    expect(resolveSkillTap(true, true, true, false)).toBe("aim");
    expect(resolveSkillTap(true, true, true, true)).toBe("cancelAim");
    expect(resolveSkillTap(false, true, true, false)).toBe("activate");
  });
});

describe("SkillBarView", () => {
  it("renders one button per skill (3) in order", () => {
    const html = renderView(ROWS);
    expect((html.match(/<button/g) ?? []).length).toBe(3);
    expect(html).toContain("🌠");
    expect(html).toContain("❄️");
    expect(html).toContain("💰");
  });

  it("enables a ready+unlocked skill, disables cooling + locked ones", () => {
    const html = renderView(ROWS);
    // Meteor enabled, Freeze (cooling) + GoldRush (locked) disabled.
    expect((html.match(/aria-disabled="true"/g) ?? []).length).toBe(2);
    expect((html.match(/aria-disabled="false"/g) ?? []).length).toBe(1);
  });

  it("shows the cooldown countdown for a cooling skill", () => {
    const html = renderView(ROWS);
    expect(html).toContain("Freeze All, cooling down, 3 seconds");
    expect(html).toContain("conic-gradient"); // radial cooldown veil
  });

  it("shows the unlock hint for a locked skill", () => {
    const html = renderView(ROWS);
    expect(html).toContain("Gold Rush, locked until wave 10");
    expect(html).toContain("Wave 10");
  });

  it("marks the aiming skill aria-pressed + announces aiming", () => {
    const html = renderView(ROWS, "meteor");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Meteor, aiming — tap the battlefield");
  });

  it("uses design tokens only (no hex/rgb, no raw px font-size)", () => {
    const html = renderView(ROWS, "meteor");
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(html).not.toMatch(/\brgb\(/);
    expect(html).not.toMatch(/font-size:\s*\d/);
  });
});

describe("SkillBar container — taps drive the command store", () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    clearSkillAim();
    consumeSkillActivation();
    setSnapshot({
      gold: 150,
      lives: 20,
      wave: 1,
      enemiesAlive: 0,
      gameStatus: "playing",
      skills: [],
      boss: null,
    });
    container?.remove();
    container = null;
  });

  const mount = async () => {
    setSnapshot({
      gold: 150,
      lives: 20,
      wave: 10,
      enemiesAlive: 0,
      gameStatus: "playing",
      skills: [
        { type: "meteor", ready: true, unlocked: true, cooldownRemaining: 0, cooldownFraction: 0 },
        { type: "freeze", ready: true, unlocked: true, cooldownRemaining: 0, cooldownFraction: 0 },
        {
          type: "goldRush",
          ready: false,
          unlocked: false,
          cooldownRemaining: 0,
          cooldownFraction: 0,
        },
      ],
      boss: null,
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(SkillBar));
    });
    return root;
  };

  it("tapping Meteor (targeted) enters aim mode", async () => {
    const root = await mount();
    const meteor = container?.querySelector<HTMLButtonElement>('[aria-label^="Meteor"]');
    await act(async () => {
      meteor?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(getSkillAim()).toBe("meteor");
    await act(async () => root.unmount());
  });

  it("tapping Freeze (instant, ready) queues an activation", async () => {
    const root = await mount();
    const freeze = container?.querySelector<HTMLButtonElement>('[aria-label^="Freeze"]');
    await act(async () => {
      freeze?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(consumeSkillActivation()).toBe("freeze");
    await act(async () => root.unmount());
  });

  it("tapping a locked skill does nothing", async () => {
    const root = await mount();
    const gold = container?.querySelector<HTMLButtonElement>('[aria-label^="Gold Rush"]');
    await act(async () => {
      gold?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(consumeSkillActivation()).toBeNull();
    await act(async () => root.unmount());
  });
});
