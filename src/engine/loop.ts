import { advanceGameClock, resetGameClock } from "./clock";
import type { World } from "./ecs/world";
import { world } from "./ecs/world";
import { RenderSystem } from "./renderer/render-system";
import { AnimationSystem } from "./renderer/vfx";

// gameTime lives in clock.ts (dependency-free, breaks the loop↔vfx cycle); we
// re-export it here so existing `import { gameTime } from ".../loop"` keeps working.
export { gameTime } from "./clock";

/**
 * The fixed-timestep-ish RAF game loop (SPEC §4.6) and the LOCKED system
 * pipeline (SPEC §4.2). Systems run in slots 1..10 every frame, in order — this
 * ordering is a locked decision; DO NOT REORDER.
 *
 * Each system has the signature `(world, dt) => world`: it mutates ECS
 * component stores in place and returns the same world (bitECS convention). For
 * now every system is a typed no-op stub; gameplay-agent fills in `src/game/`.
 *
 * `dt` is elapsed time in SECONDS, clamped to a max of 0.05s (50ms) so a long
 * stall or a tab-unhide can't teleport entities across the map (SPEC §4.6).
 */

/** A single ECS system: mutate the world for this frame, return it. */
export type System = (world: World, dt: number) => World;

// --- Systems (slots 1..10, SPEC §4.2 — LOCKED ORDER) -----------------------
// Stubs for M0: they establish the pipeline + signature. Real logic lands in
// src/game/ (gameplay-agent). Keep these allocation-free.

/** 1 — pointer/touch events → entity changes. */
const InputSystem: System = (w, _dt) => w;
/** 2 — wave timing, enemy creation (from pools). */
const SpawnSystem: System = (w, _dt) => w;
/** 3 — entities follow the shared flow field (SPEC §4.3). */
const PathFollowSystem: System = (w, _dt) => w;
/** 4 — tower target selection + cooldown. */
const TowerAISystem: System = (w, _dt) => w;
/** 5 — projectile movement + collision. */
const ProjectileSystem: System = (w, _dt) => w;
/** 6 — apply damage + status effects. */
const DamageSystem: System = (w, _dt) => w;
/** 7 — rewards, death particles, entity cleanup. */
const DeathSystem: System = (w, _dt) => w;
// 8 — AnimationSystem: REAL VFX tick (pooled particles + floating text +
//     hit-flash decay), imported from ./renderer/vfx.
// 9 — RenderSystem: real Pixi draw, imported from ./renderer/render-system.
/** 10 — push a throttled (≤10Hz, added later) snapshot to Zustand. */
const UISyncSystem: System = (w, _dt) => w;

/**
 * The pipeline, in SPEC §4.2 order. Frozen + module-scoped so the per-frame
 * loop iterates a stable array with zero allocation.
 */
export const SYSTEMS: readonly System[] = Object.freeze([
  InputSystem,
  SpawnSystem,
  PathFollowSystem,
  TowerAISystem,
  ProjectileSystem,
  DamageSystem,
  DeathSystem,
  AnimationSystem,
  RenderSystem,
  UISyncSystem,
]);

/** System names in run order (slots 1..10) — for tests/debugging only. */
export const SYSTEM_ORDER: readonly string[] = Object.freeze([
  "InputSystem",
  "SpawnSystem",
  "PathFollowSystem",
  "TowerAISystem",
  "ProjectileSystem",
  "DamageSystem",
  "DeathSystem",
  "AnimationSystem",
  "RenderSystem",
  "UISyncSystem",
]);

/**
 * Run a system pipeline once against `dt` (seconds). Pure of any rAF/DOM.
 * Defaults to the stub {@link SYSTEMS}; gameplay passes its real §4.2-ordered
 * array. The caller owns ordering — keep it the locked SPEC §4.2 order.
 */
export function runSystems(w: World, dt: number, systems: readonly System[] = SYSTEMS): World {
  for (let i = 0; i < systems.length; i++) {
    systems[i](w, dt);
  }
  return w;
}

// --- RAF loop --------------------------------------------------------------

/** Max integrated step (SPEC §4.6): 50ms in seconds. */
const MAX_DT = 0.05;

let rafId = 0;
let lastTime = 0;
let running = false;
let paused = false;
let frame = 0;

/** The pipeline the running loop ticks. Swapped in by {@link startLoop}. */
let activeSystems: readonly System[] = SYSTEMS;

/** Monotonic frame counter (incremented per ticked frame). For tests/e2e. */
export function getFrameCount(): number {
  return frame;
}

/**
 * Apply one frame: when not paused, clamp `rawDt` (seconds) to {@link MAX_DT},
 * add it to the game clock, run the pipeline with it, and advance the frame
 * counter; when paused, do nothing. Returns the game dt actually applied (0
 * while paused). Drives the rAF {@link tick} and is the deterministic unit the
 * tests step through.
 */
export function frameStep(rawDt: number, isPaused: boolean): number {
  if (isPaused) return 0;
  let dt = rawDt;
  // Guard against negative/NaN and clamp long stalls (SPEC §4.6).
  if (!(dt > 0)) dt = 0;
  else if (dt > MAX_DT) dt = MAX_DT;
  advanceGameClock(dt);
  runSystems(world, dt, activeSystems);
  frame++;
  return dt;
}

function tick(now: number): void {
  if (!running) return; // stray callback after stopLoop() → no-op, no reschedule
  rafId = requestAnimationFrame(tick);
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  frameStep(dt, paused);
}

function onVisibilityChange(): void {
  paused = document.hidden;
  if (!paused) lastTime = performance.now();
}

/**
 * Start the RAF loop. Idempotent. Call after the renderer has booted.
 *
 * @param systems Pipeline to tick each frame, in SPEC §4.2 order. Defaults to
 *   the engine stub {@link SYSTEMS}; gameplay composes the real array (its own
 *   §4.2-ordered systems wrapping the engine's Render/UISync) and passes it here.
 */
export function startLoop(systems: readonly System[] = SYSTEMS): void {
  if (running) return;
  running = true;
  activeSystems = systems;
  resetGameClock(); // fresh game clock per run (SPEC §4.6 game time)
  paused = typeof document !== "undefined" && document.hidden;
  lastTime = performance.now();
  document.addEventListener("visibilitychange", onVisibilityChange);
  rafId = requestAnimationFrame(tick);
}

/** Stop the loop and detach listeners. Idempotent. */
export function stopLoop(): void {
  if (!running) return;
  running = false;
  cancelAnimationFrame(rafId);
  document.removeEventListener("visibilitychange", onVisibilityChange);
}

/** Whether the loop is currently running. */
export function isLoopRunning(): boolean {
  return running;
}
