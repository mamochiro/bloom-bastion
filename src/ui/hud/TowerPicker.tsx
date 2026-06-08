import type { CSSProperties } from "react";
import { PLACEABLE_TOWERS, TOWER_BY_TYPE, type TowerTypeId } from "../../game/config/towers";
import { clearBuild, selectBuild, useSelectedBuild } from "../../store/build";
import { useGold } from "../../store/game-snapshot";

/**
 * UI-side family accent token per tower — the chip tint/border/glow (the sprite
 * itself renders its own native fills). Keyed by the config's string `id` so it
 * extends automatically as gameplay adds towers. Note the token family name
 * isn't always the id (id `stormcloud` → token `--storm-*`).
 */
const TOWER_ACCENT: Readonly<Record<string, string>> = {
  blossom: "var(--blossom-mid)",
  stormcloud: "var(--storm-mid)",
};
const DEFAULT_ACCENT = "var(--text-soft)";

/** View-model a single card needs — projected from gameplay's tower config. */
export interface TowerCardModel {
  type: TowerTypeId;
  name: string;
  cost: number;
  spriteId: string;
  accent: string;
}

/** Project a tower type's config into a card view-model. */
export function towerCardModel(type: TowerTypeId): TowerCardModel {
  const config = TOWER_BY_TYPE[type];
  return {
    type,
    name: config.name,
    cost: config.cost,
    spriteId: config.sprite,
    accent: TOWER_ACCENT[config.id] ?? DEFAULT_ACCENT,
  };
}

/**
 * Tower-pick bar (SPEC §8, mockup `design-assets/screenshots/fix_hud2.png` —
 * bottom dock "Tower picker"). Container: subscribes to gold + the build
 * selection, projects every placeable tower into a card, and toggles the build
 * intent on tap (`src/store/build.ts`); gameplay's InputSystem reads that intent
 * on a canvas tap to place the tower. The markup is the PURE `TowerDeck` below.
 */
export function TowerPicker() {
  const gold = useGold();
  const selected = useSelectedBuild();
  const towers = PLACEABLE_TOWERS.map(towerCardModel);

  const onToggle = (type: TowerTypeId) => {
    const affordable = gold >= TOWER_BY_TYPE[type].cost;
    switch (resolveTowerTap(selected === type, affordable)) {
      case "select":
        selectBuild(type);
        break;
      case "clear":
        clearBuild();
        break;
      // "noop" — unaffordable & unselected; the card is disabled so this is unreachable.
    }
  };

  return <TowerDeck towers={towers} gold={gold} selected={selected} onToggle={onToggle} />;
}

/**
 * Bottom dock of tower cards — PURE (props in → markup out, no store). One
 * `TowerCard` per placeable tower; each reads its own affordability (gold vs its
 * cost) and selected state.
 *
 * Pointer-events discipline (CRITICAL): the bar itself is `pointer-events:none`
 * so empty gaps let canvas taps through to the placement listener; only the card
 * buttons opt back in (`pointer-events:auto`, see `TowerCard`) so a tap on a card
 * does NOT fall through to the canvas.
 */
export function TowerDeck({
  towers,
  gold,
  selected,
  onToggle,
}: {
  towers: readonly TowerCardModel[];
  gold: number;
  selected: TowerTypeId | null;
  onToggle: (type: TowerTypeId) => void;
}) {
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
      {towers.map((tower) => (
        <TowerCard
          key={tower.type}
          name={tower.name}
          cost={tower.cost}
          spriteId={tower.spriteId}
          accent={tower.accent}
          affordable={gold >= tower.cost}
          selected={selected === tower.type}
          onToggle={() => onToggle(tower.type)}
        />
      ))}
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
