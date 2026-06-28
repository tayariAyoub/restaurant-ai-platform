import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { localBellaNapoliRestaurant } from "@/lib/mockRestaurants";
import { fetchPublicRestaurant } from "./restaurantPageData";

const fetchMock = vi.fn();

describe("public restaurant data loading", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("falls back to Bella Napoli in development when the backend fetch throws", async () => {
    vi.stubEnv("NODE_ENV", "development");
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const restaurant = await fetchPublicRestaurant("bella-napoli");

    expect(restaurant?.name).toBe("Bella Napoli");
    expect(restaurant?.slug).toBe("bella-napoli");
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("local development fallback"));
  });

  it("falls back to Bella Napoli in development when the backend returns 500", async () => {
    vi.stubEnv("NODE_ENV", "development");
    fetchMock.mockResolvedValueOnce(mockFetchResponse(500));

    const restaurant = await fetchPublicRestaurant("bella-napoli");

    expect(restaurant?.name).toBe("Bella Napoli");
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("backend responded with 500"));
  });

  it("falls back to Bella Napoli in development when the backend returns 502, 503, or 504", async () => {
    vi.stubEnv("NODE_ENV", "development");

    for (const status of [502, 503, 504]) {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(status));

      const restaurant = await fetchPublicRestaurant("bella-napoli");

      expect(restaurant?.name).toBe("Bella Napoli");
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(`backend responded with ${status}`));
    }
  });

  it("does not fall back on 404", async () => {
    vi.stubEnv("NODE_ENV", "development");
    fetchMock.mockResolvedValueOnce(mockFetchResponse(404));

    await expect(fetchPublicRestaurant("bella-napoli")).resolves.toBeNull();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("does not fall back for other slugs in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    await expect(fetchPublicRestaurant("other-restaurant")).resolves.toBeNull();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("keeps production strict", async () => {
    vi.stubEnv("NODE_ENV", "production");
    fetchMock.mockResolvedValueOnce(mockFetchResponse(500));

    await expect(fetchPublicRestaurant("bella-napoli")).resolves.toBeNull();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("uses backend data when the backend responds successfully", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const backendRestaurant = { ...localBellaNapoliRestaurant, name: "Backend Bella Napoli" };
    fetchMock.mockResolvedValueOnce(mockFetchResponse(200, backendRestaurant));

    await expect(fetchPublicRestaurant("bella-napoli")).resolves.toEqual(backendRestaurant);
    expect(console.warn).not.toHaveBeenCalled();
  });
});

function mockFetchResponse(status: number, payload: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}
