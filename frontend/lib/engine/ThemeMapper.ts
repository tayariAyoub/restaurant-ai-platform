import type { Theme as ThemeConfig } from "@/lib/schema/PlatformSchema";

export type { ThemeConfig };

type ThemeVariable = [name: string, value: string];

function sanitizeCssSelector(selector: string): string {
  return selector.replace(/[{};]/g, "").trim() || ":root";
}

function sanitizeCssVariableValue(value: string): string {
  return value.replace(/[;{}<>]/g, " ").replace(/\s+/g, " ").trim();
}

function toFontFamilyValue(value: string): string {
  const sanitized = sanitizeCssVariableValue(value);

  if (
    sanitized.includes(",") ||
    sanitized.startsWith("\"") ||
    sanitized.startsWith("'") ||
    sanitized.startsWith("var(") ||
    !sanitized.includes(" ")
  ) {
    return sanitized;
  }

  return JSON.stringify(sanitized);
}

export function generateThemeCss(theme: ThemeConfig, selector = ":root"): string {
  const variables: ThemeVariable[] = [
    ["--color-brand-primary", theme.colors.brand.primary],
    ["--color-brand-secondary", theme.colors.brand.secondary],
    ["--color-surface-default", theme.colors.surface.default],
    ["--color-surface-alt", theme.colors.surface.alt],
    ["--color-text-primary", theme.colors.text.primary],
    ["--color-text-secondary", theme.colors.text.secondary],
    ["--color-status-success", theme.colors.status.success],
    ["--color-status-warning", theme.colors.status.warning],
    ["--color-status-error", theme.colors.status.error],
    ["--font-heading", toFontFamilyValue(theme.typography.heading_font)],
    ["--font-body", toFontFamilyValue(theme.typography.body_font)],
    ["--radius-button", theme.geometry.radius_button],
    ["--radius-card", theme.geometry.radius_card],
    ["--section-spacing", theme.geometry.section_spacing],
  ];

  const declarations = variables
    .map(([name, value]) => `  ${name}: ${sanitizeCssVariableValue(value)};`)
    .join("\n");

  return `${sanitizeCssSelector(selector)} {\n${declarations}\n}`;
}
