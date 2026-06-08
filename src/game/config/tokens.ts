/**
 * Design-token colours, packed as `0xRRGGBB` `ui32` — the FX-ONLY tint palette.
 *
 * `Renderable.tint` is FX-ONLY (LOCKED): an entity's BASE tint is `0` so the
 * RenderSystem shows the sprite's NATIVE SVG colours; a non-zero tint is a
 * TRANSIENT Pixi multiply for hit-flash / status glow. These tokens are the
 * approved colours for that transient FX (written later by DamageSystem etc.) —
 * they must NEVER be written as an entity's base tint (doing so mis-colours the
 * atlas sprite, the bug this palette's misuse caused).
 *
 * This is the ONLY place a colour literal is allowed in `src/game/`. Every value
 * is lifted verbatim from `design-assets/design-tokens.css` and named after its
 * CSS custom property — never a raw hex. Change a token here once.
 */
export const TINT = {
  /** --blossom-mid #ff6fa5 (Blossom tower family). */
  blossomMid: 0xff6fa5,
  /** --blossom-light #ffd6e8 (Blossom projectiles / petals). */
  blossomLight: 0xffd6e8,
  /** --shade-glow #c77dff (enemy-side corruption). */
  shadeGlow: 0xc77dff,
  /** --shade-core #8c4dff (deeper enemy corruption — heavier/armored enemies). */
  shadeCore: 0x8c4dff,
} as const;

export type Tint = (typeof TINT)[keyof typeof TINT];
