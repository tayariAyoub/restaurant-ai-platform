import type { Theme as ThemeConfig } from "@/lib/schema/PlatformSchema";
import { getThemePreset } from "./presets";

export function resolveThemePreset(theme: ThemeConfig): ThemeConfig {
  const preset = getThemePreset(theme.preset);

  if (!preset) {
    return cloneTheme(theme);
  }

  return mergeTheme(preset, theme);
}

function mergeTheme(base: ThemeConfig, overrides: ThemeConfig): ThemeConfig {
  return {
    preset: overrides.preset,
    colors: {
      brand: {
        ...base.colors.brand,
        ...overrides.colors.brand,
      },
      surface: {
        ...base.colors.surface,
        ...overrides.colors.surface,
      },
      text: {
        ...base.colors.text,
        ...overrides.colors.text,
      },
      status: {
        ...base.colors.status,
        ...overrides.colors.status,
      },
    },
    typography: {
      ...base.typography,
      ...overrides.typography,
    },
    geometry: {
      ...base.geometry,
      ...overrides.geometry,
    },
  };
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
