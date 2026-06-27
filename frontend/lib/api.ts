import type { Restaurant } from "./types";

export const API_URL = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail = payload?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : detail?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const getRestaurant = () => request<Restaurant>("/restaurant");
export const getRestaurantBySlug = (slug: string) =>
  request<Restaurant>(`/restaurants/${slug}`);

export const adminRequest = <T>(
  path: string,
  token: string,
  options: RequestInit = {},
) =>
  request<T>(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  });

export default request;
