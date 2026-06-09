/**
 * VFX hooks — gameplay's indirection to the engine's pooled VFX helpers
 * (bursts / floating text / hit-flash). Systems call these forwarders on COLD
 * combat events (death / damaging-hit / Meteor / boss-enrage) — never the
 * per-frame hot path, so even the floating-text string concat is fine.
 *
 * The actual implementation is an injectable SINK: the engine wires its real
 * pooled VFX via {@link setVfx} at boot (the engine module lands in parallel —
 * wired LAST in main.tsx); the default is a no-op so gameplay + tests run
 * decoupled from it. Tests inject a spy and `_reset.ts` calls {@link resetVfx}.
 */

/** The engine VFX surface gameplay depends on (pooled, no-alloc on the engine side). */
export interface VfxSink {
  /** Pooled particle burst at a world point. */
  spawnBurst(worldX: number, worldY: number, tint: number, count?: number): void;
  /** Pooled floating text (damage / reward numbers) rising from a world point. */
  spawnFloatingText(text: string, worldX: number, worldY: number, tint?: number): void;
  /** Brief white hit-flash on an entity. */
  flashEntity(eid: number): void;
}

const NOOP: VfxSink = {
  spawnBurst() {},
  spawnFloatingText() {},
  flashEntity() {},
};

let _sink: VfxSink = NOOP;

/** Wire the live engine VFX (main.tsx at boot) or a test spy. */
export function setVfx(sink: VfxSink): void {
  _sink = sink;
}

/** Restore the no-op sink (tests). */
export function resetVfx(): void {
  _sink = NOOP;
}

// --- Forwarders (zero-alloc: direct calls, no rest/spread) ------------------

export function spawnBurst(worldX: number, worldY: number, tint: number, count?: number): void {
  _sink.spawnBurst(worldX, worldY, tint, count);
}

export function spawnFloatingText(
  text: string,
  worldX: number,
  worldY: number,
  tint?: number,
): void {
  _sink.spawnFloatingText(text, worldX, worldY, tint);
}

export function flashEntity(eid: number): void {
  _sink.flashEntity(eid);
}
