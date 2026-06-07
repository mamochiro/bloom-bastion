import { Application, Assets, Graphics, type Texture } from "pixi.js";
// Layering exception (accepted): the engine renderer reads the SHARED sprite
// registry that lives in src/game/config for now. It is pure data (id ↔ path);
// the registry can move into the engine later without touching this call site.
import { ALL_SPRITE_ASSETS, ASSET_BY_ID } from "../../game/config/sprites";

// Field grid baseline (ADR-0002 / prototype): 60px cells on the battlefield.
const CELL = 60;

let app: Application | null = null;

/** spriteId → loaded Texture, populated once at boot. Empty before boot/in tests. */
const spriteTextures = new Map<number, Texture>();

/**
 * Boot the PixiJS v8 renderer (WebGPU-first, WebGL fallback) and mount its
 * canvas. M0 smoke test: a dark battlefield with the design-token grid.
 */
export async function bootRenderer(mount: HTMLElement): Promise<Application> {
  app = new Application();
  await app.init({
    background: 0x1a0f2e, // --bg-deep
    resizeTo: window,
    antialias: true,
    preference: "webgpu",
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  });
  // Rasterise the SVG sprite atlas to GPU textures BEFORE returning, so the
  // RenderSystem has them ready the moment the loop starts.
  await loadSpriteTextures();
  mount.appendChild(app.canvas);
  app.stage.addChild(drawGrid(app));
  return app;
}

/** Load every sprite asset and index the resulting textures by `spriteId`. */
async function loadSpriteTextures(): Promise<void> {
  await Assets.load([...ALL_SPRITE_ASSETS]);
  for (const [idStr, path] of Object.entries(ASSET_BY_ID)) {
    const tex = Assets.get<Texture>(path);
    if (tex) spriteTextures.set(Number(idStr), tex);
  }
}

/**
 * The loaded Texture for a `Renderable.spriteId`, or `null` when unknown or not
 * loaded yet (before boot / in jsdom tests). RenderSystem skips drawing on null.
 */
export function getSpriteTexture(id: number): Texture | null {
  return spriteTextures.get(id) ?? null;
}

function drawGrid(pixi: Application): Graphics {
  const g = new Graphics();
  const { width, height } = pixi.screen;
  for (let x = 0; x <= width; x += CELL) g.moveTo(x, 0).lineTo(x, height);
  for (let y = 0; y <= height; y += CELL) g.moveTo(0, y).lineTo(width, y);
  g.stroke({ width: 1, color: 0x4a2f7a, alpha: 0.5 }); // --bg-line
  return g;
}

export function getApp(): Application {
  if (!app) throw new Error("Renderer not booted — call bootRenderer() first");
  return app;
}

/** Like {@link getApp} but returns `null` instead of throwing when not booted. */
export function getAppOrNull(): Application | null {
  return app;
}
