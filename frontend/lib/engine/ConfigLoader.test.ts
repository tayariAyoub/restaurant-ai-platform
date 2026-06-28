import { describe, expect, it } from "vitest";

import { mockRestaurantConfig } from "@/lib/schema/mockRestaurantConfig";
import { DEFAULT_RESTAURANT_CONFIG, loadRestaurantConfig } from "./ConfigLoader";

describe("ConfigLoader", () => {
  it("loads the mock restaurant config successfully", () => {
    const loadedConfig = loadRestaurantConfig(mockRestaurantConfig);

    expect(loadedConfig.identity.restaurant_name).toBe("Napoli Antica");
    expect(loadedConfig.pages.home.blocks).toHaveLength(2);
  });

  it("keeps a valid complete config semantically unchanged", () => {
    const loadedConfig = loadRestaurantConfig(mockRestaurantConfig);

    expect(loadedConfig).toEqual(mockRestaurantConfig);
  });

  it("defaults a missing schema_version to 1.0.0", () => {
    const { schema_version: _schemaVersion, ...configWithoutVersion } = mockRestaurantConfig;
    const loadedConfig = loadRestaurantConfig(configWithoutVersion);

    expect(loadedConfig.schema_version).toBe("1.0.0");
  });

  it("patches a partial config missing theme with the default theme", () => {
    const loadedConfig = loadRestaurantConfig({
      identity: {
        restaurant_name: "Small Table",
        slug: "small-table",
      },
    });

    expect(loadedConfig.identity.restaurant_name).toBe("Small Table");
    expect(loadedConfig.identity.slug).toBe("small-table");
    expect(loadedConfig.theme).toEqual(DEFAULT_RESTAURANT_CONFIG.theme);
  });

  it("patches a partial config missing pages.home with the fallback home page", () => {
    const loadedConfig = loadRestaurantConfig({
      identity: {
        restaurant_name: "No Pages Bistro",
        slug: "no-pages-bistro",
      },
      pages: {},
    });

    expect(loadedConfig.pages.home).toEqual(DEFAULT_RESTAURANT_CONFIG.pages.home);
    expect(loadedConfig.pages.home.blocks.length).toBeGreaterThan(0);
  });

  it("resolves a known theme preset into preset theme tokens", () => {
    const loadedConfig = loadRestaurantConfig({
      theme: {
        preset: "modern_japanese",
      },
    });

    expect(loadedConfig.theme.preset).toBe("modern_japanese");
    expect(loadedConfig.theme.colors.surface.default).toBe("#f8f6f1");
    expect(loadedConfig.theme.colors.brand.primary).toBe("#b3261e");
    expect(loadedConfig.theme.typography.heading_font).toBe("Inter");
    expect(loadedConfig.theme.geometry.radius_button).toBe("12px");
  });

  it("keeps custom theme overrides above preset values", () => {
    const loadedConfig = loadRestaurantConfig({
      theme: {
        preset: "modern_japanese",
        colors: {
          brand: {
            primary: "#123456",
          },
        },
        geometry: {
          section_spacing: "144px",
        },
      },
    });

    expect(loadedConfig.theme.colors.brand.primary).toBe("#123456");
    expect(loadedConfig.theme.colors.brand.secondary).toBe("#2b2b27");
    expect(loadedConfig.theme.geometry.section_spacing).toBe("144px");
    expect(loadedConfig.theme.geometry.radius_button).toBe("12px");
  });

  it("leaves unknown preset themes unchanged after normal loading", () => {
    const customTheme = {
      ...DEFAULT_RESTAURANT_CONFIG.theme,
      preset: "private_custom_theme",
      colors: {
        ...DEFAULT_RESTAURANT_CONFIG.theme.colors,
        brand: {
          ...DEFAULT_RESTAURANT_CONFIG.theme.colors.brand,
          primary: "#abcdef",
        },
      },
    };

    const loadedConfig = loadRestaurantConfig({
      theme: customTheme,
    });

    expect(loadedConfig.theme).toEqual(customTheme);
  });

  it("throws a useful error for invalid preset overrides", () => {
    expect(() => loadRestaurantConfig({
      theme: {
        preset: "modern_japanese",
        colors: {
          brand: {
            primary: "",
          },
        },
      },
    })).toThrow(/Invalid restaurant configuration:\ntheme\.colors\.brand\.primary:/);
  });

  it("throws a useful error for invalid configs", () => {
    expect(() => loadRestaurantConfig({
      pages: {
        home: {
          blocks: [
            {
              ...DEFAULT_RESTAURANT_CONFIG.pages.home.blocks[0],
              props: {
                ...DEFAULT_RESTAURANT_CONFIG.pages.home.blocks[0].props,
                image_url: "not-a-valid-image-url",
              },
            },
          ],
        },
      },
    })).toThrow(/Invalid restaurant configuration:\npages\.home\.blocks\.0\.props\.image_url:/);
  });

  it("does not mutate the original input object", () => {
    const rawConfig = {
      identity: {
        restaurant_name: "Mutable Bistro",
        slug: "mutable-bistro",
      },
      navigation: {
        links: [
          { label: "Only Menu", href: "/restaurants/mutable-bistro/menu" },
        ],
      },
    };
    const beforeLoad = structuredClone(rawConfig);

    loadRestaurantConfig(rawConfig);

    expect(rawConfig).toEqual(beforeLoad);
    expect(rawConfig).not.toHaveProperty("schema_version");
    expect(rawConfig).not.toHaveProperty("theme");
  });

  it("does not mutate theme preset input objects", () => {
    const rawConfig = {
      theme: {
        preset: "modern_japanese",
        colors: {
          brand: {
            primary: "#123456",
          },
        },
      },
    };
    const beforeLoad = structuredClone(rawConfig);

    loadRestaurantConfig(rawConfig);

    expect(rawConfig).toEqual(beforeLoad);
  });

  it("replaces arrays instead of deeply merging them", () => {
    const loadedConfig = loadRestaurantConfig({
      navigation: {
        links: [
          { label: "Reserve", href: "/restaurants/restaurant/reservations" },
        ],
      },
      pages: {
        home: {
          blocks: [
            {
              id: "custom-home-story",
              component_id: "platform.story.custom",
              type: "story",
              variant: "custom",
              enabled: true,
              order: 0,
              settings: DEFAULT_RESTAURANT_CONFIG.pages.home.blocks[0].settings,
              ai: DEFAULT_RESTAURANT_CONFIG.pages.home.blocks[0].ai,
              props: {
                title: "A single custom block",
                body_text: "Arrays from raw input replace default arrays instead of merging with them.",
                image_url: "https://images.example.com/custom/story.jpg",
                image_position: "left",
              },
            },
          ],
        },
      },
    });

    expect(loadedConfig.navigation.links).toEqual([
      { label: "Reserve", href: "/restaurants/restaurant/reservations" },
    ]);
    expect(loadedConfig.pages.home.blocks).toHaveLength(1);
    expect(loadedConfig.pages.home.blocks[0].id).toBe("custom-home-story");
  });
});
