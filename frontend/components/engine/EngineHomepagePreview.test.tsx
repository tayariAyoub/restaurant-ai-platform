import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BLOCK_COMPONENT_IDS } from "@/lib/engine/BlockRegistry";
import { resolveRestaurantTheme } from "@/lib/restaurantTheme";
import { mockRestaurantConfig } from "@/lib/schema/mockRestaurantConfig";
import { bellaNapoli } from "@/test/fixtures";
import EngineHomepagePreview, { buildEngineHomepageConfig } from "./EngineHomepagePreview";

describe("EngineHomepagePreview", () => {
  it("renders the mock config through ThemeProvider and PageRenderer", () => {
    const themeIdentity = resolveRestaurantTheme(bellaNapoli);
    const { container } = render(
      <EngineHomepagePreview
        restaurant={bellaNapoli}
        themeIdentity={themeIdentity}
        heroVisual={bellaNapoli.hero_image}
        gallery={bellaNapoli.images}
        reservationsEnabled
        mobileOpen={false}
        onToggleMobile={vi.fn()}
        onCloseMobile={vi.fn()}
      />,
    );

    expect(container.querySelector("[data-engine-homepage]")).not.toBeNull();
    expect(container.querySelector("style[data-restaurantai-theme]")).not.toBeNull();
    expect(container.querySelector("[data-page-block-id='home-hero']")).not.toBeNull();
    expect(container.querySelector("[data-page-block-id='home-story']")).not.toBeNull();
    expect(screen.getByRole("heading", { name: bellaNapoli.name })).toBeVisible();
    expect(screen.getAllByRole("link", { name: /view menu/i }).some((link) => link.getAttribute("href") === "/restaurants/bella-napoli/menu")).toBe(true);
  });

  it("builds a restaurant-specific config without mutating the mock defaults", () => {
    const themeIdentity = resolveRestaurantTheme(bellaNapoli);
    const config = buildEngineHomepageConfig({
      restaurant: bellaNapoli,
      themeIdentity,
      heroVisual: "/local-hero.jpg",
      gallery: bellaNapoli.images,
      basePath: "/restaurants/bella-napoli",
    });
    const [heroBlock, storyBlock] = config.pages.home.blocks;

    if (!heroBlock || !storyBlock || heroBlock.type !== "hero") {
      throw new Error("Expected engine homepage config to include hero and story blocks.");
    }

    expect(config.identity.restaurant_name).toBe(bellaNapoli.name);
    expect(config.identity.slug).toBe(bellaNapoli.slug);
    expect(config.navigation.primary_cta_href).toBe("/restaurants/bella-napoli/reservations");
    expect(heroBlock.component_id).toBe(BLOCK_COMPONENT_IDS.platformHeroCinematic);
    expect(storyBlock.component_id).toBe(BLOCK_COMPONENT_IDS.platformStoryEditorial);
    expect(heroBlock.type).toBe("hero");
    expect(heroBlock.props.image_url).toBe("http://localhost:3000/local-hero.jpg");
    expect(mockRestaurantConfig.identity.restaurant_name).toBe("Napoli Antica");
  });
});
