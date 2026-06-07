/**
 * Resolve design-token colours (from `design-assets` → `src/ui/styles/tokens.css`,
 * loaded on `:root`) into Pixi `0xRRGGBB` numbers. This keeps the engine free of
 * hardcoded design hex — colours come from the single CSS source of truth.
 *
 * Reads `getComputedStyle` once per token and caches the result, so it is safe
 * to call from a cold path (sprite creation, layer init) but NOT meant for the
 * per-frame hot path.
 */

const cache = new Map<string, number>();

function parseHexColor(raw: string): number | null {
  let s = raw.trim();
  if (s.charCodeAt(0) === 35) s = s.slice(1); // strip '#'
  if (s.length === 3) {
    // #rgb → #rrggbb
    const r = s[0];
    const g = s[1];
    const b = s[2];
    s = `${r}${r}${g}${g}${b}${b}`;
  }
  if (s.length !== 6) return null;
  const n = Number.parseInt(s, 16);
  return Number.isNaN(n) ? null : n;
}

/**
 * Look up a CSS custom property (e.g. `"--shade-core"`) as an `0xRRGGBB` number.
 * Falls back to `fallback` (default white, a tint-neutral base) when the token
 * is unavailable — e.g. in a non-DOM test environment.
 */
export function tokenColor(name: string, fallback = 0xffffff): number {
  const hit = cache.get(name);
  if (hit !== undefined) return hit;
  let value = fallback;
  if (typeof document !== "undefined" && document.documentElement) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
    const parsed = parseHexColor(raw);
    if (parsed !== null) value = parsed;
  }
  cache.set(name, value);
  return value;
}
