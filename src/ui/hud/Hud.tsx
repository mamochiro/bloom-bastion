import type { CSSProperties } from "react";
import { requestRestart } from "../../store/commands";
import { useGameStatus, useGold, useLives, useWave } from "../../store/game-snapshot";
import { BossBar } from "./BossBar";
import { SkillBar } from "./SkillBar";
import { SkillFlash } from "./SkillFlash";
import { StartScreen } from "./StartScreen";
import { TowerPicker } from "./TowerPicker";
import { UpgradePanel } from "./UpgradePanel";

/**
 * Heads-up display (SPEC §8, mockup `design-assets/screenshots/fix_hud.png` —
 * "Heads-up display, thumb-first"). A DOM overlay rendered OVER the Pixi canvas
 * (`#root`, SPEC §4.1) — never inside the canvas, never holding game state.
 *
 * This slice ships the top status strip (lives · wave · gold) reading the
 * <=10Hz snapshot mirror, plus the defeat treatment when the run is lost. Tower
 * picker / skill bar / NEXT-wave dock come in later slices.
 *
 * `Hud` is the container (subscribes to the snapshot store, one slice per
 * field); the actual markup lives in the PURE views below (props in → markup
 * out, no store) so they're trivially testable and re-render-cheap. Tokens only
 * — every colour/space/font is a CSS var from `src/ui/styles/tokens.css`.
 */
export function Hud() {
  const gold = useGold();
  const lives = useLives();
  const wave = useWave();
  const status = useGameStatus();
  return (
    <>
      {/* Decorative VFX first so the interactive HUD paints above it. */}
      <SkillFlash />
      <StatusStripView gold={gold} lives={lives} wave={wave} />
      <TowerPicker />
      {status === "playing" && <SkillBar />}
      {status === "playing" && <BossBar />}
      {status === "playing" && <UpgradePanel />}
      {status === "menu" && <StartScreen />}
      {status === "won" && <VictoryView gold={gold} wave={wave} />}
      {status === "lost" && <DefeatView gold={gold} wave={wave} />}
    </>
  );
}

/** Top strip of glanceable status pills. Display-only — lets canvas drags pass. */
export function StatusStripView({
  gold,
  lives,
  wave,
}: {
  gold: number;
  lives: number;
  wave: number;
}) {
  const strip: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "var(--s2)",
    // Safe-area insets on every side (notches, landscape rounded corners).
    paddingTop: "max(env(safe-area-inset-top), var(--s3))",
    paddingLeft: "max(env(safe-area-inset-left), var(--s3))",
    paddingRight: "max(env(safe-area-inset-right), var(--s3))",
    paddingBottom: "var(--s2)",
    // Status only — keep canvas (tower placement) interactive underneath.
    pointerEvents: "none",
  };

  return (
    <div style={strip}>
      <div style={{ display: "flex", gap: "var(--s2)" }}>
        <Pill
          icon="❤️"
          label={`${lives.toLocaleString()} lives remaining`}
          value={lives}
          accent="var(--danger)"
        />
        <Pill
          icon="🌊"
          label={`Wave ${wave.toLocaleString()}`}
          value={wave}
          prefix="WAVE"
          accent="var(--storm-mid)"
        />
      </div>
      <Pill icon="💰" label={`${gold.toLocaleString()} gold`} value={gold} accent="var(--gold)" />
    </div>
  );
}

/**
 * A frosted status pill: icon + tabular number, optional small uppercase prefix.
 * The whole pill carries an aria-label; the icon is decorative.
 */
function Pill({
  icon,
  label,
  value,
  accent,
  prefix,
}: {
  icon: string;
  label: string;
  value: number;
  accent: string;
  prefix?: string;
}) {
  const pill: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--s2)",
    minHeight: "36px",
    padding: "var(--s1) var(--s3)",
    borderRadius: "var(--r-pill)",
    // Frosted: translucent panel derived from a token (no hardcoded colour).
    background: "color-mix(in srgb, var(--bg-panel) 82%, transparent)",
    border: "1px solid var(--bg-line)",
    boxShadow: "var(--shadow-card)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    fontFamily: "var(--font-num)",
  };
  const prefixStyle: CSSProperties = {
    fontSize: "var(--fs-2xs)",
    fontWeight: 800,
    letterSpacing: ".14em",
    textTransform: "uppercase",
    color: "var(--text-dim)",
  };
  const valueStyle: CSSProperties = {
    fontSize: "var(--fs-base)",
    fontWeight: 800,
    lineHeight: 1,
    color: accent,
    fontVariantNumeric: "tabular-nums",
  };
  return (
    <div style={pill} aria-label={label}>
      <span aria-hidden="true" style={{ fontSize: "var(--fs-base)", lineHeight: 1 }}>
        {icon}
      </span>
      {prefix && <span style={prefixStyle}>{prefix}</span>}
      <span style={valueStyle}>{value.toLocaleString()}</span>
    </div>
  );
}

