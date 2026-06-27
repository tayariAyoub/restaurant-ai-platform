import type { Metadata, MetadataRoute } from "next";

import type { MenuItem, PublicRestaurantSummary, Restaurant } from "./types";

export const SITE_NAME = "RestaurantAI";
export const FALLBACK_SITE_URL = "http://localhost:3000";
export const FALLBACK_SEO_TITLE = "Restaurant | RestaurantAI";
export const FALLBACK_SEO_DESCRIPTION =
  "Discover restaurant menus, reservations, online ordering, and AI-powered hospitality with RestaurantAI.";

const KNOWN_CUISINES = [
  "Italian",
  "Pizza",
  "French",
  "Japanese",
  "Sushi",
  "Mediterranean",
  "Greek",
  "Spanish",
  "Mexican",
  "Indian",
  "Thai",
  "Chinese",
  "Lebanese",
  "Turkish",
  "Vegan",
  "Vegetarian",
  "Seafood",
  "Steakhouse",
  "Fine Dining",
];

export function siteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production") return FALLBACK_SITE_URL;
  return undefined;
}

export function backendUrl() {
  return (process.env.BACKEND_INTERNAL_URL || "http://localhost:8000").replace(/\/$/, "");
}

export function restaurantPageUrl(slug: string) {
  const baseUrl = siteUrl();
  return baseUrl ? `${baseUrl}/restaurants/${encodeURIComponent(slug)}` : undefined;
}

export function absolutePublicUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = siteUrl();
  if (!base) return undefined;
  return `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function restaurantCuisine(restaurant: Restaurant) {
  const searchText = [
    restaurant.theme?.name,
    restaurant.theme?.key,
    restaurant.name,
    restaurant.tagline,
    restaurant.description,
    restaurant.story,
    ...restaurant.categories.map((category) => category.name),
    ...restaurant.categories.flatMap((category) => category.items.map((item) => `${item.name} ${item.description}`)),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const cuisine = KNOWN_CUISINES.find((candidate) => searchText.includes(candidate.toLowerCase()));
  return cuisine || restaurant.theme?.name || restaurant.categories[0]?.name || "Restaurant";
}

export function restaurantSpecialties(restaurant: Restaurant, limit = 4) {
  const availableItems = restaurant.categories
    .flatMap((category) => category.items)
    .filter((item) => item.is_available)
    .map((item) => item.name.trim())
    .filter(Boolean);
  const categories = restaurant.categories.map((category) => category.name.trim()).filter(Boolean);
  return unique([...availableItems, ...categories]).slice(0, limit);
}

export function restaurantSeoTitle(restaurant: Restaurant) {
  const cuisine = restaurantCuisine(restaurant);
  const city = restaurant.city ? ` in ${restaurant.city}` : "";
  return `${restaurant.name} | ${cuisine} Restaurant${city}`;
}

export function restaurantSeoDescription(restaurant: Restaurant) {
  const cuisine = restaurantCuisine(restaurant);
  const location = restaurant.city ? `in ${restaurant.city}` : "near you";
  const specialties = restaurantSpecialties(restaurant, 3);
  const specialtyText = specialties.length > 0 ? ` known for ${toHumanList(specialties)}` : "";
  const base = compactSentence(restaurant.description || restaurant.tagline || restaurant.story);

  if (base) {
    return trimDescription(
      `${base}. Visit ${restaurant.name}, a ${cuisine.toLowerCase()} restaurant ${location}${specialtyText}. Explore the menu, book a table, or order online.`,
    );
  }

  return trimDescription(
    `${restaurant.name} is a ${cuisine.toLowerCase()} restaurant ${location}${specialtyText}. Explore the menu, reserve a table, order online, and enjoy premium hospitality.`,
  );
}

export function restaurantSeoKeywords(restaurant: Restaurant) {
  const cuisine = restaurantCuisine(restaurant);
  const city = restaurant.city;
  return unique(
    [
      restaurant.name,
      city && `${cuisine} Restaurant ${city}`,
      city && `Restaurant ${city}`,
      city && `Menu ${city}`,
      city && `Reservations ${city}`,
      city && `Online ordering ${city}`,
      cuisine,
      `${restaurant.name} menu`,
      `${restaurant.name} reservations`,
      ...restaurantSpecialties(restaurant, 8),
      ...restaurant.categories.map((category) => category.name),
      "Fine Dining",
    ].filter(Boolean) as string[],
  );
}

export function restaurantSeoImage(restaurant: Restaurant) {
  return (
    absolutePublicUrl(restaurant.hero_image) ||
    absolutePublicUrl(restaurant.images.find((image) => image.image_type === "hero")?.url) ||
    absolutePublicUrl(restaurant.images.find((image) => image.image_type === "food")?.url) ||
    absolutePublicUrl(restaurant.images.find((image) => image.image_type === "gallery")?.url) ||
    absolutePublicUrl(restaurant.logo_url)
  );
}

export function restaurantSeoImageAlt(restaurant: Restaurant) {
  const cuisine = restaurantCuisine(restaurant);
  const city = restaurant.city ? ` in ${restaurant.city}` : "";
  return `${restaurant.name} ${cuisine.toLowerCase()} restaurant${city}`;
}

export function restaurantRobots(restaurant?: Restaurant | null): NonNullable<Metadata["robots"]> {
  const shouldIndex = Boolean(restaurant?.is_published);
  return {
    index: shouldIndex,
    follow: shouldIndex,
    googleBot: {
      index: shouldIndex,
      follow: shouldIndex,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

export function buildRestaurantJsonLd(restaurant: Restaurant) {
  const url = restaurantPageUrl(restaurant.slug);
  const image = restaurantSeoImage(restaurant);
  const logo = absolutePublicUrl(restaurant.logo_url);
  const images = unique([image, ...restaurant.images.map((item) => absolutePublicUrl(item.url)).filter(Boolean)] as string[]);
  const openingHoursSpecification = parsedOpeningHoursSpecification(restaurant.opening_hours);
  const sameAs = [restaurant.instagram_url, restaurant.facebook_url, restaurant.tiktok_url].filter(Boolean);
  const menuUrl = url ? `${url}#menu` : undefined;
  const reservationUrl = absolutePublicUrl(restaurant.reservation_url) || (url ? `${url}#reserve` : undefined);
  const cuisine = restaurantCuisine(restaurant);

  return removeUndefined({
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": url ? `${url}#restaurant` : undefined,
    name: restaurant.name,
    description: restaurantSeoDescription(restaurant),
    url,
    image: images.length > 0 ? images : undefined,
    logo,
    telephone: restaurant.phone || undefined,
    email: restaurant.email || undefined,
    servesCuisine: cuisine === "Restaurant" ? undefined : cuisine,
    priceRange: inferPriceRange(restaurant),
    address:
      restaurant.address || restaurant.city || restaurant.postal_code
        ? removeUndefined({
            "@type": "PostalAddress",
            streetAddress: restaurant.address || undefined,
            addressLocality: restaurant.city || undefined,
            postalCode: restaurant.postal_code || undefined,
          })
        : undefined,
    geo: undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    openingHoursSpecification,
    openingHours: openingHoursSpecification ? undefined : parsedOpeningHoursText(restaurant.opening_hours),
    hasMenu: menuUrl,
    menu: menuUrl,
    acceptsReservations: true,
    potentialAction: reservationUrl
      ? {
          "@type": "ReserveAction",
          target: reservationUrl,
        }
      : undefined,
    aggregateRating: undefined,
  });
}

