import type { Metadata } from "next";

import {
  getLocalDevelopmentRestaurantFallbackForError,
  getLocalDevelopmentRestaurantFallback,
  getLocalDevelopmentRestaurantFallbackForStatus,
} from "@/lib/mockRestaurants";
import {
  absolutePublicUrl,
  backendUrl,
  configuredBackendUrl,
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
  if (process.env.NODE_ENV === "production" && !configuredBackendUrl()) {
    const fallback = getLocalFallbackForMissingBackend(slug);
    if (fallback) return fallback;
  }

  try {
    const response = await fetch(`${backendUrl()}/api/restaurants/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      if ([500, 502, 503, 504].includes(response.status)) {
        return getLocalFallbackForStatus(slug, response.status);
      }
      return null;
    }
    return response.json() as Promise<Restaurant>;
  } catch (error) {
    return getLocalFallbackForError(slug, error);
  }
}

function getLocalFallbackForMissingBackend(slug: string): Restaurant | null {
  const fallback = getLocalDevelopmentRestaurantFallback(slug);

  if (!fallback) return null;

  console.warn(
    `[RestaurantAI] Using demo fallback for /restaurants/${slug}: no backend URL configured`,
  );
  return fallback;
}

function getLocalFallbackForStatus(slug: string, status: number): Restaurant | null {
  const fallback = getLocalDevelopmentRestaurantFallbackForStatus(slug, status);

  if (!fallback) return null;

  console.warn(
    `[RestaurantAI] Using demo fallback for /restaurants/${slug}: backend responded with ${status}`,
  );
  return fallback;
}

function getLocalFallbackForError(slug: string, error: unknown): Restaurant | null {
  const fallback = getLocalDevelopmentRestaurantFallbackForError(slug, error);

  if (!fallback) return null;

  const reason = error instanceof Error ? error.message : "request failed";
  console.warn(
    `[RestaurantAI] Using demo fallback for /restaurants/${slug}: ${reason}`,
  );
  return fallback;
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
      locale: "de_DE",
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
    menu: "Speisekarte",
    reservations: "Reservierungen",
    gallery: "Galerie",
    contact: "Kontakt",
    events: "Private Dining und Events",
  };
  return `${restaurant.name} ${labels[page]}${place}`;
}

function pageDescription(restaurant: Restaurant, page: PublicRestaurantPage) {
  if (page === "home") return restaurantSeoDescription(restaurant);
  const city = restaurant.city ? ` in ${restaurant.city}` : "";
  if (page === "menu") return `Entdecken Sie die Speisekarte von ${restaurant.name}${city} mit Gerichten, Preisen, Hinweisen und Bestelloptionen.`;
  if (page === "reservations") return `Fragen Sie einen Tisch bei ${restaurant.name}${city} an und teilen Sie Uhrzeit, Gästezahl, Allergien oder Anlass mit.`;
  if (page === "gallery") return `Erleben Sie ${restaurant.name}${city} mit Eindrücken von Speisen, Raum und Atmosphäre.`;
  if (page === "contact") return `Finden Sie Adresse, Öffnungszeiten, Telefon, E-Mail, Karte und Social-Media-Links von ${restaurant.name}${city}.`;
  return `Planen Sie Private Dining, besondere Tische oder Events mit ${restaurant.name}${city}.`;
}

function pageKeyword(page: PublicRestaurantPage, restaurant: Restaurant) {
  if (page === "home") return "";
  const city = restaurant.city || "";
  const labels: Record<Exclude<PublicRestaurantPage, "home">, string> = {
    menu: "Restaurant Speisekarte",
    reservations: "Restaurant Reservierung",
    gallery: "Restaurant Galerie",
    contact: "Restaurant Kontakt",
    events: "Private Dining",
  };
  return `${restaurant.name} ${labels[page]} ${city}`.trim();
}
