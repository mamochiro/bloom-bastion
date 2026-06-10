import { type CSSProperties, useEffect, useState } from "react";
import { getAverageFps, getQuality } from "../../engine/loop";
import { type QualityMode, setQualityMode, useQualityMode } from "../../store/settings";

/** Quality options (UI presentation) — values map to the engine §4.5 modes. */
const QUALITY_OPTIONS: readonly { id: QualityMode; label: string; hint: string }[] = [
  { id: "auto", label: "Auto", hint: "Adapts to your device FPS" },
  { id: "high", label: "High", hint: "Full effects" },
  { id: "low", label: "Low", hint: "Saves battery" },
];

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
 * Settings panel (SPEC §6 Settings, §4.5 quality). A modal overlay opened from
 * the Start screen gear. This slice ships ONLY the Quality control (Auto / High
 * / Low → the engine quality seam) + a live FPS/quality readout.
 *
 * DEFERRED (SPEC §6): SFX volume / Music volume / Haptics — audio isn't wired
 * yet (no AudioManager / Howler), so those controls are out of scope; a
 * placeholder note marks where they'll land.
 *
 * Pure-ish: reads the settings store + engine getters, calls the store action.
 * Tokens only (incl `--fs-*`), ≥56px touch, safe-area, a11y (role=dialog).
 */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const quality = useQualityMode();
  // Live readout — poll the cheap scalar getters at ~3Hz, only while open.
  const [live, setLive] = useState<{ fps: number; quality: number } | null>(null);
  useEffect(() => {
    const tick = () => setLive({ fps: Math.round(getAverageFps()), quality: getQuality() });
    tick();
    const id = setInterval(tick, 300);
    return () => clearInterval(id);
  }, []);

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
    maxWidth: "360px",
    maxHeight: "100%",
    overflowY: "auto",
    padding: "var(--s5)",
    borderRadius: "var(--r-xl)",
    background: "radial-gradient(120% 80% at 50% 0%, var(--bg-stage), var(--bg-abyss))",
    border: "1px solid var(--bg-line)",
    boxShadow: "var(--shadow-panel)",
  };
  const headerRow: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--s3)",
  };
  const headerTitle: CSSProperties = {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "var(--fs-xl)",
    color: "var(--text-bright)",
  };
  const closeBtn: CSSProperties = {
    display: "grid",
    placeItems: "center",
    width: "var(--touch)",
    height: "var(--touch)",
    flex: "0 0 auto",
    borderRadius: "var(--r-pill)",
    border: "1px solid var(--bg-line)",
    background: "var(--bg-abyss)",
    color: "var(--text-soft)",
    cursor: "pointer",
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-lg)",
  };
  const sectionLabel: CSSProperties = {
    fontFamily: "var(--font-num)",
    fontSize: "var(--fs-2xs)",
    letterSpacing: ".18em",
    textTransform: "uppercase",
    color: "var(--luna-mid)",
    margin: "var(--s4) 0 var(--s2)",
  };
  const note: CSSProperties = {
    fontFamily: "var(--font-num)",
    fontSize: "var(--fs-2xs)",
    color: "var(--text-faint)",
    marginTop: "var(--s4)",
    lineHeight: 1.5,
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: a styled modal overlay, not a native <dialog> — keeps backdrop/z-layering control over the Pixi canvas.
    <div style={backdrop} role="dialog" aria-modal="true" aria-label="Settings">
      <div style={panel}>
        <div style={headerRow}>
          <span style={headerTitle}>⚙ Settings</span>
          <button type="button" style={closeBtn} onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div style={sectionLabel}>Quality</div>
        <div
          role="radiogroup"
          aria-label="Render quality"
          style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}
        >
          {QUALITY_OPTIONS.map((opt) => (
            <QualityRadio
              key={opt.id}
              label={opt.label}
              hint={opt.hint}
              selected={quality === opt.id}
              onSelect={() => setQualityMode(opt.id)}
            />
          ))}
        </div>
        <div
          style={{
            fontFamily: "var(--font-num)",
            fontSize: "var(--fs-2xs)",
            color: "var(--text-dim)",
            marginTop: "var(--s2)",
          }}
        >
          Auto adapts to your device FPS; Low saves battery; High = full effects.
        </div>

        {live && (
          <div
            aria-label={`Currently ${live.fps} FPS, quality ${Math.round(live.quality * 100)} percent`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "var(--s3)",
              marginTop: "var(--s4)",
              padding: "var(--s2) var(--s3)",
              borderRadius: "var(--r-md)",
              background: "var(--bg-abyss)",
              border: "1px solid var(--bg-line)",
              fontFamily: "var(--font-num)",
              fontSize: "var(--fs-sm)",
              fontVariantNumeric: "tabular-nums",
              color: "var(--text-soft)",
            }}
          >
            <span>{live.fps} FPS</span>
            <span>Quality {Math.round(live.quality * 100)}%</span>
          </div>
        )}

        <div style={note}>Audio & haptics settings arrive with sound (not wired yet).</div>
      </div>
    </div>
  );
}

/** One quality option — native radio (real radiogroup + keyboard) styled as a row. */
function QualityRadio({
  label,
  hint,
  selected,
  onSelect,
}: {
  label: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const row: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--s3)",
    width: "100%",
    minHeight: "var(--touch)",
    padding: "var(--s2) var(--s4)",
    borderRadius: "var(--r-md)",
    cursor: "pointer",
    background: selected ? "var(--bg-elevated)" : "var(--bg-panel)",
    border: `2px solid ${selected ? "var(--bubble-mid)" : "var(--bg-line)"}`,
    boxShadow: selected ? "0 0 16px -6px var(--bubble-mid)" : "none",
    transition: "border-color .12s, box-shadow .15s, background .15s",
  };
  return (
    <label style={row}>
      <input
        type="radio"
        name="bb-quality"
        checked={selected}
        onChange={onSelect}
        aria-label={`${label} quality — ${hint}`}
        style={SR_ONLY}
      />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "var(--fs-md)",
          color: selected ? "var(--bubble-light)" : "var(--text-bright)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-num)",
          fontSize: "var(--fs-2xs)",
          color: "var(--text-dim)",
        }}
      >
        {hint}
      </span>
    </label>
  );
}
