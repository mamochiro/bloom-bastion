/**
 * Endless-mode runtime state — the CURRENT wave's enemy-HP multiplier (SPEC §6.3
 * "HP ×1.15ⁿ"). Set by SpawnSystem when an endless wave starts; read by
 * `spawnEnemy` so every enemy that wave scales. Module value (NOT React),
 * zero-alloc read. 1.0 in campaign + the authored endless waves.
 */
let _hpMult = 1;

/** Active endless HP multiplier (1.0 outside scaled waves). */
export function getEndlessHpMult(): number {
  return _hpMult;
}

/** Set by SpawnSystem on each wave start. */
export function setEndlessHpMult(mult: number): void {
  _hpMult = mult;
}

/** Reset to 1.0 (start / restart / tests). */
export function resetEndlessHpMult(): void {
  _hpMult = 1;
}
