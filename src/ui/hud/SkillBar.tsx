import type { CSSProperties } from "react";
import { SKILLS, SKILL_ORDER, type SkillType } from "../../game/config/skills";
import type { SkillSnapshot } from "../../store/game-snapshot";
import { useSkills } from "../../store/game-snapshot";
import {
  clearSkillAim,
  requestSkillActivation,
  selectSkillAim,
  useSkillAim,
} from "../../store/skills";

/**
 * UI-only skill presentation — display name, icon, family accent. NOT a copy of
 * gameplay config: `aim`/`unlockWave`/cooldown all come from the canonical
 * `SKILLS[type]` (config/skills.ts). Keyed by SkillType so it stays in sync.
 */
interface SkillPresentation {
  name: string;
  icon: string;
  accent: string;
}
const SKILL_UI: Record<SkillType, SkillPresentation> = {
  meteor: { name: "Meteor", icon: "🌠", accent: "var(--sugar-mid)" },
  freeze: { name: "Freeze All", icon: "❄️", accent: "var(--storm-mid)" },
  goldRush: { name: "Gold Rush", icon: "💰", accent: "var(--gold)" },
};

/** Normalized per-skill render row (snapshot state merged with config fallback). */
export interface SkillRow {
  type: SkillType;
  ready: boolean;
  unlocked: boolean;
  cooldownRemaining: number;
  cooldownFraction: number;
}

/** Merge the live snapshot slice with config fallbacks, in SKILL_ORDER. */
export function skillRows(skills: readonly SkillSnapshot[]): SkillRow[] {
  return SKILL_ORDER.map((type) => {
    const s = skills.find((x) => x.type === type);
    return {
      type,
      ready: s?.ready ?? false,
      // Until UISync first pushes, fall back to "unlocked iff available wave 1".
      unlocked: s?.unlocked ?? SKILLS[type].unlockWave <= 1,
      cooldownRemaining: s?.cooldownRemaining ?? 0,
      cooldownFraction: s?.cooldownFraction ?? 0,
    };
  });
}

export type SkillTap = "aim" | "cancelAim" | "activate" | "noop";

/**
 * Pure tap resolution: disabled (cooling/locked) → noop; a targeted skill
 * toggles aim; an instant skill activates.
 */
export function resolveSkillTap(
  isAim: boolean,
  ready: boolean,
  unlocked: boolean,
  aiming: boolean,
): SkillTap {
  if (!ready || !unlocked) return "noop";
  if (isAim) return aiming ? "cancelAim" : "aim";
  return "activate";
}

/**
 * Skill bar (SPEC §6.4, mockup `design-assets/screenshots/fix_hud2.png` — "Skill
 * buttons … with cooldown rings"). Container: reads the live skill states +
 * aim selection, wires taps to the skill command store. Markup is the PURE
 * `SkillBarView` below.
 */
export function SkillBar() {
  const skills = useSkills();
  const aiming = useSkillAim();
  const rows = skillRows(skills);

  const onTap = (type: SkillType) => {
    const row = rows.find((r) => r.type === type);
    if (!row) return;
    switch (resolveSkillTap(SKILLS[type].aim, row.ready, row.unlocked, aiming === type)) {
      case "aim":
        selectSkillAim(type);
        break;
      case "cancelAim":
        clearSkillAim();
        break;
      case "activate":
        requestSkillActivation(type);
        break;
      // "noop" — disabled button can't fire.
    }
  };

  return <SkillBarView rows={rows} aimingType={aiming} onTap={onTap} />;
}

/**
 * PURE skill bar — a thumb-reachable column of round skill buttons floating
 * bottom-right. Tokens only (incl `--fs-*`), ≥56px touch, safe-area.
 *
 * Pointer-events discipline: the bar is `pointer-events:none` so the battlefield
 * stays tappable (Meteor targeting + tower placement); only the buttons opt back
 * in (`pointer-events:auto`).
 */
