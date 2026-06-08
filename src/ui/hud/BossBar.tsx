import type { CSSProperties } from "react";
import { type BossSnapshot, useBoss } from "../../store/game-snapshot";

/**
 * Boss health bar (SPEC §6.2). A wide, prominent HP bar pinned near the TOP of
 * the screen (classic boss-bar placement) while a mini-boss (Candy King) is
 * alive. Container: reads the live boss snapshot; renders nothing when there's
 * no boss. Markup is the PURE {@link BossBarView}.
 */
export function BossBar() {
  const boss = useBoss();
  if (!boss) return null;
  return <BossBarView boss={boss} />;
}

/**
 * PURE boss bar (props in → markup out). Boss name + a fraction-driven fill bar
 * that eases smoothly as the ≤10Hz snapshot updates. Display only — tokens only
 * (incl `--fs-*`), safe-area aware, pointer-events:none. a11y: a progressbar
 * (0..100) labelled with the boss name.
 */
export function BossBarView({ boss }: { boss: BossSnapshot }) {
  // Clamp defensively so a stray fraction can't overflow/underflow the fill.
  const fraction = Math.max(0, Math.min(1, boss.hpFraction));
  const percent = Math.round(fraction * 100);

  const wrap: CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    // Below the top status strip, clear of the notch/safe area.
    top: "calc(max(env(safe-area-inset-top), var(--s3)) + var(--s8))",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--s1)",
    paddingLeft: "max(env(safe-area-inset-left), var(--s4))",
    paddingRight: "max(env(safe-area-inset-right), var(--s4))",
    pointerEvents: "none",
  };
  const name: CSSProperties = {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "var(--fs-sm)",
    letterSpacing: ".14em",
    textTransform: "uppercase",
    color: "var(--sugar-light)",
    textShadow: "0 0 12px var(--sugar-dark)",
  };
  const track: CSSProperties = {
    width: "100%",
    maxWidth: "520px",
    height: "var(--s3)",
    borderRadius: "var(--r-pill)",
    background: "color-mix(in srgb, var(--bg-abyss) 78%, transparent)",
    border: "1px solid var(--bg-line)",
    boxShadow: "var(--shadow-card)",
    overflow: "hidden",
  };
  const fill: CSSProperties = {
    width: `${percent}%`,
    height: "100%",
    borderRadius: "inherit",
    background: "linear-gradient(180deg, var(--sugar-mid), var(--sugar-dark))",
    boxShadow: "0 0 12px -2px var(--sugar-mid)",
    // Smooth easing between the throttled snapshot pushes.
    transition: "width .2s linear",
  };

  return (
    <div style={wrap}>
      <span style={name}>{boss.name}</span>
      {/* biome-ignore lint/a11y/useFocusableInteractive: read-only status indicator (display-only, pointer-events:none) — a progressbar is not an operable widget, so it is intentionally not focusable. */}
      <div
        style={track}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`${boss.name} health`}
      >
        <div style={fill} />
      </div>
    </div>
  );
}
