import { enterQuery, exitQuery } from "bitecs";
import { Container, Sprite as PixiSprite } from "pixi.js";
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

  // Steady state: update transform + FX tint only. Zero allocation.
  const ents = renderableQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const s = sprites.get(eid);
    if (!s) continue;
    s.x = Position.x[eid];
    s.y = Position.y[eid];
    const t = Renderable.tint[eid];
    // FX-only: 0 → native sprite colours; non-zero → multiply for hit-flash/glow.
    s.tint = t === 0 ? 0xffffff : t;
  }

  return world;
};
