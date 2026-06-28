import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { HeroBlock as HeroBlockConfig } from "@/lib/schema/PlatformSchema";
import HeroBlock from "./HeroBlock";

const baseHeroBlock: HeroBlockConfig = {
  id: "hero",
  component_id: "platform.hero.cinematic",
  type: "hero",
  variant: "editorial",
  enabled: true,
  order: 0,
  settings: {
    spacing: "section-xl",
    visibility: "visible",
    background: "dark",
    animation: "fade-up",
  },
  ai: {
    editable: true,
    generated: false,
    prompt: "",
  },
  props: {
    headline: "Napoli Antica",
    subheadline: "Fire, craft, and a table prepared with care.",
    image_url: "https://images.example.com/hero.jpg",
    cta_text: "View Menu",
    cta_href: "/menu",
  },
};

describe("HeroBlock", () => {
  it("renders the editorial variant", () => {
    const { container } = render(<HeroBlock block={{ ...baseHeroBlock, variant: "editorial" }} />);

    expect(container.querySelector("[data-hero-variant='editorial']")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Napoli Antica" })).toBeVisible();
  });

  it("renders the minimal variant", () => {
    const { container } = render(<HeroBlock block={{ ...baseHeroBlock, variant: "minimal" }} />);

    expect(container.querySelector("[data-hero-variant='minimal']")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Napoli Antica" })).toBeVisible();
  });

  it("renders the split variant", () => {
    const { container } = render(<HeroBlock block={{ ...baseHeroBlock, variant: "split" }} />);

    expect(container.querySelector("[data-hero-variant='split']")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Napoli Antica" })).toBeVisible();
  });

  it("falls back to editorial for unknown variants", () => {
    const { container } = render(<HeroBlock block={{ ...baseHeroBlock, variant: "unknown" }} />);

    expect(container.querySelector("[data-hero-variant='editorial']")).not.toBeNull();
  });
});
