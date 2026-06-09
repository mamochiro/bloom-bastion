import type { Graphics, Text } from "pixi.js";
import { Container } from "pixi.js";
import { gameTime } from "../clock";
import { Renderable, type World, renderableQuery } from "../ecs/world";
import type { System } from "../loop";
import {
  FLOATING_TEXT_POOL_SIZE,
  PARTICLE_POOL_SIZE,
  floatingTextPool,
  particlePool,
} from "../pool/pools";
import { getAppOrNull } from "./pixi-app";
import { tokenColor } from "./tokens";

/**
 * VFX juice (SPEC "juice over realism") — pooled particle bursts, floating
 * combat text, and transient hit-flash, driven by {@link AnimationSystem}
 * (slot 8, now REAL — the pipeline is 10/10 real).
 *
 * ZERO hot-path alloc is the hard requirement here: every visual is a pooled
 * Pixi object (§4.4 ParticlePool/FloatingTextPool), and per-frame state lives in
 * pre-allocated parallel TypedArrays. The per-frame tick only mutates numbers on
 * reused objects and swap-removes expired entries — it creates NOTHING. Spawn
 * helpers are EVENT-driven (on hit/death), do minor one-time geometry work, and
 * skip cleanly when a pool is exhausted (no alloc, no growth).
 *
 * Test-safety: visuals attach to a stage layer only when the renderer is booted
 * (`getAppOrNull`); without a stage (jsdom), spawns still acquire/track/release
 * from the pools and AnimationSystem still advances + releases them — so the
 * whole system is unit-testable via pool acquire/release counts, never throwing
 * and never needing a real canvas.
 */

const TAU = Math.PI * 2;

// --- Tunables --------------------------------------------------------------
const PARTICLE_RADIUS = 3;
const PARTICLE_LIFE_MIN = 0.3;
const PARTICLE_LIFE_MAX = 0.55;
const PARTICLE_SPEED_MIN = 50;
const PARTICLE_SPEED_MAX = 165;
const DEFAULT_BURST_COUNT = 12;

const FLOAT_TEXT_LIFE = 0.9;
const FLOAT_TEXT_DRIFT = -42; // px/s upward
const FLOAT_TEXT_SIZE = 20;

const FLASH_DURATION = 0.1; // seconds
const FLASH_TOKEN = "--text-bright"; // bright flash colour (FX multiply)
const TINT_WHITE = 0xffffff; // identity tint base (NOT a design colour)

// SPEC §4.5 adaptive-quality seam: scale burst particle count by current VFX
// quality (1 = full, →0 = minimal). perf-guardian/adaptive-quality drives this
// later; for now it's a no-op multiplier of 1.
let qualityScale = 1;
/** Scale future particle bursts by `scale` (clamped 0..1). SPEC §4.5 seam. */
export function setVfxQuality(scale: number): void {
  qualityScale = scale < 0 ? 0 : scale > 1 ? 1 : scale;
}

// --- Stage layer (lazy; null without a booted renderer) --------------------
let vfxLayer: Container | null = null;
function ensureLayer(): Container | null {
  if (vfxLayer) return vfxLayer;
  const app = getAppOrNull();
  if (!app) return null;
  vfxLayer = new Container();
  app.stage.addChild(vfxLayer);
  return vfxLayer;
}

// --- Particle active-list (parallel arrays, pre-allocated → zero-alloc) -----
const pG = new Array<Graphics>(PARTICLE_POOL_SIZE);
const pVX = new Float32Array(PARTICLE_POOL_SIZE);
const pVY = new Float32Array(PARTICLE_POOL_SIZE);
const pAge = new Float32Array(PARTICLE_POOL_SIZE);
const pLife = new Float32Array(PARTICLE_POOL_SIZE);
let pCount = 0;
// Particles drawn once (geometry is reused across pool acquisitions).
const drawn = new WeakSet<Graphics>();

// --- Floating-text active-list ---------------------------------------------
const tG = new Array<Text>(FLOATING_TEXT_POOL_SIZE);
const tAge = new Float32Array(FLOATING_TEXT_POOL_SIZE);
let tCount = 0;

/**
 * Emit a radial particle burst at world `(x, y)` in `tint` colour (`count`
 * particles, scaled by VFX quality). Pool-exhaustion → fewer/none, never grows.
 */
