import { describe, expect, it } from "vitest";

import HeroBlock from "@/components/blocks/hero/HeroBlock";
import {
  BLOCK_COMPONENT_IDS,
  getBlockComponent,
  getRegisteredBlockIds,
  hasBlockComponent,
} from "./BlockRegistry";

describe("BlockRegistry", () => {
  it("registers the known premium hero component", () => {
    expect(hasBlockComponent(BLOCK_COMPONENT_IDS.premiumHero)).toBe(true);
    expect(getBlockComponent(BLOCK_COMPONENT_IDS.premiumHero)).toBe(HeroBlock);
  });

  it("registers hero variant IDs through the hero router", () => {
    expect(getBlockComponent(BLOCK_COMPONENT_IDS.platformHeroCinematic)).toBe(HeroBlock);
    expect(getBlockComponent(BLOCK_COMPONENT_IDS.platformHeroEditorial)).toBe(HeroBlock);
    expect(getBlockComponent(BLOCK_COMPONENT_IDS.platformHeroMinimal)).toBe(HeroBlock);
    expect(getBlockComponent(BLOCK_COMPONENT_IDS.platformHeroSplit)).toBe(HeroBlock);
  });

  it("registers the known premium story component", () => {
    expect(hasBlockComponent(BLOCK_COMPONENT_IDS.premiumStory)).toBe(true);
    expect(getBlockComponent(BLOCK_COMPONENT_IDS.premiumStory)).toBeTypeOf("function");
  });

  it("returns undefined for an unknown component ID", () => {
    expect(getBlockComponent("unknown_component")).toBeUndefined();
  });

  it("returns undefined when a known component ID is requested for the wrong block type", () => {
    expect(getBlockComponent(BLOCK_COMPONENT_IDS.premiumHero, "story")).toBeUndefined();
    expect(getBlockComponent(BLOCK_COMPONENT_IDS.premiumStory, "hero")).toBeUndefined();
  });

  it("includes expected component IDs in the registered ID list", () => {
    expect(getRegisteredBlockIds()).toEqual(expect.arrayContaining([
      BLOCK_COMPONENT_IDS.premiumHero,
      BLOCK_COMPONENT_IDS.premiumStory,
      BLOCK_COMPONENT_IDS.platformHeroCinematic,
      BLOCK_COMPONENT_IDS.platformHeroEditorial,
      BLOCK_COMPONENT_IDS.platformHeroMinimal,
      BLOCK_COMPONENT_IDS.platformHeroSplit,
      BLOCK_COMPONENT_IDS.platformStoryEditorial,
    ]));
  });

  it("does not throw for unknown component IDs", () => {
    expect(() => getBlockComponent("missing_component")).not.toThrow();
    expect(() => hasBlockComponent("missing_component")).not.toThrow();
  });
});
