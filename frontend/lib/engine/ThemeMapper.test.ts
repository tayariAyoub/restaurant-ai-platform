import { describe, expect, it } from "vitest";

import { mockRestaurantConfig } from "@/lib/schema/mockRestaurantConfig";
import { generateThemeCss } from "./ThemeMapper";

describe("ThemeMapper", () => {
  const css = generateThemeCss(mockRestaurantConfig.theme);

  it("generates CSS scoped to root", () => {
    expect(css).toContain(":root");
  });

  it("maps brand primary correctly", () => {
    expect(css).toContain("--color-brand-primary: #a6422b;");
  });

  it("maps heading font correctly", () => {
    expect(css).toContain("--font-heading: \"Cormorant Garamond\";");
  });

  it("maps button radius correctly", () => {
    expect(css).toContain("--radius-button: 999px;");
  });

  it("maps section spacing correctly", () => {
    expect(css).toContain("--section-spacing: 96px;");
  });
});
