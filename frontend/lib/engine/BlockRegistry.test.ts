import { describe, expect, it } from "vitest";

import {
  BLOCK_COMPONENT_IDS,
  getBlockComponent,
  getRegisteredBlockIds,
  hasBlockComponent,
} from "./BlockRegistry";

describe("BlockRegistry", () => {
  it("registers the known premium hero component", () => {
    expect(hasBlockComponent(BLOCK_COMPONENT_IDS.premiumHero)).toBe(true);
    expect(getBlockComponent(BLOCK_COMPONENT_IDS.premiumHero)).toBeTypeOf("function");
  });

  it("registers the known premium story component", () => {
    expect(hasBlockComponent(BLOCK_COMPONENT_IDS.premiumStory)).toBe(true);
    expect(getBlockComponent(BLOCK_COMPONENT_IDS.premiumStory)).toBeTypeOf("function");
  });

  it("returns undefined for an unknown component ID", () => {
    expect(getBlockComponent("unknown_component")).toBeUndefined();
  });

  it("includes expected component IDs in the registered ID list", () => {
    expect(getRegisteredBlockIds()).toEqual(expect.arrayContaining([
      BLOCK_COMPONENT_IDS.premiumHero,
      BLOCK_COMPONENT_IDS.premiumStory,
      BLOCK_COMPONENT_IDS.platformHeroCinematic,
      BLOCK_COMPONENT_IDS.platformStoryEditorial,
    ]));
  });

  it("does not throw for unknown component IDs", () => {
    expect(() => getBlockComponent("missing_component")).not.toThrow();
    expect(() => hasBlockComponent("missing_component")).not.toThrow();
  });
});