/**
 * Shared end-of-run overlay (mockups `02-proto_win.png` / DefeatOverlay).
 * Modal, captures pointer, token-tinted to `accent`. Renders the hero emoji,
 * title, a summary line, and the "Play Again" button — defeat and victory are
 * thin wrappers so the restart button is identical on both. PURE (props in →
 * markup out, no store) save for the `onPlayAgain` callback.
 */
function EndOverlay({
  accent,
  emoji,
  title,
  summary,
  ariaLabel,
  onPlayAgain,
}: {
  accent: string;
  emoji: string;
  title: string;
  summary: string;
  ariaLabel: string;
  onPlayAgain: () => void;
}) {
  const backdrop: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    padding: "var(--s5)",
    background: "color-mix(in srgb, var(--bg-abyss) 78%, transparent)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    // Safe area so the panel never hides under a notch in landscape.
    paddingTop: "max(env(safe-area-inset-top), var(--s5))",
    paddingBottom: "max(env(safe-area-inset-bottom), var(--s5))",
    pointerEvents: "auto",
  };
  const panel: CSSProperties = {
    width: "100%",
    maxWidth: "300px",
    padding: "var(--s6) var(--s5)",
    textAlign: "center",
    borderRadius: "var(--r-xl)",
    background: `radial-gradient(120% 100% at 50% 30%, color-mix(in srgb, ${accent} 16%, transparent), var(--bg-abyss))`,
    border: "1px solid var(--bg-line)",
    boxShadow: "var(--shadow-panel)",
  };
  const playAgain: CSSProperties = {
    pointerEvents: "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--s2)",
    width: "100%",
    minHeight: "var(--touch)",
    marginTop: "var(--s5)",
    padding: "0 var(--s5)",
    borderRadius: "var(--r-pill)",
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "var(--fs-lg)",
    color: "var(--bg-abyss)",
    background: `linear-gradient(180deg, ${accent}, color-mix(in srgb, ${accent} 70%, var(--bg-abyss)))`,
    boxShadow: `0 0 18px -4px ${accent}`,
  };

  return (
    <div style={backdrop} role="alertdialog" aria-modal="true" aria-label={ariaLabel}>
      <div style={panel}>
        <div aria-hidden="true" style={{ fontSize: "var(--fs-3xl)", lineHeight: 1 }}>
          {emoji}
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "var(--fs-2xl)",
            color: accent,
            textShadow: `0 0 18px ${accent}`,
            marginTop: "var(--s2)",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: "var(--font-num)",
            fontSize: "var(--fs-md)",
            color: "var(--text-soft)",
            marginTop: "var(--s2)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {summary}
        </div>
        <button type="button" style={playAgain} onClick={onPlayAgain}>
          <span aria-hidden="true">↻</span> Play Again
        </button>
      </div>
    </div>
  );
}

/**
 * Defeat treatment for `gameStatus === 'lost'` (mockup DefeatOverlay —
 * "BASTION FELL"). Play Again requests a run restart.
 */
export function DefeatView({ gold, wave }: { gold: number; wave: number }) {
  return (
    <EndOverlay
      accent="var(--danger)"
      emoji="🥀"
      title="BASTION FELL"
      summary={`Reached wave ${wave} · ${gold.toLocaleString()} gold left`}
      ariaLabel="Defeat — the bastion fell"
      onPlayAgain={requestRestart}
    />
  );
}

/**
 * Victory treatment for `gameStatus === 'won'` (mockup `02-proto_win.png` —
 * 🏆 + green title + score + "Play again"). Celebratory; Play Again restarts.
 */
export function VictoryView({ gold, wave }: { gold: number; wave: number }) {
  return (
    <EndOverlay
      accent="var(--success)"
      emoji="🏆"
      title="BLOOM PREVAILS"
      summary={`All ${wave.toLocaleString()} waves cleared · ${gold.toLocaleString()} gold banked`}
      ariaLabel="Victory — the bloom prevails"
      onPlayAgain={requestRestart}
    />
  );
}
