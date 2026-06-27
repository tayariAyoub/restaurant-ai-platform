import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/restaurantSeo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/restaurants/"],
      disallow: ["/admin", "/admin/", "/api", "/api/"],
    },
    sitemap: baseUrl ? `${baseUrl}/sitemap.xml` : undefined,
  };
}
