import { describe, expect, it } from "vitest";

import type { Theme as ThemeConfig } from "@/lib/schema/PlatformSchema";
import { getThemePreset } from "./presets";
import { resolveThemePreset } from "./resolveThemePreset";

describe("resolveThemePreset", () => {
  it("applies known preset values", () => {
    const theme = getRequiredPreset("modern_japanese");
    const resolved = resolveThemePreset(theme);

    expect(resolved.preset).toBe("modern_japanese");
    expect(resolved.colors.surface.default).toBe("#f8f6f1");
    expect(resolved.typography.heading_font).toBe("Inter");
    expect(resolved.geometry.radius_button).toBe("12px");
  });

  it("preserves custom overrides over preset values", () => {
    const theme = {
      ...getRequiredPreset("luxury_italian"),
      colors: {
        ...getRequiredPreset("luxury_italian").colors,
        brand: {
          ...getRequiredPreset("luxury_italian").colors.brand,
          primary: "#123456",
        },
      },
      geometry: {
        ...getRequiredPreset("luxury_italian").geometry,
        section_spacing: "144px",
      },
    };
    const resolved = resolveThemePreset(theme);

    expect(resolved.colors.brand.primary).toBe("#123456");
    expect(resolved.colors.brand.secondary).toBe("#c79a49");
    expect(resolved.geometry.section_spacing).toBe("144px");
  });

  it("returns an unknown preset theme unchanged", () => {
    const unknownTheme: ThemeConfig = {
      ...getRequiredPreset("french_bistro"),
      preset: "private_custom_theme",
    };

    expect(resolveThemePreset(unknownTheme)).toEqual(unknownTheme);
  });

  it("does not mutate the input theme", () => {
    const theme = getRequiredPreset("classic_steakhouse");
    const beforeResolve = structuredClone(theme);

    const resolved = resolveThemePreset(theme);
    resolved.colors.brand.primary = "#ffffff";

    expect(theme).toEqual(beforeResolve);
  });
});

function getRequiredPreset(name: string): ThemeConfig {
  const preset = getThemePreset(name);

  if (!preset) {
    throw new Error(`Expected ${name} preset to exist.`);
  }

  return preset;
}
