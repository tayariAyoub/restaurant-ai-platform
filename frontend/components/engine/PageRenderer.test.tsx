import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BLOCK_COMPONENT_IDS } from "@/lib/engine/BlockRegistry";
import type { HeroBlock, Page, StoryBlock } from "@/lib/schema/PlatformSchema";
import PageRenderer from "./PageRenderer";

const baseSettings = {
  spacing: "section-xl",
  visibility: "visible",
  background: "dark-warm",
  animation: "fade-up",
};

const baseAi = {
  editable: true,
  generated: false,
  prompt: "",
};

const baseSeo = {
  title: "Renderer Test",
  description: "Renderer test page",
  canonical: "https://restaurant.example.com",
  og_image: "https://images.example.com/og.jpg",
  robots: "index,follow",
  locale: "en_US",
} as const;

function createHeroBlock(overrides: Partial<HeroBlock> = {}): HeroBlock {
  return {
    id: "hero-block",
    component_id: BLOCK_COMPONENT_IDS.premiumHero,
    type: "hero",
    variant: "cinematic",
    enabled: true,
    order: 0,
    settings: baseSettings,
    ai: baseAi,
    props: {
      headline: "Hero Headline",
      subheadline: "Hero Subheadline",
      image_url: "https://images.example.com/hero.jpg",
      cta_text: "Reserve",
      cta_href: "/reserve",
    },
    ...overrides,
  };
}

function createStoryBlock(overrides: Partial<StoryBlock> = {}): StoryBlock {
  return {
    id: "story-block",
    component_id: BLOCK_COMPONENT_IDS.premiumStory,
    type: "story",
    variant: "editorial",
    enabled: true,
    order: 1,
    settings: baseSettings,
    ai: baseAi,
    props: {
      title: "Story Title",
      body_text: "Story body text",
      image_url: "https://images.example.com/story.jpg",
      image_position: "right",
    },
    ...overrides,
  };
}

function createPage(blocks: Page["blocks"]): Page {
  return {
    layout: "test-layout",
    seo: baseSeo,
    blocks,
  };
}

describe("PageRenderer", () => {
  it("renders enabled blocks in order", () => {
    const heroBlock = createHeroBlock({ id: "second", order: 2 });
    const storyBlock = createStoryBlock({ id: "first", order: 1 });
    const { container } = render(<PageRenderer page={createPage([heroBlock, storyBlock])} />);

    const blockIds = Array.from(container.querySelectorAll("[data-page-block-id]"))
      .map((element) => element.getAttribute("data-page-block-id"));

    expect(blockIds).toEqual(["first", "second"]);
  });

  it("does not render disabled blocks", () => {
    render(<PageRenderer page={createPage([
      createHeroBlock(),
      createStoryBlock({
        id: "disabled-story",
        enabled: false,
        props: {
          title: "Hidden Story",
          body_text: "This should not render",
          image_url: "https://images.example.com/hidden.jpg",
          image_position: "left",
        },
      }),
    ])} />);

    expect(screen.getByRole("heading", { name: "Hero Headline" })).toBeInTheDocument();
    expect(screen.queryByText("Hidden Story")).not.toBeInTheDocument();
  });

  it("renders MissingBlock for an unknown component_id", () => {
    render(<PageRenderer page={createPage([
      createHeroBlock({ component_id: "missing.hero" }),
    ])} />);

    expect(screen.getByText("Missing block: missing.hero")).toBeInTheDocument();
  });

  it("keeps rendering valid blocks when one block is unknown", () => {
    render(<PageRenderer page={createPage([
      createHeroBlock({ id: "missing", component_id: "missing.hero", order: 0 }),
      createStoryBlock({ id: "valid-story", order: 1 }),
    ])} />);

    expect(screen.getByText("Missing block: missing.hero")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Story Title" })).toBeInTheDocument();
  });
});
