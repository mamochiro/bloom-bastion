import { beforeEach, describe, expect, it } from "vitest";
import { TowerType } from "../../../src/game/config/towers";
import { clearBuild, getSelectedBuild, selectBuild } from "../../../src/store/build";

// Module-level singleton — reset to "no selection" between tests for isolation.
beforeEach(() => clearBuild());

describe("build store", () => {
  it("defaults to no selection", () => {
    expect(getSelectedBuild()).toBeNull();
  });

  it("selectBuild sets the chosen tower (non-reactive read matches)", () => {
    selectBuild(TowerType.Blossom);
    expect(getSelectedBuild()).toBe(TowerType.Blossom);
    expect(getSelectedBuild()).toBe(0); // TowerType.Blossom === 0, the ECS typeId
  });

  it("clearBuild resets to null", () => {
    selectBuild(TowerType.Blossom);
    clearBuild();
    expect(getSelectedBuild()).toBeNull();
  });
});
