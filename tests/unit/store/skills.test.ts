import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSkillAim,
  consumeSkillActivation,
  getSkillAim,
  requestSkillActivation,
  selectSkillAim,
} from "../../../src/store/skills";

// Reset both channels between tests for isolation.
beforeEach(() => {
  clearSkillAim();
  consumeSkillActivation();
});

describe("skill aim (targeted)", () => {
  it("defaults to no aim", () => {
    expect(getSkillAim()).toBeNull();
  });

  it("selectSkillAim sets the aimed skill; clearSkillAim resets it", () => {
    selectSkillAim("meteor");
    expect(getSkillAim()).toBe("meteor");
    clearSkillAim();
    expect(getSkillAim()).toBeNull();
  });
});

describe("skill activation (instant)", () => {
  it("defaults to nothing queued", () => {
    expect(consumeSkillActivation()).toBeNull();
  });

  it("requestSkillActivation -> consumeSkillActivation returns the type ONCE, then clears", () => {
    requestSkillActivation("freeze");
    expect(consumeSkillActivation()).toBe("freeze");
    expect(consumeSkillActivation()).toBeNull();
  });

  it("a later request overwrites the queued skill", () => {
    requestSkillActivation("freeze");
    requestSkillActivation("goldRush");
    expect(consumeSkillActivation()).toBe("goldRush");
    expect(consumeSkillActivation()).toBeNull();
  });

  it("aim and activation are independent channels", () => {
    selectSkillAim("meteor");
    requestSkillActivation("freeze");
    expect(getSkillAim()).toBe("meteor");
    expect(consumeSkillActivation()).toBe("freeze");
    expect(getSkillAim()).toBe("meteor"); // consuming activation didn't touch aim
  });
});