export function SkillBarView({
  rows,
  aimingType,
  onTap,
}: {
  rows: readonly SkillRow[];
  aimingType: SkillType | null;
  onTap: (type: SkillType) => void;
}) {
  const bar: CSSProperties = {
    position: "absolute",
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    gap: "var(--s3)",
    paddingRight: "max(env(safe-area-inset-right), var(--s4))",
    // Sit above the bottom tower dock (its ~96px) + the safe area.
    paddingBottom: "calc(max(env(safe-area-inset-bottom), var(--s4)) + var(--s8) + var(--s5))",
    pointerEvents: "none",
  };
  return (
    <div style={bar} aria-label="Skills">
      {rows.map((row) => (
        <SkillButton
          key={row.type}
          type={row.type}
          row={row}
          aiming={aimingType === row.type}
          onTap={() => onTap(row.type)}
        />
      ))}
    </div>
  );
}

/** One round skill button: icon, cooldown radial + countdown, lock hint. */
function SkillButton({
  type,
  row,
  aiming,
  onTap,
}: {
  type: SkillType;
  row: SkillRow;
  aiming: boolean;
  onTap: () => void;
}) {
  const { name, icon, accent } = SKILL_UI[type];
  const { aim, unlockWave } = SKILLS[type]; // canonical config (SPEC §6.4)
  const locked = !row.unlocked;
  const cooling = row.unlocked && !row.ready;
  const enabled = row.ready && row.unlocked;
  const disabled = !enabled;

  const ariaLabel = locked
    ? `${name}, locked until wave ${unlockWave}`
    : cooling
      ? `${name}, cooling down, ${Math.ceil(row.cooldownRemaining)} seconds`
      : aiming
        ? `${name}, aiming — tap the battlefield`
        : name;

  const button: CSSProperties = {
    pointerEvents: "auto",
    position: "relative",
    display: "grid",
    placeItems: "center",
    width: "60px",
    height: "60px",
    minWidth: "var(--touch)",
    minHeight: "var(--touch)",
    borderRadius: "var(--r-pill)",
    cursor: disabled ? "default" : "pointer",
    background: "color-mix(in srgb, var(--bg-panel) 88%, transparent)",
    border: `2px solid ${aiming ? accent : enabled ? accent : "var(--bg-line)"}`,
    boxShadow: aiming ? `0 0 16px -2px ${accent}` : enabled ? "var(--shadow-card)" : "none",
    opacity: locked ? 0.45 : 1,
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    transition: "border-color .12s, box-shadow .15s, opacity .15s",
  };
  // Radial cooldown veil: covers `cooldownFraction` of the circle (shrinks to 0).
  const cooldownVeil: CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    background: `conic-gradient(color-mix(in srgb, var(--bg-abyss) 72%, transparent) ${row.cooldownFraction * 360}deg, transparent 0)`,
    pointerEvents: "none",
  };

  return (
    <button
      type="button"
      style={button}
      onClick={onTap}
      disabled={disabled}
      aria-disabled={disabled}
      aria-pressed={aim ? aiming : undefined}
      aria-label={ariaLabel}
    >
      <span aria-hidden="true" style={{ fontSize: "var(--fs-xl)", lineHeight: 1 }}>
        {icon}
      </span>
      {cooling && <span style={cooldownVeil} aria-hidden="true" />}
      {cooling && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            fontFamily: "var(--font-num)",
            fontSize: "var(--fs-base)",
            fontWeight: 800,
            color: "var(--text-bright)",
            fontVariantNumeric: "tabular-nums",
            textShadow: "0 1px 3px var(--bg-abyss)",
          }}
        >
          {Math.ceil(row.cooldownRemaining)}
        </span>
      )}
      {locked && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "calc(-1 * var(--s3))",
            fontFamily: "var(--font-num)",
            fontSize: "var(--fs-2xs)",
            fontWeight: 800,
            letterSpacing: ".06em",
            color: "var(--text-dim)",
            whiteSpace: "nowrap",
          }}
        >
          🔒 Wave {unlockWave}
        </span>
      )}
    </button>
  );
}
