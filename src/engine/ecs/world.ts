import {
  type Component,
  type IWorld,
  Types,
  createWorld,
  defineComponent,
  defineQuery,
} from "bitecs";

/**
 * The single ECS world. ALL game state lives in these components (SPEC §4.4) —
 * never in React/Zustand. Components are data-only, TypedArray-backed stores
 * (SoA): `Position.x[eid]` is a `Float32Array` slot, not an object. This keeps
 * the hot path allocation-free (SPEC §5) and cache-friendly.
 *
 * bitECS 0.3.x API: components are defined via `defineComponent(schema)` and
 * accessed as `Component.field[eid]`. Entity references (e.g. a tower's target)
 * use `Types.eid` so bitECS can keep them valid across entity recycling.
 */

// --- Components (SPEC §4.2, data only) -------------------------------------

/** World-space pixel position. */
export const Position = defineComponent({ x: Types.f32, y: Types.f32 });

/** Linear velocity in px/s; integrated by movement systems against `dt`. */
export const Velocity = defineComponent({ vx: Types.f32, vy: Types.f32 });

/** Current / max hit points. */
export const Health = defineComponent({ current: Types.f32, max: Types.f32 });

/**
 * Visual binding: atlas sprite id + tint.
 * - `tint` (0xRRGGBB) is the TRANSIENT FX overlay: a hit-flash sets it bright
 *   until `flashUntil` (game seconds); AnimationSystem then restores it to
 *   `baseTint`.
 * - `baseTint` is the PERSISTENT tint (0 = native sprite colours) — e.g. a
 *   boss enrage colour — so it survives a hit-flash. RenderSystem shows the
 *   flash tint while flashing, else `baseTint`.
 */
export const Renderable = defineComponent({
  spriteId: Types.ui16,
  tint: Types.ui32,
  flashUntil: Types.f32,
  baseTint: Types.f32,
});

/** Tower instance: type, upgrade level, fire cooldown (s), current target eid. */
export const Tower = defineComponent({
  typeId: Types.ui8,
  level: Types.ui8,
  cooldown: Types.f32,
  lastTarget: Types.eid,
});

/** Enemy instance: type, 0..1 progress along its path, bitflag state. */
export const Enemy = defineComponent({
  typeId: Types.ui8,
  pathProgress: Types.f32,
  flags: Types.ui16,
});

/** Projectile: damage on hit, homing target eid, special-effect bitmask. */
export const Projectile = defineComponent({
  damage: Types.f32,
  targetId: Types.eid,
  // 16-bit special-effect bitfield (gameplay `SPECIAL`): the 8-bit field filled
  // up at 8 towers' specials; widened to ui16 for Luna Crystal's bits (slice
  // task STEP 1). Values only — no behaviour change for the existing bits.
  special: Types.ui16,
});

/** Marks an entity that should read the shared flow field (SPEC §4.3). */
export const Pathfinder = defineComponent({ followFlowField: Types.ui8 });

/** Rive animation binding: animation id + current state enum. */
export const Animation = defineComponent({ riveId: Types.ui16, state: Types.ui8 });

/** Status timers (game-time seconds) for slow / stun / damage-over-time. */
export const Status = defineComponent({
  slowedUntil: Types.f32,
  stunnedUntil: Types.f32,
  dotUntil: Types.f32,
});

/** All components, in declaration order — handy for registration/serialization. */
export const components: readonly Component[] = [
  Position,
  Velocity,
  Health,
  Renderable,
  Tower,
  Enemy,
  Projectile,
  Pathfinder,
  Animation,
  Status,
];

// --- World -----------------------------------------------------------------

export type World = IWorld;

/** The single shared ECS world instance. */
export const world: World = createWorld();

// --- Foundational queries --------------------------------------------------
// Queries are cached by bitECS; define them once at module scope (never inside
// a system/frame) so iteration stays allocation-free.

/** Everything drawable (RenderSystem). */
export const renderableQuery = defineQuery([Position, Renderable]);

/** Everything that integrates velocity (Projectile/PathFollow movement). */
export const movementQuery = defineQuery([Position, Velocity]);

/** Live enemies (PathFollow, TowerAI targeting, Death). */
export const enemyQuery = defineQuery([Enemy, Position, Health]);

/** Towers (TowerAI). */
export const towerQuery = defineQuery([Tower, Position]);

/** In-flight projectiles (ProjectileSystem). */
export const projectileQuery = defineQuery([Projectile, Position]);

/** Entities following the flow field (PathFollowSystem). */
export const pathfinderQuery = defineQuery([Pathfinder, Position, Velocity]);
