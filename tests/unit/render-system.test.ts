import { describe, expect, it } from "vitest";
import { getSpriteTexture } from "../../src/engine/renderer/pixi-app";
import { Sprite, idleBobOffsetY, idlePulseScale } from "../../src/engine/renderer/render-system";
import { SPRITE } from "../../src/game/config/sprites";

// RenderSystem draws real atlas Sprites keyed off `Renderable.spriteId`. These
// tests pin the engine's back-compat `Sprite` alias to the authoritative
// registry (so the two can't silently drift) and prove the test-safe path.
describe("RenderSystem texture wiring", () => {
  it("aliases match the authoritative sprite registry ids", () => {
    expect(Sprite.Tower).toBe(SPRITE["tower-blossom-l1"]);
    expect(Sprite.Enemy).toBe(SPRITE["enemy-grub"]);
    expect(Sprite.Projectile).toBe(SPRITE["projectile-petal"]);
    expect(Sprite.None).toBe(0);
  });

  it("getSpriteTexture is null before boot / for unknown ids (no throw)", () => {
    // No bootRenderer in jsdom → texture map is empty → every lookup is null.
    expect(getSpriteTexture(Sprite.Enemy)).toBeNull();
    expect(getSpriteTexture(Sprite.Tower)).toBeNull();
    expect(getSpriteTexture(99_999)).toBeNull();
  });
});

describe("idle motion (subtle, time-based, de-synced)", () => {
  it("bob stays within ±3px and is deterministic per (eid, t)", () => {
    for (let t = 0; t < 4; t += 0.13) {
      expect(Math.abs(idleBobOffsetY(5, t))).toBeLessThanOrEqual(3 + 1e-6);
    }
    expect(idleBobOffsetY(7, 2)).toBe(idleBobOffsetY(7, 2)); // pure
  });

  it("de-syncs entities by eid phase", () => {
    expect(idleBobOffsetY(1, 1)).not.toBeCloseTo(idleBobOffsetY(2, 1), 4);
  });

  it("pulse scale stays subtle near 1.0", () => {
    for (let t = 0; t < 4; t += 0.13) {
      const s = idlePulseScale(3, t);
      expect(s).toBeGreaterThan(0.94);
      expect(s).toBeLessThan(1.06);
    }
  });
});
