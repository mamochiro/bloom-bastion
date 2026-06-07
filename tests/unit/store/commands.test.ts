import { beforeEach, describe, expect, it } from "vitest";
import { consumeRestart, requestRestart } from "../../../src/store/commands";

// Drain any pending flag between tests for isolation.
beforeEach(() => {
  consumeRestart();
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
