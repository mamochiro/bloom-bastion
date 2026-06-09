/**
 * Authoritative sprite registry: atlas-key ↔ numeric `Renderable.spriteId` ↔
 * on-disk asset path. This is the single source of truth that the design assets
 * (`public/sprites.svg` symbols + `public/sprites/*.svg` files), the UI
 * (`<use href="/sprites.svg#KEY" />`), and — in round 2 — the engine RenderSystem
 * and gameplay factories all align to.
 *
 * ── ID ALLOCATION (stable once assigned; never renumber a live id) ──
 *   1–99    towers
 *   100–199 enemies
 *   200–299 projectiles
 *   300–399 tiles
 *
 * ── ROUND-2 RECONCILIATION (flagged for engine/gameplay) ──
 * Today the slice RenderSystem draws primitive shapes keyed by the engine
 * `Sprite` enum {None:0, Tower:1, Enemy:2, Projectile:3}, and factories set
 * `Renderable.spriteId` from THAT enum — so every tower shares id 1, every enemy
 * id 2. Real art is per-type, so that enum can't address it. Recommended fix:
 *   1. Factories set `Renderable.spriteId` from THIS registry (e.g.
 *      `spriteId("tower-blossom-l1")`, `spriteId("enemy-grub")`,
 *      `spriteId("projectile-petal")`) instead of the `Sprite` enum.
 *   2. RenderSystem keys its loaded `Texture` map off `Renderable.spriteId`
 *      using `ASSET_BY_ID` below (id → asset path), replacing `makeShape`.
 *   3. Retire the `Sprite` enum in render-system.ts (or alias Tower→1… only for
 *      back-compat during the swap). Tiles are drawn by the map/board layer, not
 *      the per-entity RenderSystem, but share this registry for one asset table.
 */

export const SPRITE = {
  // ── towers (1–99) ──
  "tower-blossom-l1": 1,
  "tower-stormcloud-l1": 2,
  // ── enemies (100–199) ──
  "enemy-grub": 100,
  "enemy-snail": 101,
  "enemy-candyking": 102,
  "enemy-flutter": 103,
  "enemy-splitter": 104,
  // ── projectiles (200–299) ──
  "projectile-petal": 200,
  // ── tiles (300–399) ──
  "tile-grass": 300,
  "tile-path": 301,
} as const;

export type SpriteKey = keyof typeof SPRITE;

/** Resolve an atlas key to its `ui16` `Renderable.spriteId`. */
export function spriteId(key: SpriteKey): number {
  return SPRITE[key];
}

/**
 * Per-sprite standalone SVG path (served from `public/`, so the URL is the path
 * minus `public/`). PixiJS v8 `Assets.load(path)` rasterises these to textures.
 * Keyed by atlas key; see `ASSET_BY_ID` for the id-keyed form the RenderSystem
 * uses at draw time.
 */
export const ASSET_PATH: Readonly<Record<SpriteKey, string>> = {
  "tower-blossom-l1": "/sprites/tower-blossom-l1.svg",
  "tower-stormcloud-l1": "/sprites/tower-stormcloud-l1.svg",
  "enemy-grub": "/sprites/enemy-grub.svg",
  "enemy-snail": "/sprites/enemy-snail.svg",
  "enemy-candyking": "/sprites/enemy-candyking.svg",
  "enemy-flutter": "/sprites/enemy-flutter.svg",
  "enemy-splitter": "/sprites/enemy-splitter.svg",
  "projectile-petal": "/sprites/projectile-petal.svg",
  "tile-grass": "/sprites/tile-grass.svg",
  "tile-path": "/sprites/tile-path.svg",
} as const;

/** `Renderable.spriteId` → asset path, for the RenderSystem's id-keyed texture map. */
export const ASSET_BY_ID: Readonly<Record<number, string>> = Object.fromEntries(
  (Object.keys(SPRITE) as SpriteKey[]).map((k) => [SPRITE[k], ASSET_PATH[k]]),
);

/** Every loadable sprite asset, for a single boot-time `Assets.load([...])`. */
export const ALL_SPRITE_ASSETS: readonly string[] = Object.values(ASSET_PATH);
