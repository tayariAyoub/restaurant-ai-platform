import type { Metadata } from "next";

import {
  absolutePublicUrl,
  backendUrl,
  FALLBACK_SEO_DESCRIPTION,
  FALLBACK_SEO_TITLE,
  restaurantPageUrl,
  restaurantRobots,
  restaurantSeoDescription,
  restaurantSeoImage,
  restaurantSeoImageAlt,
  restaurantSeoKeywords,
  restaurantSeoTitle,
  SITE_NAME,
} from "@/lib/restaurantSeo";
import type { Restaurant } from "@/lib/types";
import RestaurantWebsiteClient from "./RestaurantWebsiteClient";

type RestaurantPageProps = {
  params: Promise<{ slug: string }>;
};

async function fetchRestaurant(slug: string): Promise<Restaurant | null> {
  try {
    const response = await fetch(`${backendUrl()}/api/restaurants/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return response.json() as Promise<Restaurant>;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: RestaurantPageProps): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await fetchRestaurant(slug);
  const canonical = restaurantPageUrl(slug);

  if (!restaurant) {
    return {
      title: FALLBACK_SEO_TITLE,
      description: FALLBACK_SEO_DESCRIPTION,
      alternates: canonical ? { canonical } : undefined,
      robots: { index: false, follow: false },
      openGraph: {
        title: FALLBACK_SEO_TITLE,
        description: FALLBACK_SEO_DESCRIPTION,
        url: canonical,
        siteName: SITE_NAME,
        type: "website",
      },
      twitter: {
        card: "summary",
        title: FALLBACK_SEO_TITLE,
        description: FALLBACK_SEO_DESCRIPTION,
      },
    };
  }

  const title = restaurantSeoTitle(restaurant);
  const description = restaurantSeoDescription(restaurant);
  const image = restaurantSeoImage(restaurant);
  const logo = absolutePublicUrl(restaurant.logo_url);
  const keywords = restaurantSeoKeywords(restaurant);

  return {
    title,
    description,
    keywords,
    alternates: canonical ? { canonical } : undefined,
    robots: restaurantRobots(restaurant),
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: restaurantSeoImageAlt(restaurant),
            },
          ]
        : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
    icons: logo ? { icon: logo, apple: logo } : undefined,
  };
}

export default async function RestaurantWebsite({ params }: RestaurantPageProps) {
  const { slug } = await params;
  const restaurant = await fetchRestaurant(slug);
  return <RestaurantWebsiteClient slug={slug} initialRestaurant={restaurant} />;
}
