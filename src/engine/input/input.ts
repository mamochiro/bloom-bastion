import { getAppOrNull } from "../renderer/pixi-app";

/**
 * Unified pointer/touch input primitive. Maintains a module-owned, ZERO-ALLOC
 * snapshot of the pointer in WORLD pixels — the SAME space as ECS `Position`
 * (the field px the grid is drawn in) — plus a one-shot "tap" edge.
 *
 * The engine stays generic: it knows nothing about towers/placement/economy.
 * Gameplay's InputSystem (slot 1) reads {@link pointerWorldX}/{@link pointerWorldY}
 * and {@link consumeTap} and decides what a tap means (e.g. floor by CELL → cell).
 *
 * Coordinate mapping: the renderer uses `autoDensity` + `resolution = DPR`, so
 * stage/logical coordinates equal CSS pixels equal ECS `Position` px (no camera,
 * zoom, or pan). A screen point maps to world px via the canvas bounding rect,
 * scaled by the canvas' logical size (`canvas.width / DPR`) over its CSS rect
 * size — this stays correct under DPR and any CSS scaling of the canvas.
 *
 * Allocations: `getBoundingClientRect()` runs only inside pointer event handlers
 * (user-driven, NOT the per-frame loop). The per-frame getters return cached
 * numbers — zero allocation.
 */

/** Max pointer travel (world px) between press and release to still count as a tap. */
const TAP_SLOP = 10;

let canvasEl: HTMLCanvasElement | null = null;
let attached = false;

let worldX = 0;
let worldY = 0;
let downX = 0;
let downY = 0;
let isDown = false;
let tapPending = false;

function devicePixelRatio(): number {
  return (typeof window !== "undefined" && window.devicePixelRatio) || 1;
}

/** Map a pointer event's screen coords into world (ECS Position) px. */
function updatePointer(e: { clientX: number; clientY: number }): void {
  if (!canvasEl) return;
  const rect = canvasEl.getBoundingClientRect();
  const dpr = devicePixelRatio();
  // Logical (stage/Position) size = backing-store px / DPR; equals CSS px when
  // the canvas isn't CSS-scaled. Dividing by the rect size absorbs any scaling.
  const logicalW = canvasEl.width / dpr;
  const logicalH = canvasEl.height / dpr;
  const sx = rect.width > 0 ? logicalW / rect.width : 1;
  const sy = rect.height > 0 ? logicalH / rect.height : 1;
  worldX = (e.clientX - rect.left) * sx;
  worldY = (e.clientY - rect.top) * sy;
}

function onPointerDown(e: PointerEvent): void {
  updatePointer(e);
  isDown = true;
  downX = worldX;
  downY = worldY;
}

function onPointerMove(e: PointerEvent): void {
  updatePointer(e);
}

function onPointerUp(e: PointerEvent): void {
  updatePointer(e);
  if (isDown) {
    const dx = worldX - downX;
    const dy = worldY - downY;
    if (dx * dx + dy * dy <= TAP_SLOP * TAP_SLOP) tapPending = true;
    isDown = false;
  }
}

function onPointerCancel(): void {
  isDown = false;
}

/**
 * Attach pointer listeners. Idempotent. Defaults to the booted renderer's canvas
 * (`getAppOrNull()?.canvas`); pass an explicit `canvas` for tests. Returns `true`
 * if attached (or already attached), `false` if no canvas is available yet
 * (e.g. before boot / in jsdom) — a safe no-op in that case.
 */
export function initInput(canvas?: HTMLCanvasElement): boolean {
  if (attached) return true;
  const target = canvas ?? (getAppOrNull()?.canvas as HTMLCanvasElement | undefined) ?? null;
  if (!target || typeof target.addEventListener !== "function") return false;
  canvasEl = target;
  canvasEl.addEventListener("pointerdown", onPointerDown);
  canvasEl.addEventListener("pointermove", onPointerMove);
  canvasEl.addEventListener("pointerup", onPointerUp);
  canvasEl.addEventListener("pointercancel", onPointerCancel);
  attached = true;
  return true;
}

/** Detach listeners and reset all input state. Safe to call when not attached. */
export function teardownInput(): void {
  if (canvasEl) {
    canvasEl.removeEventListener("pointerdown", onPointerDown);
    canvasEl.removeEventListener("pointermove", onPointerMove);
    canvasEl.removeEventListener("pointerup", onPointerUp);
    canvasEl.removeEventListener("pointercancel", onPointerCancel);
  }
  canvasEl = null;
  attached = false;
  worldX = 0;
  worldY = 0;
  downX = 0;
  downY = 0;
  isDown = false;
  tapPending = false;
}

/** Lazily attach on first use; no-op once attached or when no canvas exists. */
function ensureAttached(): void {
  if (!attached) initInput();
}

/** Current pointer X in WORLD px (== ECS `Position` space). Zero-alloc. */
export function pointerWorldX(): number {
  ensureAttached();
  return worldX;
}

/** Current pointer Y in WORLD px (== ECS `Position` space). Zero-alloc. */
export function pointerWorldY(): number {
  ensureAttached();
  return worldY;
}

/**
 * Edge-consume the tap: returns `true` exactly ONCE per tap (press+release with
 * little drag), then clears it — so one tap drives one action. Zero-alloc.
 */
export function consumeTap(): boolean {
  ensureAttached();
  if (tapPending) {
    tapPending = false;
    return true;
  }
  return false;
}