export function spawnBurst(
  worldX: number,
  worldY: number,
  tint: number,
  count = DEFAULT_BURST_COUNT,
): void {
  const layer = ensureLayer();
  const n = Math.max(0, Math.round(count * qualityScale));
  for (let i = 0; i < n; i++) {
    const g = particlePool.acquire();
    if (!g) break; // exhausted → skip the rest (no alloc, no growth)
    const angle = (i / Math.max(1, n)) * TAU + (Math.random() - 0.5) * 0.6;
    const speed = PARTICLE_SPEED_MIN + Math.random() * (PARTICLE_SPEED_MAX - PARTICLE_SPEED_MIN);
    // Visual setup only when a stage exists (mirrors RenderSystem); pool +
    // active-list bookkeeping below runs regardless so it's testable headless.
    if (layer) {
      if (!drawn.has(g)) {
        g.circle(0, 0, PARTICLE_RADIUS).fill(TINT_WHITE);
        drawn.add(g);
      }
      g.x = worldX;
      g.y = worldY;
      g.tint = tint;
      g.alpha = 1;
      g.visible = true;
      if (g.parent !== layer) layer.addChild(g);
    }

    const slot = pCount++;
    pG[slot] = g;
    pVX[slot] = Math.cos(angle) * speed;
    pVY[slot] = Math.sin(angle) * speed;
    pAge[slot] = 0;
    pLife[slot] = PARTICLE_LIFE_MIN + Math.random() * (PARTICLE_LIFE_MAX - PARTICLE_LIFE_MIN);
  }
}

/**
 * Emit a floating combat-text label (damage number, gold, …) at world `(x, y)`
 * that drifts up and fades. `tint` defaults to a bright token colour.
 */
export function spawnFloatingText(
  text: string,
  worldX: number,
  worldY: number,
  tint?: number,
): void {
  const t = floatingTextPool.acquire();
  if (!t) return; // exhausted → skip
  const layer = ensureLayer();
  // Visual setup only when a stage exists (mirrors RenderSystem); setting
  // Text.text/.style triggers glyph measurement that needs a real canvas.
  if (layer) {
    t.text = text;
    t.anchor.set(0.5, 0.5);
    t.style.fontSize = FLOAT_TEXT_SIZE;
    t.style.fill = tint ?? tokenColor(FLASH_TOKEN);
    t.x = worldX;
    t.y = worldY;
    t.alpha = 1;
    t.visible = true;
    if (t.parent !== layer) layer.addChild(t);
  }

  const slot = tCount++;
  tG[slot] = t;
  tAge[slot] = 0;
}

/**
 * Transient hit-flash: set the entity's FX tint to a bright colour for
 * ~{@link FLASH_DURATION}s. RenderSystem shows it (tint multiply); AnimationSystem
 * clears it back to 0 (native colours) once `gameTime() >= flashUntil`.
 */
export function flashEntity(eid: number): void {
  Renderable.tint[eid] = tokenColor(FLASH_TOKEN);
  Renderable.flashUntil[eid] = gameTime() + FLASH_DURATION;
}

/**
 * AnimationSystem (slot 8) — advance + recycle all VFX. ZERO per-frame alloc:
 * iterate the active lists, mutate pooled objects, swap-remove + release on
 * expiry; decay hit-flashes. Safe without a stage (pure state + pool ops).
 */
export const AnimationSystem: System = (world: World, dt: number): World => {
  // Particles: integrate, fade, release on expiry (swap-remove keeps it dense).
  for (let i = 0; i < pCount; ) {
    pAge[i] += dt;
    const g = pG[i];
    if (pAge[i] >= pLife[i]) {
      particlePool.release(g); // reset hook hides it; stays childed for reuse
      const last = --pCount;
      pG[i] = pG[last];
      pVX[i] = pVX[last];
      pVY[i] = pVY[last];
      pAge[i] = pAge[last];
      pLife[i] = pLife[last];
      continue; // reprocess slot i (now the swapped-in particle)
    }
    g.x += pVX[i] * dt;
    g.y += pVY[i] * dt;
    g.alpha = 1 - pAge[i] / pLife[i];
    i++;
  }

  // Floating text: drift up, fade, release on expiry.
  for (let i = 0; i < tCount; ) {
    tAge[i] += dt;
    const t = tG[i];
    if (tAge[i] >= FLOAT_TEXT_LIFE) {
      floatingTextPool.release(t);
      const last = --tCount;
      tG[i] = tG[last];
      tAge[i] = tAge[last];
      continue;
    }
    t.y += FLOAT_TEXT_DRIFT * dt;
    t.alpha = 1 - tAge[i] / FLOAT_TEXT_LIFE;
    i++;
  }

  // Hit-flash decay: clear transient tint once its window elapses.
  const now = gameTime();
  const ents = renderableQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    if (Renderable.flashUntil[eid] > 0 && now >= Renderable.flashUntil[eid]) {
      Renderable.tint[eid] = 0;
      Renderable.flashUntil[eid] = 0;
    }
  }

  return world;
};
