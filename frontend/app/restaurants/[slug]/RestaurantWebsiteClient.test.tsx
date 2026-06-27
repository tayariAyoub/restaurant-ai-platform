import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

  it("shows the premium loading skeleton while restaurant data is loading", () => {
    getRestaurantBySlugMock.mockReturnValue(new Promise(() => undefined));

    renderWithUser(<RestaurantWebsiteClient slug="bella-napoli" />);

    expect(screen.getByLabelText(/loading restaurant/i)).toBeVisible();
    expect(screen.getByText(/preparing your table/i)).toBeVisible();
  });
});
