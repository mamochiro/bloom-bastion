import { beforeEach, describe, expect, it } from "vitest";
import { getSelectedDifficulty, setDifficulty } from "../../../src/store/difficulty";

// Reset selection to the default between tests for isolation.
beforeEach(() => setDifficulty("normal"));

describe("difficulty selection store", () => {
  it("defaults to 'normal'", () => {
    expect(getSelectedDifficulty()).toBe("normal");
  });

  it("setDifficulty updates the selection (non-reactive read matches)", () => {
    setDifficulty("casual");
    expect(getSelectedDifficulty()).toBe("casual");
    setDifficulty("hardcore");
    expect(getSelectedDifficulty()).toBe("hardcore");
  });
});
