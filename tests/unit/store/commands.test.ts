import { beforeEach, describe, expect, it } from "vitest";
import {
  consumeRestart,
  consumeStart,
  requestRestart,
  requestStart,
} from "../../../src/store/commands";

// Drain any pending flags between tests for isolation.
beforeEach(() => {
  consumeRestart();
  consumeStart();
});

describe("start command", () => {
  it("defaults to no pending start", () => {
    expect(consumeStart()).toBe(false);
  });

  it("requestStart -> consumeStart returns true exactly ONCE, then clears", () => {
    requestStart();
    expect(consumeStart()).toBe(true);
    expect(consumeStart()).toBe(false);
  });

  it("is independent of the restart flag", () => {
    requestStart();
    expect(consumeRestart()).toBe(false); // start does not satisfy restart
    expect(consumeStart()).toBe(true);
  });
});

describe("restart command", () => {
  it("defaults to no pending restart", () => {
    expect(consumeRestart()).toBe(false);
  });

  it("requestRestart -> consumeRestart returns true exactly ONCE, then clears", () => {
    requestRestart();
    expect(consumeRestart()).toBe(true);
    expect(consumeRestart()).toBe(false);
  });

  it("coalesces repeated requests into a single consumable flag", () => {
    requestRestart();
    requestRestart();
    expect(consumeRestart()).toBe(true);
    expect(consumeRestart()).toBe(false);
  });
});
