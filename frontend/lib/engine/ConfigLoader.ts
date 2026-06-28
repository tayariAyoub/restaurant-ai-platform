import { z } from "zod";

import { RestaurantConfigSchema, ThemeSchema, type RestaurantConfig, type Theme as ThemeConfig } from "@/lib/schema/PlatformSchema";
import { resolveThemePreset } from "@/lib/theme/resolveThemePreset";
import { getThemePreset } from "@/lib/theme/presets";

const SUPPORTED_SCHEMA_VERSION = "1.0.0";

const DEFAULT_RAW_RESTAURANT_CONFIG = {
  schema_version: SUPPORTED_SCHEMA_VERSION,
  identity: {
    tenant_id: "default_tenant",
    restaurant_name: "Restaurant",
    slug: "restaurant",
    cuisine: "Seasonal",
    city: "City",
    country: "Country",
    address: "Address pending",
    phone: "+00 000 000000",
    email: "hello@example.com",
    opening_hours: {
      monday: "Closed",
      tuesday: "18:00-22:00",
      wednesday: "18:00-22:00",
      thursday: "18:00-22:00",
      friday: "18:00-23:00",
      saturday: "18:00-23:00",
      sunday: "12:00-20:00",
    },
    social_links: {},
  },
  domain: "https://restaurant.example.com",
  theme: {
    preset: "michelin-luxury",
    colors: {
      brand: {
        primary: "#1f1a17",
        secondary: "#c8a15a",
      },
      surface: {
        default: "#fffaf2",
        alt: "#120f0d",
      },
      text: {
        primary: "#171412",
        secondary: "#6d6258",
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
      section_spacing: "96px",
    },
  },
  navigation: {
    logo_text: "Restaurant",
    links: [
      { label: "Experience", href: "/restaurants/restaurant" },
      { label: "Menu", href: "/restaurants/restaurant/menu" },
      { label: "Contact", href: "/restaurants/restaurant/contact" },
    ],
    primary_cta_label: "Reserve",
    primary_cta_href: "/restaurants/restaurant/reservations",
  },
  footer: {
    address: "Address pending",
    phone: "+00 000 000000",
    email: "hello@example.com",
    opening_hours: {
      monday: "Closed",
      tuesday: "18:00-22:00",
      wednesday: "18:00-22:00",
      thursday: "18:00-22:00",
      friday: "18:00-23:00",
      saturday: "18:00-23:00",
      sunday: "12:00-20:00",
    },
    social_links: {},
  },
  pages: {
    home: {
      layout: "fallback-home",
      seo: {
        title: "Restaurant",
        description: "A polished restaurant experience ready to be customized.",
        canonical: "https://restaurant.example.com/restaurants/restaurant",
        og_image: "https://images.example.com/restaurant/default-hero.jpg",
        robots: "index,follow",
        locale: "en_US",
      },
      blocks: [
        {
          id: "default-home-hero",
          component_id: "platform.hero.fallback",
          type: "hero",
          variant: "fallback",
          enabled: true,
          order: 0,
          settings: {
            spacing: "section-xl",
            visibility: "visible",
            background: "default",
            animation: "fade-up",
          },
          ai: {
            editable: true,
            generated: false,
            prompt: "",
          },
          props: {
            headline: "A restaurant experience, ready to become yours.",
            subheadline: "This fallback page keeps the platform contract valid while real restaurant content is prepared.",
            image_url: "https://images.example.com/restaurant/default-hero.jpg",
            cta_text: "Reserve",
            cta_href: "/restaurants/restaurant/reservations",
          },
        },
      ],
    },
  },
};

export const DEFAULT_RESTAURANT_CONFIG: RestaurantConfig = RestaurantConfigSchema.parse(DEFAULT_RAW_RESTAURANT_CONFIG);

export function loadRestaurantConfig(rawData: unknown): RestaurantConfig {
  const clonedInput = deepClone(rawData);
  const versionedInput = applySchemaVersionDefaults(clonedInput);
  const normalizedData = deepMerge(DEFAULT_RESTAURANT_CONFIG, versionedInput);

  try {
    const parsedConfig = RestaurantConfigSchema.parse(normalizedData);
    const themeInput = buildThemeInputForPresetResolution(parsedConfig.theme, versionedInput);
    const resolvedConfig = {
      ...parsedConfig,
      theme: resolveThemePreset(themeInput),
    };

    return RestaurantConfigSchema.parse(resolvedConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(formatConfigError(error));
    }
    throw error;
  }
}

function buildThemeInputForPresetResolution(parsedTheme: ThemeConfig, rawData: unknown): ThemeConfig {
  const rawTheme = getRawTheme(rawData);
  const presetName = isPlainRecord(rawTheme) && typeof rawTheme.preset === "string" ? rawTheme.preset : undefined;
  const presetTheme = presetName ? getThemePreset(presetName) : undefined;

  if (!presetTheme || !isPlainRecord(rawTheme)) {
    return parsedTheme;
  }

  try {
    return ThemeSchema.parse(deepMerge(presetTheme, rawTheme));
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(formatConfigError(error, "theme"));
    }
    throw error;
  }
}

function getRawTheme(rawData: unknown): unknown {
  if (!isPlainRecord(rawData)) {
    return undefined;
  }

  return rawData.theme;
}

function applySchemaVersionDefaults(rawData: unknown): unknown {
  if (!isPlainRecord(rawData)) {
    return rawData;
  }

  const schemaVersion = rawData.schema_version ?? SUPPORTED_SCHEMA_VERSION;

  switch (schemaVersion) {
    case SUPPORTED_SCHEMA_VERSION:
      return {
        ...rawData,
        schema_version: SUPPORTED_SCHEMA_VERSION,
      };
    default:
      return rawData;
  }
}

function deepClone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as T;
  }

  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, deepClone(item)]),
    ) as T;
  }

  return value;
}

function deepMerge(defaultValue: unknown, incomingValue: unknown): unknown {
  if (incomingValue === undefined) {
    return deepClone(defaultValue);
  }

  if (Array.isArray(defaultValue) || Array.isArray(incomingValue)) {
    return deepClone(incomingValue);
  }

  if (isPlainRecord(defaultValue) && isPlainRecord(incomingValue)) {
    const merged: Record<string, unknown> = deepClone(defaultValue);

    for (const [key, value] of Object.entries(incomingValue)) {
      merged[key] = deepMerge(merged[key], value);
    }

    return merged;
  }

  return deepClone(incomingValue);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatConfigError(error: z.ZodError, pathPrefix?: string): string {
  const details = error.issues.map((issue) => {
    const issuePath = issue.path.length > 0 ? issue.path.join(".") : "root";
    const path = pathPrefix && issuePath !== "root" ? `${pathPrefix}.${issuePath}` : pathPrefix || issuePath;
    return `${path}: ${issue.message}`;
  });

  return ["Invalid restaurant configuration:", ...details].join("\n");
}
