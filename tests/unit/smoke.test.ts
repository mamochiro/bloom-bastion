import { describe, expect, it } from "vitest";

// M0 toolchain smoke test — proves Vitest runs under `bun run test`.
// Real coverage (flow-field, damage, economy, pools) lands in M1+ (SPEC §12).
describe("toolchain smoke test", () => {
  it("runs unit tests", () => {
    expect(1 + 1).toBe(2);
  });
});
