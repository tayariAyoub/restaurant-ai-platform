import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { resolveRestaurantTheme } from "@/lib/restaurantTheme";
import { bellaNapoli } from "@/test/fixtures";
import EngineHomepagePreview from "./EngineHomepagePreview";

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
});
