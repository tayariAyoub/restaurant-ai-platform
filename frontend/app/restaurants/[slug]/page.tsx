import type { Metadata } from "next";

import type { Restaurant } from "@/lib/types";
import RestaurantWebsiteClient from "./RestaurantWebsiteClient";

type RestaurantPageProps = {
  params: Promise<{ slug: string }>;
};

const SITE_NAME = "RestaurantAI";
const FALLBACK_TITLE = "Restaurant | RestaurantAI";
const FALLBACK_DESCRIPTION =
  "Discover restaurant menus, reservations, online ordering, and AI-powered hospitality with RestaurantAI.";

function siteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  return undefined;
}

function restaurantPageUrl(slug: string) {
  const baseUrl = siteUrl();
  return baseUrl ? `${baseUrl}/restaurants/${encodeURIComponent(slug)}` : undefined;
}

function backendUrl() {
  return (process.env.BACKEND_INTERNAL_URL || "http://localhost:8000").replace(/\/$/, "");
}

function absoluteUrl(pathOrUrl: string | undefined) {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = pathOrUrl.startsWith("/uploads/") ? backendUrl() : siteUrl();
  if (!base) return undefined;
  return `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function compactText(...values: Array<string | undefined | null>) {
  return values
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ");
}

function restaurantCuisine(restaurant: Restaurant) {
  return restaurant.theme?.name || restaurant.categories[0]?.name || undefined;
}

function metadataTitle(restaurant: Restaurant) {
  const city = restaurant.city ? ` in ${restaurant.city}` : "";
  return `${restaurant.name}${city} | Menu, Reservations & Ordering`;
}

function metadataDescription(restaurant: Restaurant) {
  const cuisine = restaurantCuisine(restaurant);
  const location = restaurant.city ? ` in ${restaurant.city}` : "";
  const base =
    restaurant.description ||
    restaurant.tagline ||
    compactText(restaurant.name, cuisine, restaurant.city) ||
    FALLBACK_DESCRIPTION;
  return `${base}${location ? ` Visit ${restaurant.name}${location}` : ""}. Browse the menu, reserve a table, order online, and ask the AI maitre d'.`;
}

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
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
      alternates: canonical ? { canonical } : undefined,
      robots: { index: false, follow: false },
      openGraph: {
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
        url: canonical,
        siteName: SITE_NAME,
        type: "website",
      },
      twitter: {
        card: "summary",
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
      },
    };
  }

  const title = metadataTitle(restaurant);
  const description = metadataDescription(restaurant);
  const image =
    absoluteUrl(restaurant.hero_image) ||
    absoluteUrl(restaurant.logo_url) ||
    absoluteUrl(restaurant.images.find((item) => item.image_type === "gallery")?.url);
  const cuisine = restaurantCuisine(restaurant);
  const keywords = [
    restaurant.name,
    restaurant.city,
    cuisine,
    "restaurant",
    "menu",
    "reservations",
    "online ordering",
    "AI maitre d'",
  ].filter(Boolean) as string[];

  return {
    title,
    description,
    keywords,
    alternates: canonical ? { canonical } : undefined,
    robots: {
      index: restaurant.is_published,
      follow: restaurant.is_published,
      googleBot: {
        index: restaurant.is_published,
        follow: restaurant.is_published,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
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
              alt: restaurant.name,
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
  };
}

export default async function RestaurantWebsite({ params }: RestaurantPageProps) {
  const { slug } = await params;
  return <RestaurantWebsiteClient slug={slug} />;
}
