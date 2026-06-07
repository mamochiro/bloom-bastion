import type { CSSProperties } from "react";
import { TOWER_BY_TYPE, TowerType } from "../../game/config/towers";
import { clearBuild, selectBuild, useSelectedBuild } from "../../store/build";
import { useGold } from "../../store/game-snapshot";

/**
 * Tower-pick bar (SPEC §8, mockup `design-assets/screenshots/fix_hud2.png` —
 * bottom dock "Tower picker"). A thumb-reachable bottom bar of tower cards; each
 * card reads its state at a glance — selected (lifted + glowing ring), can't
 * afford (dimmed + red cost). Tapping toggles the build selection
 * (`src/store/build.ts`); gameplay's InputSystem reads that intent on a canvas
 * tap to place the tower.
 *
 * This slice ships the single Blossom card (sprite `tower-blossom-l1`, 50g).
 * The other five families + skill buttons + NEXT-wave dock land in later slices.
 *
 * Pointer-events discipline (CRITICAL): the bar itself is `pointer-events:none`
 * so empty gaps let canvas taps through to the placement listener; only the
 * card buttons opt back in (`pointer-events:auto`) so a tap on a card does NOT
 * fall through to the canvas.
 */
export function TowerPicker() {
  const gold = useGold();
  const selected = useSelectedBuild();

  const blossom = TOWER_BY_TYPE[TowerType.Blossom];
  const affordable = gold >= blossom.cost;
  const isSelected = selected === TowerType.Blossom;

  const onToggle = () => {
    switch (resolveTowerTap(isSelected, affordable)) {
      case "select":
        selectBuild(TowerType.Blossom);
        break;
      case "clear":
        clearBuild();
        break;
      // "noop" — unaffordable & unselected; button is disabled so this is unreachable.
    }
  };

  const bar: CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    gap: "var(--s2)",
    paddingLeft: "max(env(safe-area-inset-left), var(--s3))",
    paddingRight: "max(env(safe-area-inset-right), var(--s3))",
    paddingBottom: "max(env(safe-area-inset-bottom), var(--s3))",
    paddingTop: "var(--s2)",
    // Transparent gaps let canvas taps through; only the cards capture (below).
    pointerEvents: "none",
  };

  return (
    <nav style={bar} aria-label="Tower picker">
      <TowerCard
        name={blossom.name}
        cost={blossom.cost}
        spriteId={blossom.sprite}
        accent="var(--blossom-mid)"
        affordable={affordable}
        selected={isSelected}
        onToggle={onToggle}
      />
    </nav>
  );
}

export type TapAction = "select" | "clear" | "noop";

/**
 * Pure tap-resolution: a selected card toggles OFF (allowed even if the player
 * can no longer afford it); an unselected card selects only when affordable.
 */
export function resolveTowerTap(isSelected: boolean, affordable: boolean): TapAction {
  if (isSelected) return "clear";
  return affordable ? "select" : "noop";
}

/**
 * A single tower card — PURE (props in → markup out, no store). A ≥64px touch
 * target carrying the tower sprite, name, and gold cost; disabled when the
 * player can't afford it (and it isn't already selected, so it can be toggled
 * off). Tokens only.
 */
export function TowerCard({
  name,
  cost,
  spriteId,
  accent,
  affordable,
  selected,
  onToggle,
}: {
  name: string;
  cost: number;
  spriteId: string;
  accent: string;
  affordable: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  // Disabled only when it can't be acted on: unaffordable AND not already picked.
  const disabled = !affordable && !selected;

  const card: CSSProperties = {
    pointerEvents: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--s1)",
    width: "64px",
    minHeight: "var(--touch)",
    padding: "var(--s2) var(--s1) var(--s1)",
    borderRadius: "var(--r-md)",
    cursor: disabled ? "default" : "pointer",
    // Family-tinted chip derived from the tower token (no hardcoded colour).
    background: `color-mix(in srgb, ${accent} 18%, var(--bg-panel))`,
    border: `1.5px solid ${selected ? accent : "var(--bg-line)"}`,
    boxShadow: selected ? `0 0 14px -3px ${accent}` : "var(--shadow-card)",
    transform: selected ? "translateY(-2px)" : "none",
    opacity: disabled ? 0.5 : 1,
    transition: "transform .12s, box-shadow .15s, opacity .15s",
  };
  const costRow: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--s1)",
    fontFamily: "var(--font-num)",
    fontSize: "var(--fs-sm)",
    fontWeight: 800,
    fontVariantNumeric: "tabular-nums",
    color: affordable ? "var(--gold)" : "var(--danger)",
  };

  return (
    <button
      type="button"
      style={card}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${name} tower — ${cost} gold${affordable ? "" : " (not enough gold)"}`}
    >
      <svg
        viewBox="0 0 120 150"
        width="40"
        height="50"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        style={{ color: accent }}
      >
        <use href={`/sprites.svg#${spriteId}`} />
      </svg>
      <span style={costRow}>
        <span aria-hidden="true">💰</span>
        {cost.toLocaleString()}
      </span>
    </button>
  );
}
