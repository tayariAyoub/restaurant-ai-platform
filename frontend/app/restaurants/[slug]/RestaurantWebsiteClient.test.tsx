import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import RestaurantWebsiteClient from "./RestaurantWebsiteClient";
import { renderWithUser } from "@/test/test-utils";

const getRestaurantBySlugMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  getRestaurantBySlug: getRestaurantBySlugMock,
}));

describe("RestaurantWebsiteClient", () => {
  beforeEach(() => {
    getRestaurantBySlugMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows the premium branded loading state while restaurant data is loading", () => {
    getRestaurantBySlugMock.mockReturnValue(new Promise(() => undefined));

    renderWithUser(<RestaurantWebsiteClient slug="bella-napoli" />);

    expect(screen.getByLabelText(/loading restaurant/i)).toBeVisible();
    expect(screen.getByRole("heading", { name: /preparing bella napoli/i })).toBeVisible();
    expect(screen.getByText(/setting the table/i)).toBeVisible();
  });

  it("uses local Bella Napoli fallback in development when the client retry receives 500", async () => {
    vi.stubEnv("NODE_ENV", "development");
    getRestaurantBySlugMock.mockRejectedValueOnce(new Error("Request failed (500)"));

    renderWithUser(<RestaurantWebsiteClient slug="bella-napoli" />);

    expect(await screen.findByRole("heading", { name: "Bella Napoli" })).toBeVisible();
    expect(screen.queryByText(/request failed/i)).not.toBeInTheDocument();
  });

  it("does not use local Bella Napoli fallback in development when the client retry receives 404", async () => {
    vi.stubEnv("NODE_ENV", "development");
    getRestaurantBySlugMock.mockRejectedValueOnce(new Error("Request failed (404)"));

    renderWithUser(<RestaurantWebsiteClient slug="bella-napoli" />);

    expect(await screen.findByRole("heading", { name: "Restaurant not found" })).toBeVisible();
    expect(screen.getByText("Request failed (404)")).toBeVisible();
  });

  it("does not use local Bella Napoli fallback for generic not-found client errors", async () => {
    vi.stubEnv("NODE_ENV", "development");
    getRestaurantBySlugMock.mockRejectedValueOnce(new Error("Restaurant not found"));

    renderWithUser(<RestaurantWebsiteClient slug="bella-napoli" />);

    expect(await screen.findByRole("heading", { name: "Restaurant not found" })).toBeVisible();
    expect(screen.getAllByText("Restaurant not found")).toHaveLength(2);
  });
});