export function restaurantSitemapEntries(restaurants: PublicRestaurantSummary[]): MetadataRoute.Sitemap {
  return restaurants
    .filter((restaurant) => restaurant.is_published)
    .map((restaurant) => ({
      url: restaurantPageUrl(restaurant.slug) || `${FALLBACK_SITE_URL}/restaurants/${restaurant.slug}`,
      lastModified: new Date(restaurant.created_at),
      changeFrequency: "weekly",
      priority: 0.9,
    }));
}

function compactSentence(value: string) {
  return value.trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "");
}

function trimDescription(value: string) {
  const compact = value.trim().replace(/\s+/g, " ");
  return compact.length <= 165 ? compact : `${compact.slice(0, 162).replace(/\s+\S*$/, "")}...`;
}

function toHumanList(values: string[]) {
  if (values.length <= 1) return values[0] || "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function parsedOpeningHoursText(openingHours: string) {
  if (!openingHours) return undefined;
  try {
    const parsed = JSON.parse(openingHours) as Record<string, string>;
    const values = Object.entries(parsed)
      .filter(([, value]) => value && value.toLowerCase() !== "closed")
      .map(([day, value]) => `${day}: ${value}`);
    return values.length > 0 ? values : undefined;
  } catch {
    return [openingHours];
  }
}

function parsedOpeningHoursSpecification(openingHours: string) {
  if (!openingHours) return undefined;
  try {
    const parsed = JSON.parse(openingHours) as Record<string, string>;
    const specs = Object.entries(parsed)
      .map(([day, value]) => openingHoursSpec(day, value))
      .filter(Boolean);
    return specs.length > 0 ? specs : undefined;
  } catch {
    return undefined;
  }
}

function openingHoursSpec(day: string, value: string) {
  if (!value || value.toLowerCase() === "closed") return undefined;
  const [opens, closes] = value.split("-").map((part) => part.trim());
  if (!opens || !closes) return undefined;
  return {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: normalizeDay(day),
    opens,
    closes,
  };
}

function normalizeDay(day: string) {
  const clean = day.trim().toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function inferPriceRange(restaurant: Restaurant) {
  const prices = restaurant.categories
    .flatMap((category) => category.items)
    .map((item: MenuItem) => Number(item.price))
    .filter((price) => Number.isFinite(price) && price > 0);
  if (prices.length === 0) return undefined;
  const average = prices.reduce((total, price) => total + price, 0) / prices.length;
  if (average < 15) return "$$";
  if (average < 35) return "$$$";
  return "$$$$";
}

function removeUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}
