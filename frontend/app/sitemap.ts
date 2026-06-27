import type { MetadataRoute } from "next";

import {
  backendUrl,
  restaurantSitemapEntries,
  siteUrl,
} from "@/lib/restaurantSeo";
import type { PublicRestaurantSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

async function fetchPublicRestaurants(): Promise<PublicRestaurantSummary[]> {
  try {
    const response = await fetch(`${backendUrl()}/api/restaurants`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    return response.json() as Promise<PublicRestaurantSummary[]>;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = baseUrl
    ? [
        {
          url: baseUrl,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 1,
        },
        {
          url: `${baseUrl}/contact`,
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.5,
        },
      ]
    : [];

  const restaurants = await fetchPublicRestaurants();
  return [...staticPages, ...restaurantSitemapEntries(restaurants)];
}
