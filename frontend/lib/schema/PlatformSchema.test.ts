import { describe, expect, it } from "vitest";

import { mockRestaurantConfig } from "./mockRestaurantConfig";
import { RestaurantConfigSchema } from "./PlatformSchema";

describe("PlatformSchema", () => {
  it("parses a valid restaurant platform config", () => {
    const result = RestaurantConfigSchema.safeParse(mockRestaurantConfig);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.identity.restaurant_name).toBe("Napoli Antica");
      expect(Object.keys(result.data.pages)).toEqual(["home", "menu", "reservations", "gallery", "contact"]);
    }
  });

  it("fails when restaurant_name is missing", () => {
    const { restaurant_name: _restaurantName, ...identityWithoutName } = mockRestaurantConfig.identity;
    const result = RestaurantConfigSchema.safeParse({
      ...mockRestaurantConfig,
      identity: identityWithoutName,
    });

    expect(result.success).toBe(false);
  });

  it("defaults schema_version correctly", () => {
    const { schema_version: _schemaVersion, ...configWithoutVersion } = mockRestaurantConfig;
    const parsed = RestaurantConfigSchema.parse(configWithoutVersion);

    expect(parsed.schema_version).toBe("1.0.0");
  });

  it("fails when a block is missing component_id", () => {
    const homeHero = mockRestaurantConfig.pages.home.blocks[0];
    const { component_id: _componentId, ...blockWithoutComponentId } = homeHero;
    const result = RestaurantConfigSchema.safeParse({
      ...mockRestaurantConfig,
      pages: {
        ...mockRestaurantConfig.pages,
        home: {
          ...mockRestaurantConfig.pages.home,
          blocks: [blockWithoutComponentId],
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it("fails when a block image URL is invalid", () => {
    const homeHero = mockRestaurantConfig.pages.home.blocks[0];

    if (homeHero.type !== "hero") {
      throw new Error("Expected home first block to be a hero block");
    }

    const result = RestaurantConfigSchema.safeParse({
      ...mockRestaurantConfig,
      pages: {
        ...mockRestaurantConfig.pages,
        home: {
          ...mockRestaurantConfig.pages.home,
          blocks: [
            {
              ...homeHero,
              props: {
                ...homeHero.props,
                image_url: "not-a-valid-image-url",
              },
            },
          ],
        },
      },
    });

    expect(result.success).toBe(false);
  });
});
