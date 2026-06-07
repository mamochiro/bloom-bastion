import { addComponent, addEntity, createWorld } from "bitecs";
import { describe, expect, it } from "vitest";
import { Enemy, Health, Position, enemyQuery, renderableQuery } from "../../src/engine/ecs/world";
import { SYSTEMS, SYSTEM_ORDER, runSystems } from "../../src/engine/loop";

// Engine foundation (M0→M1): ECS world/components/queries + fixed-order pipeline.
describe("ECS world", () => {
  it("stores component data in TypedArray slots (SoA)", () => {
    const w = createWorld();
    const eid = addEntity(w);
    addComponent(w, Position, eid);
    Position.x[eid] = 12.5;
    Position.y[eid] = -3.5;
    expect(Position.x[eid]).toBeCloseTo(12.5);
    expect(Position.y[eid]).toBeCloseTo(-3.5);
    expect(Position.x).toBeInstanceOf(Float32Array);
  });

  it("matches entities via cached queries", () => {
    const w = createWorld();
    const eid = addEntity(w);
    addComponent(w, Enemy, eid);
    addComponent(w, Position, eid);
    addComponent(w, Health, eid);
    expect(enemyQuery(w)).toContain(eid);
    // No Renderable → excluded from the render query.
    expect(renderableQuery(w)).not.toContain(eid);
  });
});

describe("system pipeline (SPEC §4.2 locked order)", () => {
  it("runs exactly 10 systems in the locked order", () => {
    expect(SYSTEMS).toHaveLength(10);
    expect(SYSTEM_ORDER).toEqual([
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
  });

  it("runs the full pipeline against dt without throwing, returning the world", () => {
    const w = createWorld();
    expect(runSystems(w, 0.016)).toBe(w);
  });
});
