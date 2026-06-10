import type { CSSProperties } from "react";
import { requestClearSelection, requestTowerSell, requestTowerUpgrade } from "../../store/commands";
import { type SelectedTowerSnapshot, useGold, useSelectedTower } from "../../store/game-snapshot";

/**
 * Upgrade / sell panel (SPEC §6 UI #6 — "modal/drawer on tower tap", §6.1
 * upgrades / §6.7 sell). A bottom (portrait) / side (landscape) drawer shown
 * while a tower is selected. Container: reads the selected-tower mirror + gold,
 * wires the buttons to the tower commands. Markup is the PURE
 * {@link UpgradePanelView}.
 *
 * Pure mirror — never holds game state, never initiates selection (canvas-tap
 * driven by gameplay). Renders nothing when no tower is selected.
 */
export function UpgradePanel() {
  const tower = useSelectedTower();
  const gold = useGold();
  if (!tower) return null;
  return (
    <UpgradePanelView
      tower={tower}
      gold={gold}
      onUpgrade={requestTowerUpgrade}
      onSell={requestTowerSell}
      onClose={requestClearSelection}
    />
  );
}

/**
 * PURE upgrade panel (props in → markup out, no store). A non-blocking drawer
 * (TowerPicker pattern): the wrapper is `pointer-events:none` so taps outside
 * the panel fall through to the canvas (selecting another tower / tapping empty
 * space to deselect still works); only the panel surface captures pointer
 * events. Explicit close = the X button (`onClose`). Tokens only (incl
 * `--fs-*`), ≥56px touch targets, safe-area insets.
 */
export function UpgradePanelView({
  tower,
  gold,
  onUpgrade,
  onSell,
  onClose,
}: {
  tower: SelectedTowerSnapshot;
  gold: number;
  onUpgrade: () => void;
  onSell: () => void;
  onClose: () => void;
}) {
  const upgrade = tower.upgrade; // local for TS null-narrowing in the JSX below
  const atMax = upgrade === null;
  const affordable = upgrade !== null && gold >= upgrade.cost;
  const dialogLabel = `${tower.name} tower, level ${tower.level}`;

  // Non-blocking wrapper (TowerPicker pattern): `pointer-events:none` so taps
  // outside the panel fall through to the canvas — selecting another tower /
  // tapping empty space (which gameplay treats as deselect) still works. Only
  // the panel surface re-enables pointer events. Explicit close = the X button.
  const wrap: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    pointerEvents: "none",
  };
  const panel: CSSProperties = {
    pointerEvents: "auto",
    alignSelf: "center",
    width: "100%",
    maxWidth: "440px",
    display: "flex",
    flexDirection: "column",
    gap: "var(--s3)",
    padding: "var(--s4)",
    paddingBottom: "max(env(safe-area-inset-bottom), var(--s4))",
    marginLeft: "max(env(safe-area-inset-left), 0px)",
    marginRight: "max(env(safe-area-inset-right), 0px)",
    background: "linear-gradient(180deg, var(--bg-panel), var(--bg-stage))",
    borderTopLeftRadius: "var(--r-xl)",
    borderTopRightRadius: "var(--r-xl)",
    border: "1px solid var(--bg-line)",
    boxShadow: "var(--shadow-panel)",
  };
  const header: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--s3)",
  };
  const title: CSSProperties = {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "var(--fs-lg)",
    color: "var(--text-bright)",
  };
  const level: CSSProperties = {
    fontFamily: "var(--font-num)",
    fontSize: "var(--fs-sm)",
    fontWeight: 700,
    color: "var(--text-dim)",
    letterSpacing: ".08em",
  };
  const closeBtn: CSSProperties = {
    pointerEvents: "auto",
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
  const actions: CSSProperties = { display: "flex", gap: "var(--s3)" };
  const upgradeBtn: CSSProperties = {
    pointerEvents: "auto",
    flex: "1 1 0",
    minHeight: "var(--touch)",
    padding: "0 var(--s4)",
    borderRadius: "var(--r-pill)",
    border: "none",
    cursor: affordable ? "pointer" : "default",
    opacity: atMax || affordable ? 1 : 0.5,
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "var(--fs-md)",
    color: "var(--bg-abyss)",
    background: atMax
      ? "var(--bg-elevated)"
      : "linear-gradient(180deg, var(--success), color-mix(in srgb, var(--success) 70%, var(--bg-abyss)))",
    boxShadow: atMax || !affordable ? "none" : "0 0 16px -5px var(--success)",
  };
  const sellBtn: CSSProperties = {
    pointerEvents: "auto",
    flex: "0 0 auto",
    minHeight: "var(--touch)",
    padding: "0 var(--s4)",
    borderRadius: "var(--r-pill)",
    cursor: "pointer",
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "var(--fs-md)",
    color: "var(--gold)",
    background: "var(--bg-abyss)",
    border: "1px solid color-mix(in srgb, var(--gold) 40%, var(--bg-line))",
  };

  const surface = (
    // biome-ignore lint/a11y/useSemanticElements: a styled non-blocking drawer, not a native <dialog> — keeps pointer-events/z-layering control over the Pixi canvas (taps outside fall through).
    <div style={panel} role="dialog" aria-modal="false" aria-label={dialogLabel}>
      <div style={header}>
        <div>
          <div style={title}>{tower.name}</div>
          <div style={level}>Lv {tower.level}</div>
        </div>
        <button type="button" style={closeBtn} onClick={onClose} aria-label="Close tower panel">
          ✕
        </button>
      </div>
      <div style={actions}>
        {upgrade === null ? (
          <button type="button" style={upgradeBtn} disabled aria-label="Tower at max level">
            MAX
          </button>
        ) : (
          <button
            type="button"
            style={upgradeBtn}
            onClick={onUpgrade}
            disabled={!affordable}
            aria-disabled={!affordable}
            aria-label={`Upgrade: ${upgrade.label}, ${upgrade.cost} gold${
              affordable ? "" : " (not enough gold)"
            }`}
          >
            {upgrade.label} · {upgrade.cost.toLocaleString()}g
          </button>
        )}
        <button
          type="button"
          style={sellBtn}
          onClick={onSell}
          aria-label={`Sell tower for ${tower.sellValue} gold`}
        >
          Sell · +{tower.sellValue.toLocaleString()}g
        </button>
      </div>
    </div>
  );

  return <div style={wrap}>{surface}</div>;
}
