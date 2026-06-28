import type { ComponentType } from "react";

import EditorialStory, { type EditorialStoryProps } from "@/components/public/restaurant/EditorialStory";
import PremiumHero, { type PremiumHeroProps } from "@/components/public/restaurant/PremiumHero";
import type { Block, HeroBlock, StoryBlock } from "@/lib/schema/PlatformSchema";

export const BLOCK_COMPONENT_IDS = {
  premiumHero: "premium_hero",
  premiumStory: "premium_story",
  platformHeroCinematic: "platform.hero.cinematic",
  platformStoryEditorial: "platform.story.editorial",
} as const;

type HeroBlockRegistration = {
  blockType: HeroBlock["type"];
  component: ComponentType<PremiumHeroProps>;
};

type StoryBlockRegistration = {
  blockType: StoryBlock["type"];
  component: ComponentType<EditorialStoryProps>;
};

export type BlockComponentRegistration = HeroBlockRegistration | StoryBlockRegistration;
export type BlockComponent = BlockComponentRegistration["component"];
export type RegisteredBlockType = Block["type"];

const blockRegistry: Record<string, BlockComponentRegistration> = {
  [BLOCK_COMPONENT_IDS.premiumHero]: {
    blockType: "hero",
    component: PremiumHero,
  },
  [BLOCK_COMPONENT_IDS.platformHeroCinematic]: {
    blockType: "hero",
    component: PremiumHero,
  },
  [BLOCK_COMPONENT_IDS.premiumStory]: {
    blockType: "story",
    component: EditorialStory,
  },
  [BLOCK_COMPONENT_IDS.platformStoryEditorial]: {
    blockType: "story",
    component: EditorialStory,
  },
};

export function getBlockComponent(componentId: string): BlockComponent | undefined {
  return blockRegistry[componentId]?.component;
}

export function hasBlockComponent(componentId: string): boolean {
  return componentId in blockRegistry;
}

export function getRegisteredBlockIds(): string[] {
  return Object.keys(blockRegistry);
}
