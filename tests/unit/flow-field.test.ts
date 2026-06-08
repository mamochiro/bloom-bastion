import { describe, expect, it } from "vitest";
import {
  COST_BLOCKED,
  COST_PATH,
  buildFlowField,
  cellSize,
  flowField,
  flowIndexAt,
  gridWidth,
} from "../../src/engine/pathfinding/flow-field";

// Helper: read a cell's flow vector by grid coords.
function flowAt(x: number, y: number): [number, number] {
  const i = y * gridWidth() + x;
  return [flowField[i * 2], flowField[i * 2 + 1]];
}

describe("flow field (SPEC §4.3, Dijkstra cost-spread)", () => {
  it("points every cell toward the goal on an open grid", () => {
    // 3×3 all-path grid, goal at right-middle (2,1), 10px cells.
    const cost = new Uint16Array(9).fill(COST_PATH);
    buildFlowField(cost, 3, 3, 10, 2, 1);

    expect(gridWidth()).toBe(3);
    expect(cellSize()).toBe(10);

    // Left-middle (0,1) → straight right (+x, 0).
    const [lx, ly] = flowAt(0, 1);
    expect(lx).toBeGreaterThan(0);
    expect(Math.abs(ly)).toBeLessThan(1e-6);

    // Top-left (0,0) → down-right toward goal (+x, +y).
    const [tx, ty] = flowAt(0, 0);
    expect(tx).toBeGreaterThan(0);
    expect(ty).toBeGreaterThan(0);

    // Bottom-left (0,2) → up-right toward goal (+x, -y).
    const [bx, by] = flowAt(0, 2);
    expect(bx).toBeGreaterThan(0);
    expect(by).toBeLessThan(0);

    // The goal cell itself is a sink → (0,0).
    expect(flowAt(2, 1)).toEqual([0, 0]);

    // Vectors are unit-normalised.
    const len = Math.hypot(tx, ty);
    expect(len).toBeCloseTo(1, 5);
  });

  it("blocked cells stay (0,0) and routes flow around them", () => {
    // Block the center; goal far-right-middle of a 3×3.
    const cost = new Uint16Array(9).fill(COST_PATH);
    cost[1 * 3 + 1] = COST_BLOCKED; // center (1,1)
    buildFlowField(cost, 3, 3, 10, 2, 1);

    expect(flowAt(1, 1)).toEqual([0, 0]); // blocked → no flow

    // Left-middle (0,1) can't go straight through the wall → must divert
    // vertically (non-zero y) while still heading right.
    const [lx, ly] = flowAt(0, 1);
    expect(lx).toBeGreaterThan(0);
    expect(Math.abs(ly)).toBeGreaterThan(0);
  });

  it("flowIndexAt is the row-major index, and -1 out of bounds", () => {
    const cost = new Uint16Array(9).fill(COST_PATH);
    buildFlowField(cost, 3, 3, 10, 2, 1);

    expect(flowIndexAt(5, 5)).toBe(0); // cell (0,0)
    expect(flowIndexAt(25, 15)).toBe(1 * 3 + 2); // cell (2,1)
    expect(flowIndexAt(-1, 5)).toBe(-1); // off-map left
    expect(flowIndexAt(5, 999)).toBe(-1); // off-map bottom
  });
});
