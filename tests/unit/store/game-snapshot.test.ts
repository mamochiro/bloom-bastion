import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SNAPSHOT,
  type GameSnapshot,
  getSnapshot,
  setSnapshot,
} from "../../../src/store/game-snapshot";

// Module-level singleton store — reset to defaults between tests for isolation.
beforeEach(() => setSnapshot({ ...DEFAULT_SNAPSHOT }));

describe("game-snapshot store", () => {
  it("boots to the menu with a Normal economy preview (150 gold / 20 lives / wave 1)", () => {
    expect(getSnapshot()).toEqual({
      gold: 150,
      lives: 20,
      wave: 1,
      enemiesAlive: 0,
      gameStatus: "menu",
    });
  });

  it("setSnapshot replaces the whole snapshot (imperative writer)", () => {
    const next: GameSnapshot = {
      gold: 275,
      lives: 17,
      wave: 4,
      enemiesAlive: 9,
      gameStatus: "playing",
    };
    setSnapshot(next);
    expect(getSnapshot()).toEqual(next);
  });

  it("reflects a lost game state", () => {
    setSnapshot({ ...DEFAULT_SNAPSHOT, lives: 0, wave: 7, gameStatus: "lost" });
    const snap = getSnapshot();
    expect(snap.gameStatus).toBe("lost");
    expect(snap.lives).toBe(0);
    expect(snap.wave).toBe(7);
  });

  it("does not leak previous state across writes (full replace, not merge)", () => {
    setSnapshot({ ...DEFAULT_SNAPSHOT, gold: 999 });
    setSnapshot({ ...DEFAULT_SNAPSHOT, wave: 3 });
    // gold must be back to the default from the second full write, not 999.
    expect(getSnapshot().gold).toBe(150);
    expect(getSnapshot().wave).toBe(3);
  });
});
