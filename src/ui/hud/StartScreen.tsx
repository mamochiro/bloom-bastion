import type { CSSProperties } from "react";
import { DIFFICULTY, type Difficulty } from "../../game/config/difficulty";
import { requestStart } from "../../store/commands";
import { setDifficulty, useSelectedDifficulty } from "../../store/difficulty";

/**
 * UI presentation for the difficulty options — display ORDER, human LABEL, and
 * family ACCENT (proto colour coding: easy → success, normal → gold, hard →
 * danger). Order/label/accent are UI concerns; the start gold/lives come from
 * the canonical `DIFFICULTY` config (SPEC §6.5), never duplicated here.
 */
const DIFFICULTY_ORDER: readonly Difficulty[] = ["casual", "normal", "hardcore"];
const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  casual: "Casual",
  normal: "Normal",
  hardcore: "Hardcore",
};
const DIFFICULTY_ACCENT: Record<Difficulty, string> = {
  casual: "var(--success)",
  normal: "var(--gold)",
  hardcore: "var(--danger)",
};

/**
 * Start screen (mockup `design-assets/screenshots/01-proto_menus.png` /
 * proto MainMenu + DifficultySelect). Shown when `gameStatus === 'menu'` (boot
 * state). Container: reads the selected difficulty, wires the radiogroup +
 * Play. Markup is the PURE `StartScreenView` below.
 */
export function StartScreen() {
  const selected = useSelectedDifficulty();
  return (
    <StartScreenView selected={selected} onSelectDifficulty={setDifficulty} onPlay={requestStart} />
  );
}

/**
 * PURE start overlay (props in → markup out, no store). Title + difficulty
 * radiogroup + Play. Modal, captures pointer. Tokens only (incl `--fs-*`),
 * ≥56px touch targets, safe-area insets.
 */
export function StartScreenView({
  selected,
  onSelectDifficulty,
  onPlay,
}: {
  selected: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;
  onPlay: () => void;
}) {
  const backdrop: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    padding: "var(--s5)",
    paddingTop: "max(env(safe-area-inset-top), var(--s5))",
    paddingBottom: "max(env(safe-area-inset-bottom), var(--s5))",
    background: "color-mix(in srgb, var(--bg-abyss) 88%, transparent)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    pointerEvents: "auto",
  };
  const panel: CSSProperties = {
    width: "100%",
    maxWidth: "340px",
    maxHeight: "100%",
    overflowY: "auto",
    padding: "var(--s6) var(--s5)",
    textAlign: "center",
    borderRadius: "var(--r-xl)",
    background: "radial-gradient(120% 80% at 50% 0%, var(--bg-stage), var(--bg-abyss))",
    border: "1px solid var(--bg-line)",
    boxShadow: "var(--shadow-panel)",
  };
  const playBtn: CSSProperties = {
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
    background:
      "linear-gradient(180deg, var(--blossom-mid), color-mix(in srgb, var(--blossom-mid) 70%, var(--bg-abyss)))",
    boxShadow: "0 0 18px -4px var(--blossom-mid)",
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: a styled modal overlay, not a native <dialog> — keeps backdrop/z-layering control over the Pixi canvas.
    <div style={backdrop} role="dialog" aria-modal="true" aria-label="Bloom Bastion — start">
      <div style={panel}>
        <div aria-hidden="true" style={{ fontSize: "var(--fs-2xl)", lineHeight: 1 }}>
          🌸
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "var(--fs-3xl)",
            lineHeight: 1,
            margin: "var(--s2) 0 0",
            textShadow: "0 0 18px color-mix(in srgb, var(--blossom-mid) 60%, transparent)",
          }}
        >
          <span style={{ color: "var(--blossom-mid)" }}>Bloom</span>{" "}
          <span style={{ color: "var(--bubble-mid)" }}>Bastion</span>
        </h1>
        <div
          style={{
            fontFamily: "var(--font-num)",
            fontSize: "var(--fs-2xs)",
            letterSpacing: ".24em",
            textTransform: "uppercase",
            color: "var(--text-dim)",
            marginTop: "var(--s2)",
          }}
        >
          Tower Defense
        </div>

        <div
          role="radiogroup"
          aria-label="Difficulty"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--s2)",
            marginTop: "var(--s5)",
          }}
        >
          {DIFFICULTY_ORDER.map((id) => (
            <DifficultyRadio
              key={id}
              id={id}
              selected={selected === id}
              onSelect={() => onSelectDifficulty(id)}
            />
          ))}
        </div>

        <button type="button" style={playBtn} onClick={onPlay}>
          <span aria-hidden="true">▶</span> Play
        </button>
      </div>
    </div>
  );
}

/** Visually hidden but still focusable / accessible (the native radio input). */
const SR_ONLY: CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

/**
 * One difficulty option — a native `<input type="radio">` (real radiogroup
 * semantics + keyboard nav) visually hidden inside a `<label>` styled as a card:
 * label + start gold/lives, highlighted when selected, ≥56px touch target.
 */
function DifficultyRadio({
  id,
  selected,
  onSelect,
}: {
  id: Difficulty;
  selected: boolean;
  onSelect: () => void;
}) {
  const label = DIFFICULTY_LABEL[id];
  const accent = DIFFICULTY_ACCENT[id];
  // Start gold/lives from the canonical config (SPEC §6.5) — never duplicated.
  const { gold, lives } = DIFFICULTY[id];

  const row: CSSProperties = {
    pointerEvents: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--s3)",
    width: "100%",
    minHeight: "var(--touch)",
    padding: "var(--s2) var(--s4)",
    borderRadius: "var(--r-md)",
    cursor: "pointer",
    textAlign: "left",
    background: selected ? "var(--bg-elevated)" : "var(--bg-panel)",
    border: `2px solid ${selected ? accent : "var(--bg-line)"}`,
    boxShadow: selected ? `0 0 16px -6px ${accent}` : "none",
    transition: "border-color .12s, box-shadow .15s, background .15s",
  };
  return (
    <label style={row}>
      <input
        type="radio"
        name="bb-difficulty"
        checked={selected}
        onChange={onSelect}
        aria-label={`${label} — ${gold} gold, ${lives} lives`}
        style={SR_ONLY}
      />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "var(--fs-lg)",
          color: accent,
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--s3)",
          fontFamily: "var(--font-num)",
          fontSize: "var(--fs-sm)",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          color: "var(--text-soft)",
        }}
      >
        <span>
          <span aria-hidden="true">💰</span> {gold.toLocaleString()}
        </span>
        <span>
          <span aria-hidden="true">❤️</span> {lives.toLocaleString()}
        </span>
      </span>
    </label>
  );
}
