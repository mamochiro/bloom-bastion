import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { type SkillSnapshot, setSnapshot } from "../../../src/store/game-snapshot";
import type { SkillType } from "../../../src/store/skills";
import { FLASH_COLOR, SkillFlash, detectSkillActivation } from "../../../src/ui/hud/SkillFlash";

const skill = (type: SkillType, ready: boolean): SkillSnapshot => ({
  type,
  ready,
  unlocked: true,
  cooldownRemaining: ready ? 0 : 90,
  cooldownFraction: ready ? 0 : 1,
});

describe("detectSkillActivation (ready→fired edge)", () => {
  it("fires when a skill was ready and is now NOT ready", () => {
    expect(detectSkillActivation({ freeze: true }, [skill("freeze", false)])).toBe("freeze");
  });

  it("does NOT fire for a steadily-cooling skill (was already !ready)", () => {
    expect(detectSkillActivation({ freeze: false }, [skill("freeze", false)])).toBeNull();
  });

  it("does NOT fire when idle / first observation (no prev state)", () => {
    expect(detectSkillActivation({}, [skill("freeze", true)])).toBeNull();
  });

  it("does NOT fire while a ready skill stays ready", () => {
    expect(detectSkillActivation({ freeze: true }, [skill("freeze", true)])).toBeNull();
  });
});

describe("FLASH_COLOR (per-skill accent tokens)", () => {
  it("freeze → storm blue, goldRush → gold (design tokens)", () => {
    expect(FLASH_COLOR.freeze).toBe("var(--storm-mid)");
    expect(FLASH_COLOR.goldRush).toBe("var(--gold)");
    // every color is a token var, never a raw literal
    for (const c of Object.values(FLASH_COLOR)) expect(c).toMatch(/^var\(--/);
  });
});

describe("SkillFlash component", () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  let container: HTMLDivElement | null = null;

  const playing = (skills: readonly SkillSnapshot[]) =>
    setSnapshot({
      gold: 150,
      lives: 20,
      wave: 6,
      enemiesAlive: 0,
      gameStatus: "playing",
      skills,
      boss: null,
      selectedTower: null,
    });

  afterEach(() => {
    playing([]);
    container?.remove();
    container = null;
  });

  const mount = async (skills: readonly SkillSnapshot[]) => {
    playing(skills);
    container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(SkillFlash));
    });
    return root;
  };

  const flashEl = () => container?.querySelector(".skill-flash") ?? null;

  it("flashes on a freeze ready→fired edge with the storm accent", async () => {
    const root = await mount([skill("freeze", true)]); // ready: sets prev, no flash yet
    expect(flashEl()).toBeNull();
    await act(async () => playing([skill("freeze", false)])); // fired
    const el = flashEl();
    expect(el).not.toBeNull();
    expect(el?.getAttribute("aria-hidden")).toBe("true");
    expect(el?.getAttribute("style") ?? "").toContain("var(--storm-mid)");
    expect(el?.getAttribute("style") ?? "").toContain("pointer-events: none");
    await act(async () => root.unmount());
  });

  it("flashes gold on a goldRush activation", async () => {
    const root = await mount([skill("goldRush", true)]);
    await act(async () => playing([skill("goldRush", false)]));
    expect(flashEl()?.getAttribute("style") ?? "").toContain("var(--gold)");
    await act(async () => root.unmount());
  });

  it("does NOT flash while a skill steadily cools (no edge)", async () => {
    const root = await mount([skill("freeze", false)]);
    await act(async () => playing([skill("freeze", false)]));
    expect(flashEl()).toBeNull();
    await act(async () => root.unmount());
  });

  it("auto-dismisses the flash (no lingering overlay)", async () => {
    const root = await mount([skill("freeze", true)]);
    await act(async () => playing([skill("freeze", false)]));
    expect(flashEl()).not.toBeNull();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 320)); // > FLASH_MS
    });
    expect(flashEl()).toBeNull();
    await act(async () => root.unmount());
  });

  it("renders nothing when not playing", async () => {
    const root = await mount([skill("freeze", true)]);
    await act(async () =>
      setSnapshot({
        gold: 150,
        lives: 20,
        wave: 6,
        enemiesAlive: 0,
        gameStatus: "menu",
        skills: [skill("freeze", false)],
        boss: null,
        selectedTower: null,
      }),
    );
    expect(flashEl()).toBeNull();
    await act(async () => root.unmount());
  });
});
