import { createElement, type ComponentType } from "react";

import HeroBlock from "@/components/blocks/hero/HeroBlock";
import EditorialStory, { type EditorialStoryProps } from "@/components/public/restaurant/EditorialStory";
import type { Block, HeroBlock as HeroBlockConfig, StoryBlock } from "@/lib/schema/PlatformSchema";

export const BLOCK_COMPONENT_IDS = {
  premiumHero: "premium_hero",
  premiumStory: "premium_story",
  platformHeroCinematic: "platform.hero.cinematic",
  platformHeroEditorial: "platform.hero.editorial",
  platformHeroMinimal: "platform.hero.minimal",
  platformHeroSplit: "platform.hero.split",
  platformStoryEditorial: "platform.story.editorial",
} as const;

type StoryBlockProps = StoryBlock["props"];
type HeroBlockComponent = ComponentType<{ block: HeroBlockConfig }>;
type StoryBlockComponent = ComponentType<StoryBlockProps>;

type HeroBlockRegistration = {
  blockType: HeroBlockConfig["type"];
  component: HeroBlockComponent;
};

type StoryBlockRegistration = {
  blockType: StoryBlock["type"];
  component: StoryBlockComponent;
};

export type BlockComponentRegistration = HeroBlockRegistration | StoryBlockRegistration;
export type BlockComponent = BlockComponentRegistration["component"];
export type RegisteredBlockType = Block["type"];
export type BlockComponentByType = {
  hero: HeroBlockComponent;
  story: StoryBlockComponent;
};

const EditorialStoryBlock: StoryBlockComponent = (props) => createElement(EditorialStory, {
  kicker: "The experience",
  title: props.title,
  body: props.body_text,
  image: props.image_url,
  imageAlt: props.title,
  imageTreatment: "",
  caption: props.body_text,
  cta: {
    label: "Back to the beginning",
    href: "#top",
  },
  accentColor: "var(--color-brand-primary)",
} satisfies EditorialStoryProps);

const blockRegistry: Record<string, BlockComponentRegistration> = {
  [BLOCK_COMPONENT_IDS.premiumHero]: {
    blockType: "hero",
    component: HeroBlock,
  },
  [BLOCK_COMPONENT_IDS.platformHeroCinematic]: {
    blockType: "hero",
    component: HeroBlock,
  },
  [BLOCK_COMPONENT_IDS.platformHeroEditorial]: {
    blockType: "hero",
    component: HeroBlock,
  },
  [BLOCK_COMPONENT_IDS.platformHeroMinimal]: {
    blockType: "hero",
    component: HeroBlock,
  },
  [BLOCK_COMPONENT_IDS.platformHeroSplit]: {
    blockType: "hero",
    component: HeroBlock,
  },
  [BLOCK_COMPONENT_IDS.premiumStory]: {
    blockType: "story",
    component: EditorialStoryBlock,
  },
  [BLOCK_COMPONENT_IDS.platformStoryEditorial]: {
    blockType: "story",
    component: EditorialStoryBlock,
  },
};

export function getBlockComponent(componentId: string): BlockComponent | undefined;
export function getBlockComponent<TBlockType extends RegisteredBlockType>(
  componentId: string,
  blockType: TBlockType,
): BlockComponentByType[TBlockType] | undefined;
export function getBlockComponent(
  componentId: string,
  blockType?: RegisteredBlockType,
): BlockComponent | undefined {
  const registration = blockRegistry[componentId];

  if (!registration || (blockType && registration.blockType !== blockType)) {
    return undefined;
  }

  return registration.component;
}

export function hasBlockComponent(componentId: string): boolean {
  return componentId in blockRegistry;
}

export function getRegisteredBlockIds(): string[] {
  return Object.keys(blockRegistry);
}
