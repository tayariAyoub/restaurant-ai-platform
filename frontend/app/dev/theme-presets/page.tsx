import type { Metadata } from "next";

import PageRenderer from "@/components/engine/PageRenderer";
import ThemeProvider from "@/components/engine/ThemeProvider";
import { loadRestaurantConfig } from "@/lib/engine/ConfigLoader";
import { mockRestaurantConfig } from "@/lib/schema/mockRestaurantConfig";
import { THEME_PRESET_NAMES, type ThemePresetName } from "@/lib/theme/presets";

export const metadata: Metadata = {
  title: "Theme Preset Preview | RestaurantAI",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ThemePresetPreviewPage() {
  const previews = THEME_PRESET_NAMES.map((preset) => ({
    preset,
    label: formatPresetName(preset),
    config: loadRestaurantConfig({
      ...mockRestaurantConfig,
      theme: {
        preset,
      },
    }),
  }));

  return (
    <main className="min-h-screen bg-[#11100e] px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/45">Internal preview</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Theme Presets</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
            Engine-rendered homepage previews using mock restaurant content. This page is for development review only.
          </p>
        </div>
        <div className="grid gap-8">
          {previews.map(({ preset, label, config }) => {
            const previewId = `theme-preset-${preset}`;

            return (
              <ThemeProvider key={preset} theme={config.theme} scopeSelector={`#${previewId}`}>
                <section
                  id={previewId}
                  data-theme-preset-preview={preset}
                  className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white shadow-2xl"
                  style={{
                    backgroundColor: "var(--color-surface-default)",
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <div className="flex flex-col gap-4 border-b border-black/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: "var(--color-brand-primary)" }}>
                        {preset}
                      </p>
                      <h2 className="mt-2 text-3xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                        {label}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2" aria-label={`${label} color tokens`}>
                      <ColorSwatch label="Primary" value={config.theme.colors.brand.primary} />
                      <ColorSwatch label="Secondary" value={config.theme.colors.brand.secondary} />
                      <ColorSwatch label="Surface" value={config.theme.colors.surface.default} />
                      <ColorSwatch label="Text" value={config.theme.colors.text.primary} />
                    </div>
                  </div>
                  <div className="max-h-[920px] overflow-hidden bg-[#080604]">
                    <PageRenderer page={config.pages.home} />
                  </div>
                </section>
              </ThemeProvider>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function ColorSwatch({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-black/70">
      <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: value }} />
      {label}
    </span>
  );
}

function formatPresetName(preset: ThemePresetName) {
  return preset
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
