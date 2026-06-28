import { ThemeSchema, type Theme as ThemeConfig } from "@/lib/schema/PlatformSchema";

export const THEME_PRESET_NAMES = [
  "luxury_italian",
  "modern_japanese",
  "french_bistro",
  "classic_steakhouse",
] as const;

export type ThemePresetName = typeof THEME_PRESET_NAMES[number];
export type HeroVariantPreference = "editorial" | "minimal" | "split";

export const THEME_PRESETS = {
  luxury_italian: ThemeSchema.parse({
    preset: "luxury_italian",
    colors: {
      brand: {
        primary: "#a6422b",
        secondary: "#c79a49",
      },
      surface: {
        default: "#fff8ef",
        alt: "#201512",
      },
      text: {
        primary: "#201512",
        secondary: "#725d50",
      },
      status: {
        success: "#2f7d4f",
        warning: "#b9781d",
        error: "#b83232",
      },
    },
    typography: {
      heading_font: "Cormorant Garamond",
      body_font: "Inter",
    },
    geometry: {
      radius_button: "999px",
      radius_card: "24px",
      section_spacing: "112px",
    },
  }),
  modern_japanese: ThemeSchema.parse({
    preset: "modern_japanese",
    colors: {
      brand: {
        primary: "#b3261e",
        secondary: "#2b2b27",
      },
      surface: {
        default: "#f8f6f1",
        alt: "#0f0f0e",
      },
      text: {
        primary: "#11110f",
        secondary: "#68645d",
      },
      status: {
        success: "#2f6f53",
        warning: "#a86d17",
        error: "#b3261e",
      },
    },
    typography: {
      heading_font: "Inter",
      body_font: "Inter",
    },
    geometry: {
      radius_button: "12px",
      radius_card: "18px",
      section_spacing: "88px",
    },
  }),
  french_bistro: ThemeSchema.parse({
    preset: "french_bistro",
    colors: {
      brand: {
        primary: "#7a1f2b",
        secondary: "#536b4d",
      },
      surface: {
        default: "#fbf1df",
        alt: "#2b1717",
      },
      text: {
        primary: "#241514",
        secondary: "#725f55",
      },
      status: {
        success: "#3f7048",
        warning: "#a97224",
        error: "#9f2634",
      },
    },
    typography: {
      heading_font: "Cormorant Garamond",
      body_font: "Inter",
    },
    geometry: {
      radius_button: "999px",
      radius_card: "20px",
      section_spacing: "96px",
    },
  }),
  classic_steakhouse: ThemeSchema.parse({
    preset: "classic_steakhouse",
    colors: {
      brand: {
        primary: "#b08a4a",
        secondary: "#6b2f1f",
      },
      surface: {
        default: "#16100c",
        alt: "#2a1710",
      },
      text: {
        primary: "#f8ead5",
        secondary: "#c8aa84",
      },
      status: {
        success: "#5f7f48",
        warning: "#b08a4a",
        error: "#b24a3a",
      },
    },
    typography: {
      heading_font: "Cormorant Garamond",
      body_font: "Inter",
    },
    geometry: {
      radius_button: "10px",
      radius_card: "16px",
      section_spacing: "104px",
    },
  }),
} satisfies Record<ThemePresetName, ThemeConfig>;

export const THEME_HERO_VARIANT_PREFERENCES = {
  luxury_italian: "editorial",
  modern_japanese: "minimal",
  french_bistro: "editorial",
  classic_steakhouse: "split",
} satisfies Record<ThemePresetName, HeroVariantPreference>;

export function isThemePresetName(name: string): name is ThemePresetName {
  return Object.prototype.hasOwnProperty.call(THEME_PRESETS, name);
}

export function getThemePreset(name: string): ThemeConfig | undefined {
  if (!isThemePresetName(name)) {
    return undefined;
  }

  return cloneTheme(THEME_PRESETS[name]);
}

export function getThemeHeroVariantPreference(name: string): HeroVariantPreference | undefined {
  if (!isThemePresetName(name)) {
    return undefined;
  }

  return THEME_HERO_VARIANT_PREFERENCES[name];
}

function cloneTheme(theme: ThemeConfig): ThemeConfig {
  return {
    preset: theme.preset,
    colors: {
      brand: { ...theme.colors.brand },
      surface: { ...theme.colors.surface },
      text: { ...theme.colors.text },
      status: { ...theme.colors.status },
    },
    typography: { ...theme.typography },
    geometry: { ...theme.geometry },
  };
}
