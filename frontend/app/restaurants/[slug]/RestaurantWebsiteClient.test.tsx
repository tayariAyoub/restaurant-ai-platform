import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import RestaurantPageSkeleton from "@/components/RestaurantPageSkeleton";
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

    const { container } = renderWithUser(<RestaurantWebsiteClient slug="bella-napoli" />);

    expect(screen.getByLabelText(/loading restaurant/i)).toBeVisible();
    expect(screen.getByRole("heading", { name: /preparing your table/i })).toBeVisible();
    expect(screen.getByText(/the oven is warming. setting your table/i)).toBeVisible();

    expect(container.querySelector("video")).not.toBeInTheDocument();
  });

  it("uses a configured loading video and falls back if the video cannot load", () => {
    const { container } = renderWithUser(
      <RestaurantPageSkeleton loadingVideoSrc="/uploads/1/videos/loading.mp4" restaurantName="Bella Napoli" />,
    );

    expect(screen.getByRole("heading", { name: /preparing bella napoli/i })).toBeVisible();
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video).toHaveAttribute("src", "/uploads/1/videos/loading.mp4");
    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.playsInline).toBe(true);
    expect(video.getAttribute("preload")).toBe("metadata");

    fireEvent.error(video);
    expect(container.querySelector("video")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /preparing bella napoli/i })).toBeVisible();
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
