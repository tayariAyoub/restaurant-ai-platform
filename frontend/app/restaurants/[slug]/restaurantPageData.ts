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

export type PublicRestaurantPage = "home" | "menu" | "reservations" | "gallery" | "contact" | "events";

const routePath: Record<PublicRestaurantPage, string> = {
  home: "",
  menu: "menu",
  reservations: "reservations",
  gallery: "gallery",
  contact: "contact",
  events: "events",
};

export type RestaurantPageProps = {
  params: Promise<{ slug: string }>;
};

export async function fetchPublicRestaurant(slug: string): Promise<Restaurant | null> {
  try {
    const response = await fetch(`${backendUrl()}/api/restaurants/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return response.json() as Promise<Restaurant>;
  } catch {
    return null;
  }
}

export async function generateRestaurantPageMetadata(
  slug: string,
  page: PublicRestaurantPage = "home",
): Promise<Metadata> {
  const restaurant = await fetchPublicRestaurant(slug);
  const canonical = canonicalUrl(slug, page);

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

  const title = pageTitle(restaurant, page);
  const description = pageDescription(restaurant, page);
  const image = restaurantSeoImage(restaurant);
  const logo = absolutePublicUrl(restaurant.logo_url);
  const keywords = [...restaurantSeoKeywords(restaurant), pageKeyword(page, restaurant)].filter(Boolean);

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

function canonicalUrl(slug: string, page: PublicRestaurantPage) {
  const base = restaurantPageUrl(slug);
  if (!base || page === "home") return base;
  return `${base}/${routePath[page]}`;
}

function pageTitle(restaurant: Restaurant, page: PublicRestaurantPage) {
  if (page === "home") return restaurantSeoTitle(restaurant);
  const place = restaurant.city ? ` in ${restaurant.city}` : "";
  const labels: Record<Exclude<PublicRestaurantPage, "home">, string> = {
    menu: "Menu",
    reservations: "Reservations",
    gallery: "Gallery",
    contact: "Contact",
    events: "Private Dining & Events",
  };
  return `${restaurant.name} ${labels[page]}${place}`;
}

function pageDescription(restaurant: Restaurant, page: PublicRestaurantPage) {
  if (page === "home") return restaurantSeoDescription(restaurant);
  const city = restaurant.city ? ` in ${restaurant.city}` : "";
  if (page === "menu") return `Explore ${restaurant.name}'s menu${city}, including dishes, prices, dietary notes, and ordering options.`;
  if (page === "reservations") return `Request a table at ${restaurant.name}${city} and share timing, party size, allergies, or occasion details.`;
  if (page === "gallery") return `Step inside ${restaurant.name}${city} through food, atmosphere, and dining room photography.`;
  if (page === "contact") return `Find ${restaurant.name}'s address, opening hours, phone, email, map, and social links${city}.`;
  return `Plan private dining, special tables, or events with ${restaurant.name}${city}.`;
}

function pageKeyword(page: PublicRestaurantPage, restaurant: Restaurant) {
  if (page === "home") return "";
  const city = restaurant.city || "";
  const labels: Record<Exclude<PublicRestaurantPage, "home">, string> = {
    menu: "restaurant menu",
    reservations: "restaurant reservations",
    gallery: "restaurant gallery",
    contact: "restaurant contact",
    events: "private dining",
  };
  return `${restaurant.name} ${labels[page]} ${city}`.trim();
}
