import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "./page";
import { bellaNapoli } from "@/test/fixtures";
import { renderWithUser } from "@/test/test-utils";

const getRestaurantMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  default: vi.fn(),
  getRestaurant: getRestaurantMock,
}));

describe("public homepage", () => {
  it("renders the homepage hero and primary calls to action", async () => {
    getRestaurantMock.mockResolvedValue(bellaNapoli);

    renderWithUser(<Home />);

    expect(await screen.findByRole("heading", { name: bellaNapoli.tagline })).toBeVisible();
    expect(screen.getByRole("link", { name: /view the menu/i })).toHaveAttribute("href", `/restaurants/${bellaNapoli.slug}#menu`);
    expect(screen.getAllByRole("link", { name: /reserve a table/i })[0]).toBeVisible();
    expect(screen.getByText(/Order from the restaurant/i)).toBeVisible();
  });

  it("keeps navigation links available", async () => {
    getRestaurantMock.mockResolvedValue(bellaNapoli);
    renderWithUser(<Home />);

    await screen.findByRole("heading", { name: bellaNapoli.tagline });

    expect(screen.getByRole("link", { name: /our story/i })).toHaveAttribute("href", "/#story");
    expect(screen.getAllByRole("link", { name: /menu/i })[0]).toHaveAttribute("href", "/menu");
    expect(screen.getByRole("link", { name: /visit/i })).toHaveAttribute("href", "/contact");
  });

  it("renders at a mobile width without dropping the hero", async () => {
    getRestaurantMock.mockResolvedValue(bellaNapoli);
    window.innerWidth = 390;
    window.dispatchEvent(new Event("resize"));

    renderWithUser(<Home />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: bellaNapoli.tagline })).toBeVisible();
    });
    expect(screen.getByRole("link", { name: /view the menu/i })).toBeVisible();
  });
});
