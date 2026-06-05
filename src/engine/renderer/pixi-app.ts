import { Application, Graphics } from "pixi.js";

// Field grid baseline (ADR-0002 / prototype): 60px cells on the battlefield.
const CELL = 60;

let app: Application | null = null;

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
  mount.appendChild(app.canvas);
  app.stage.addChild(drawGrid(app));
  return app;
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
