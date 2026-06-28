import { describe, expect, it } from "vitest";

import { ThemeSchema } from "@/lib/schema/PlatformSchema";
import {
  getThemeHeroVariantPreference,
  getThemePreset,
  isThemePresetName,
  THEME_PRESET_NAMES,
  THEME_PRESETS,
} from "./presets";

describe("theme presets", () => {
  it("validates every preset with ThemeSchema", () => {
    for (const presetName of THEME_PRESET_NAMES) {
      expect(() => ThemeSchema.parse(THEME_PRESETS[presetName])).not.toThrow();
    }
  });

  it("returns a known preset", () => {
    expect(getThemePreset("luxury_italian")?.preset).toBe("luxury_italian");
    expect(getThemePreset("modern_japanese")?.colors.brand.primary).toBe("#b3261e");
  });

  it("returns undefined for an unknown preset", () => {
    expect(getThemePreset("unknown_theme")).toBeUndefined();
  });

  it("checks theme preset names", () => {
    expect(isThemePresetName("french_bistro")).toBe(true);
    expect(isThemePresetName("not_a_preset")).toBe(false);
  });

  it("returns hero variant preferences for known presets", () => {
    expect(getThemeHeroVariantPreference("luxury_italian")).toBe("editorial");
    expect(getThemeHeroVariantPreference("modern_japanese")).toBe("minimal");
    expect(getThemeHeroVariantPreference("french_bistro")).toBe("editorial");
    expect(getThemeHeroVariantPreference("classic_steakhouse")).toBe("split");
    expect(getThemeHeroVariantPreference("unknown_theme")).toBeUndefined();
  });

  it("returns a clone so callers cannot mutate the preset library", () => {
    const preset = getThemePreset("classic_steakhouse");

    if (!preset) {
      throw new Error("Expected classic_steakhouse preset to exist.");
    }

    preset.colors.brand.primary = "#ffffff";

    expect(getThemePreset("classic_steakhouse")?.colors.brand.primary).toBe("#b08a4a");
  });
});
