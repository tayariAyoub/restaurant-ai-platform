import { describe, expect, it } from "vitest";

import { resolveRestaurantTheme } from "./restaurantTheme";
import { bellaNapoli } from "@/test/fixtures";
import type { Restaurant } from "./types";

function themedRestaurant(themeKey: string, overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    ...bellaNapoli,
    ...overrides,
    theme: bellaNapoli.theme
      ? {
          ...bellaNapoli.theme,
          key: themeKey,
          name: themeKey,
        }
      : null,
  };
}

describe("resolveRestaurantTheme", () => {
  it("returns a premium Italian identity for Italian restaurants", () => {
    const identity = resolveRestaurantTheme(themedRestaurant("italian-warm"));

    expect(identity.name).toBe("Italian Luxury");
    expect(identity.menuStyle).toBe("cards");
    expect(identity.buttonClass).toContain("rounded-full");
    expect(identity.personality.momentTitle).toMatch(/table/i);
  });

  it("supports Japanese minimal, steakhouse dark, and vegan natural presets", () => {
    expect(resolveRestaurantTheme(themedRestaurant("japanese")).name).toBe("Japanese Minimal");
    expect(resolveRestaurantTheme(themedRestaurant("steakhouse-dark")).name).toBe("Steakhouse Dark");
    expect(resolveRestaurantTheme(themedRestaurant("vegan-natural")).name).toBe("Vegan Natural");
  });

  it("detects a steakhouse mood from restaurant content", () => {
    const identity = resolveRestaurantTheme(
      themedRestaurant("", {
        name: "The Ember Grill",
        description: "Dry-aged beef and steak from the fire.",
      }),
    );

    expect(identity.key).toBe("steakhouse-dark");
    expect(identity.menuCardClass).toBe("luxury-steakhouse-card");
  });

  it("lets restaurant-level brand overrides win over theme defaults", () => {
    const identity = resolveRestaurantTheme(
      themedRestaurant("elegant", {
        primary_color: "#123456",
        font_family: "Georgia",
        button_style: "square",
      }),
    );

    expect(identity.primary).toBe("#123456");
    expect(identity.fontFamily).toBe("Georgia");
    expect(identity.buttonClass).toBe("rounded-none");
  });
});
