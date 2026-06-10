/**
 * Selected-tower state — which placed tower the player has tapped (the panel
 * target). GAME-side module state (NOT React): InputSystem sets/clears it on
 * canvas taps + panel commands; UISync mirrors it into the snapshot. World-free
 * + zero-alloc. Reset on start/restart (and in tests).
 */

/** Selected tower eid, or -1 when nothing is selected. */
let _selected = -1;

/** The currently selected tower eid (-1 if none). */
export function getSelectedTower(): number {
  return _selected;
}

/** Select `eid` (tap on a tower). */
export function setSelectedTower(eid: number): void {
  _selected = eid;
}

/** Clear the selection (tap empty / close panel / sell). */
export function clearSelectedTower(): void {
  _selected = -1;
}

/** Reset selection for a fresh run / test. */
export function resetSelection(): void {
  _selected = -1;
}
