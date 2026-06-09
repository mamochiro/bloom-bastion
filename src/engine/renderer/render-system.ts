import { enterQuery, exitQuery } from "bitecs";
import { Container, Sprite as PixiSprite } from "pixi.js";
import { gameTime } from "../clock";
import { Position, Renderable, type World, renderableQuery } from "../ecs/world";
import type { System } from "../loop";
import { getAppOrNull, getSpriteTexture } from "./pixi-app";

/**
 * RenderSystem (slot 9, SPEC §4.2) — draws every `Renderable + Position` entity
 * as a real Pixi `Sprite` textured from the boot-loaded SVG atlas
 * (`getSpriteTexture(Renderable.spriteId)`).
 *
 * Steady state is ZERO-alloc: one `Sprite` is created per entity on first sight
 * (bitECS `enterQuery`) and destroyed when it leaves the query (`exitQuery`).
 * Each frame only assigns `.x/.y/.tint` numbers on the reused Sprites.
 *
 * `Renderable.tint` is FX-ONLY (hit-flash / status glow), applied as a Pixi
 * multiply: `0` means "no tint" → the sprite shows its own SVG colours; a
 * non-zero value multiplies for the effect. Base colour lives in the art.
 *
 * Robustness: an unknown/missing `spriteId` (no texture — e.g. id 0, or any id
 * in a non-booted test world) is skipped, never drawn, never throws.
 *
 * Anchor by id range (SPEC art): towers (1–99) are GROUNDED at bottom-centre
 * `(0.5, 1.0)` (viewBox 0 0 120 150 → feet sit on `Position`); enemies (100–199)
 * and projectiles (200–299) are CENTRED `(0.5, 0.5)`.
 */

/**
 * spriteId aliases for gameplay factories. Values are aligned to the shared
 * registry ids (src/game/config/sprites.ts) so existing factories that set
 * `Renderable.spriteId = Sprite.Enemy` address the real per-type texture. This
 * is a back-compat alias during the atlas swap; the end state is factories
 * setting `spriteId` per-type directly from the registry (one id per art asset).
 */
export const Sprite = {
  /** 0 — nothing (no texture → not drawn). */
  None: 0,
  /** 1 — tower-blossom-l1. */
  Tower: 1,
  /** 100 — enemy-grub. */
  Enemy: 100,
  /** 200 — projectile-petal. */
  Projectile: 200,
} as const;

/** Towers (ids < 100) are grounded; enemies/projectiles are centred. */
const TOWER_ID_MAX = 99;
/** Enemy id band (100–199) — enemies bob; everything else pulses. */
const ENEMY_ID_MIN = 100;
const ENEMY_ID_MAX = 199;

// --- Idle motion (code-driven "life"; the designer's bob/pulse keyframes were
// deferred). Subtle, TIME-BASED, RENDER-ONLY (never mutates Position), and
// de-synced per eid so a crowd doesn't pulse in lockstep. Pure scalar math →
// zero alloc. Exported for unit tests (no stage needed).
const BOB_AMP = 3; // px vertical bob (enemies)
const BOB_FREQ = 2.2; // rad/s
const BOB_PHASE = 0.7; // per-eid desync
const PULSE_AMP = 0.045; // ±4.5% scale pulse (towers/projectiles → glow feel)
const PULSE_FREQ = 3.1; // rad/s
const PULSE_PHASE = 0.9;

/** Vertical bob offset (px) added to a sprite's y. Bounded to ±{@link BOB_AMP}. */
export function idleBobOffsetY(eid: number, t: number): number {
  return Math.sin(t * BOB_FREQ + eid * BOB_PHASE) * BOB_AMP;
}

/** Subtle scale multiplier near 1 for a glow-pulse feel. */
export function idlePulseScale(eid: number, t: number): number {
  return 1 + Math.sin(t * PULSE_FREQ + eid * PULSE_PHASE) * PULSE_AMP;
}

const onEnter = enterQuery(renderableQuery);
const onExit = exitQuery(renderableQuery);

/** eid → its Sprite. Created/removed only on spawn/death (cold path). */
const sprites = new Map<number, PixiSprite>();

let layer: Container | null = null;

export const RenderSystem: System = (world: World, _dt: number): World => {
  const app = getAppOrNull();
  if (!app) return world; // not booted (e.g. unit tests) → no-op

  if (!layer) {
    layer = new Container();
    app.stage.addChild(layer);
  }

  // New entities → create a Sprite if a texture exists (cold path).
  const entered = onEnter(world);
  for (let i = 0; i < entered.length; i++) {
    const eid = entered[i];
    const id = Renderable.spriteId[eid];
    const tex = getSpriteTexture(id);
    if (!tex) continue; // unknown/missing art (or test world) → skip, never crash
    const s = new PixiSprite(tex);
    if (id <= TOWER_ID_MAX)
      s.anchor.set(0.5, 1.0); // grounded
    else s.anchor.set(0.5, 0.5); // centred
    sprites.set(eid, s);
    layer.addChild(s);
  }

  // Departed entities → destroy their Sprite (cold path).
  const exited = onExit(world);
  for (let i = 0; i < exited.length; i++) {
    const eid = exited[i];
    const s = sprites.get(eid);
    if (s) {
      s.removeFromParent();
      s.destroy();
      sprites.delete(eid);
    }
  }

  // Steady state: transform (+ subtle idle motion) + tint. Zero allocation.
  const now = gameTime();
  const ents = renderableQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const s = sprites.get(eid);
    if (!s) continue;
    const id = Renderable.spriteId[eid];
    const px = Position.x[eid];
    const py = Position.y[eid];
    // Idle motion: render-only offset on top of Position (never mutated).
    if (id >= ENEMY_ID_MIN && id <= ENEMY_ID_MAX) {
      s.x = px;
      s.y = py + idleBobOffsetY(eid, now); // enemies: gentle vertical bob
    } else {
      s.x = px;
      s.y = py;
      s.scale.set(idlePulseScale(eid, now)); // towers/projectiles: glow pulse
    }
    // Tint precedence: flash overlay while flashing, else persistent baseTint.
    const flashing = Renderable.flashUntil[eid] > 0 && now < Renderable.flashUntil[eid];
    const col = flashing ? Renderable.tint[eid] : Renderable.baseTint[eid];
    // 0 → native sprite colours (white = identity multiply); non-zero → tint FX.
    s.tint = col === 0 ? 0xffffff : col;
  }

  return world;
};
