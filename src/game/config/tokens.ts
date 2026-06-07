/**
 * Design-token colours, packed as `0xRRGGBB` `ui32` for `Renderable.tint`.
 *
 * This is the ONLY place a colour literal is allowed in `src/game/`. Every value
 * is lifted verbatim from `design-assets/design-tokens.css` (mirrored in
 * `src/ui/styles/tokens.css`) and named after its CSS custom property, so
 * config tables reference a token (`TINT.blossomMid`) — never a raw hex. When a
 * token changes upstream, change it here once.
 */
export const TINT = {
  /** --blossom-mid #ff6fa5 (Blossom tower family). */
  blossomMid: 0xff6fa5,
  /** --blossom-light #ffd6e8 (Blossom projectiles / petals). */
  blossomLight: 0xffd6e8,
  /** --shade-glow #c77dff (enemy-side corruption). */
  shadeGlow: 0xc77dff,
} as const;

export type Tint = (typeof TINT)[keyof typeof TINT];
