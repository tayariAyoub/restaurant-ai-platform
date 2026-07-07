import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import RestaurantWebsite from "./page";
import { renderWithUser } from "@/test/test-utils";

const fetchMock = vi.fn();
const getRestaurantBySlugMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  default: vi.fn(),
  getRestaurantBySlug: getRestaurantBySlugMock,
}));

describe("restaurant public page runtime fallback", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    getRestaurantBySlugMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders mock Bella Napoli in development when the backend returns 500", async () => {
    vi.stubEnv("NODE_ENV", "development");
    fetchMock.mockResolvedValueOnce(mockFetchResponse(500));

    const page = await RestaurantWebsite({
      params: Promise.resolve({ slug: "bella-napoli" }),
    });

    renderWithUser(page);

    expect(screen.getAllByRole("heading", { name: "Bella Napoli" }).length).toBeGreaterThan(0);
    expect(screen.queryByText("The kitchen is not connected yet.")).not.toBeInTheDocument();
    expect(screen.queryByText("Request failed (500)")).not.toBeInTheDocument();
    expect(getRestaurantBySlugMock).not.toHaveBeenCalled();
  });

  it("renders mock Bella Napoli in development when the backend fetch throws", async () => {
    vi.stubEnv("NODE_ENV", "development");
    fetchMock.mockRejectedValueOnce(new Error("fetch failed"));

    const page = await RestaurantWebsite({
      params: Promise.resolve({ slug: "bella-napoli" }),
    });

    renderWithUser(page);

    expect(screen.getAllByRole("heading", { name: "Bella Napoli" }).length).toBeGreaterThan(0);
    expect(screen.queryByText("The kitchen is not connected yet.")).not.toBeInTheDocument();
    expect(getRestaurantBySlugMock).not.toHaveBeenCalled();
  });

  it("renders mock Wise & Ayo in development when the backend returns 500", async () => {
    vi.stubEnv("NODE_ENV", "development");
    fetchMock.mockResolvedValueOnce(mockFetchResponse(500));

    const page = await RestaurantWebsite({
      params: Promise.resolve({ slug: "wise-and-ayo" }),
    });

    renderWithUser(page);

    expect(screen.getByRole("heading", { name: /Where Fire Meets Flavor/i })).toBeVisible();
    expect(screen.getByLabelText("Wise & Ayo home")).toBeVisible();
    expect(screen.queryByText("The kitchen is not connected yet.")).not.toBeInTheDocument();
    expect(getRestaurantBySlugMock).not.toHaveBeenCalled();
  });

  it("does not use mock Bella Napoli on 404", async () => {
    vi.stubEnv("NODE_ENV", "development");
    fetchMock.mockResolvedValueOnce(mockFetchResponse(404));
    getRestaurantBySlugMock.mockRejectedValueOnce(new Error("Request failed (404)"));

    const page = await RestaurantWebsite({
      params: Promise.resolve({ slug: "bella-napoli" }),
    });

    renderWithUser(page);

    expect(await screen.findByRole("heading", { name: "Restaurant not found" })).toBeVisible();
    expect(screen.getByText("Request failed (404)")).toBeVisible();
  });

  it("renders mock Bella Napoli in production when no backend URL is configured", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const page = await RestaurantWebsite({
      params: Promise.resolve({ slug: "bella-napoli" }),
    });

    renderWithUser(page);

    expect(screen.getAllByRole("heading", { name: "Bella Napoli" }).length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getRestaurantBySlugMock).not.toHaveBeenCalled();
  });

  it("renders mock Wise & Ayo in production when no backend URL is configured", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const page = await RestaurantWebsite({
      params: Promise.resolve({ slug: "wise-and-ayo" }),
    });

    renderWithUser(page);

    expect(screen.getByRole("heading", { name: /Where Fire Meets Flavor/i })).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getRestaurantBySlugMock).not.toHaveBeenCalled();
  });

  it("does not use mock Bella Napoli in production when a backend URL is configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BACKEND_INTERNAL_URL", "https://api.example.com");
    fetchMock.mockResolvedValueOnce(mockFetchResponse(500));
    getRestaurantBySlugMock.mockRejectedValueOnce(new Error("Request failed (500)"));

    const page = await RestaurantWebsite({
      params: Promise.resolve({ slug: "bella-napoli" }),
    });

    renderWithUser(page);

    expect(await screen.findByRole("heading", { name: "Restaurant not found" })).toBeVisible();
    expect(screen.getByText("Request failed (500)")).toBeVisible();
  });

  it("does not use mock Bella Napoli for another slug on 500", async () => {
    vi.stubEnv("NODE_ENV", "development");
    fetchMock.mockResolvedValueOnce(mockFetchResponse(500));
    getRestaurantBySlugMock.mockRejectedValueOnce(new Error("Request failed (500)"));

    const page = await RestaurantWebsite({
      params: Promise.resolve({ slug: "other-restaurant" }),
    });

    renderWithUser(page);

    expect(await screen.findByRole("heading", { name: "Restaurant not found" })).toBeVisible();
    expect(screen.getByText("Request failed (500)")).toBeVisible();
  });
});

function mockFetchResponse(status: number, payload: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}
