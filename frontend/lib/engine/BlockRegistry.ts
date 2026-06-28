import { createElement, type ComponentType } from "react";

import EditorialStory, { type EditorialStoryProps } from "@/components/public/restaurant/EditorialStory";
import PremiumHero, { type PremiumHeroProps } from "@/components/public/restaurant/PremiumHero";
import type { Block, HeroBlock, StoryBlock } from "@/lib/schema/PlatformSchema";

export const BLOCK_COMPONENT_IDS = {
  premiumHero: "premium_hero",
  premiumStory: "premium_story",
  platformHeroCinematic: "platform.hero.cinematic",
  platformStoryEditorial: "platform.story.editorial",
} as const;

type HeroBlockProps = HeroBlock["props"];
type StoryBlockProps = StoryBlock["props"];
type HeroBlockComponent = ComponentType<HeroBlockProps>;
type StoryBlockComponent = ComponentType<StoryBlockProps>;

type HeroBlockRegistration = {
  blockType: HeroBlock["type"];
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

const PremiumHeroBlock: HeroBlockComponent = (props) => createElement(PremiumHero, {
  restaurantName: props.headline,
  eyebrow: "",
  headline: props.subheadline,
  image: props.image_url,
  imageAlt: props.headline,
  imageTreatment: "",
  primaryCta: {
    label: props.cta_text,
    href: props.cta_href,
  },
  secondaryCta: {
    label: props.cta_text,
    href: props.cta_href,
  },
  buttonClass: "rounded-full",
  accentColor: "#ffffff",
  trustTitle: "",
  metrics: [],
  trustLines: [],
} satisfies PremiumHeroProps);

const EditorialStoryBlock: StoryBlockComponent = (props) => createElement(EditorialStory, {
  kicker: "Story",
  title: props.title,
  body: props.body_text,
  image: props.image_url,
  imageAlt: props.title,
  imageTreatment: "",
  caption: props.body_text,
  cta: {
    label: "Continue",
    href: "#top",
  },
  accentColor: "#ffffff",
} satisfies EditorialStoryProps);

const blockRegistry: Record<string, BlockComponentRegistration> = {
  [BLOCK_COMPONENT_IDS.premiumHero]: {
    blockType: "hero",
    component: PremiumHeroBlock,
  },
  [BLOCK_COMPONENT_IDS.platformHeroCinematic]: {
    blockType: "hero",
    component: PremiumHeroBlock,
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
