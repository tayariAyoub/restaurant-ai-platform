import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ThemePresetPreviewPage from "./page";

describe("theme preset preview route", () => {
  it("renders all theme preset names", () => {
    const { container } = render(<ThemePresetPreviewPage />);

    expect(screen.getByRole("heading", { name: "Theme Presets" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Luxury Italian" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Modern Japanese" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "French Bistro" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Classic Steakhouse" })).toBeVisible();
    expect(container.querySelectorAll("[data-theme-preset-preview]")).toHaveLength(4);
  });
});
