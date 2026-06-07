import { describe, expect, it } from "vitest";
import { getSpriteTexture } from "../../src/engine/renderer/pixi-app";
import { Sprite } from "../../src/engine/renderer/render-system";
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
