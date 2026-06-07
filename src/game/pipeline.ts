/**
 * The live system pipeline (SPEC §4.2 — LOCKED ORDER, DO NOT REORDER).
 *
 * Slots 1..10 in fixed order. Gameplay now owns the real Input (1), Spawn (2),
 * PathFollow (3), TowerAI (4), Projectile (5), Damage (6), Death (7) and UISync
 * (10); the engine owns the real Render (9). Only Animation (8) is still an
 * engine stub pulled from `loop.ts`'s `SYSTEMS` by index.
 * `startLoop(GAME_SYSTEMS)` ticks this array.
 */
import { SYSTEMS, type System } from "../engine/loop";
import { RenderSystem } from "../engine/renderer/render-system";
import { DamageSystem } from "./systems/damage";
import { DeathSystem } from "./systems/death";
import { InputSystem } from "./systems/input";
import { PathFollowSystem } from "./systems/path-follow";
import { ProjectileSystem } from "./systems/projectile";
import { SpawnSystem } from "./systems/spawn";
import { TowerAISystem } from "./systems/tower-ai";
import { UISyncSystem } from "./systems/ui-sync";

// Remaining engine stubs by slot index (SYSTEMS is the §4.2-ordered stub array).
const AnimationSystem = SYSTEMS[7]; // 8

// SpawnSystem is the shared live wave instance (spawn.ts) — also read by
// DeathSystem (isComplete → 'won') and restartGame (reset). Starts at t=0 so the
// wave seeds itself on boot.

/** The locked SPEC §4.2 pipeline the running loop ticks. */
export const GAME_SYSTEMS: readonly System[] = Object.freeze([
  InputSystem, // 1 Input        (gameplay)
  SpawnSystem, // 2 Spawn        (gameplay)
  PathFollowSystem, // 3 PathFollow   (gameplay)
  TowerAISystem, // 4 TowerAI      (gameplay)
  ProjectileSystem, // 5 Projectile   (gameplay)
  DamageSystem, // 6 Damage       (gameplay)
  DeathSystem, // 7 Death        (gameplay)
  AnimationSystem, // 8 Animation    (engine stub)
  RenderSystem, // 9 Render        (engine REAL)
  UISyncSystem, // 10 UISync      (gameplay)
]);
