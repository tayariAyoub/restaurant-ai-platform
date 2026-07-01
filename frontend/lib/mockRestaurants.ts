import type { Restaurant } from "./types";

const LOCAL_FALLBACK_SLUG = "bella-napoli";
const LOCAL_FALLBACK_STATUSES = new Set([500, 502, 503, 504]);
const DEMO_HERO_IMAGE =
  "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1800&q=85";
const DEMO_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1200&q=85",
];

export const localBellaNapoliRestaurant: Restaurant = {
  id: 1,
  owner_id: 1,
  theme_id: 1,
  name: "Bella Napoli",
  slug: LOCAL_FALLBACK_SLUG,
  tagline: "Wood-fired pizza, made with heart.",
  description: "A warm neighborhood pizzeria serving slow-fermented dough, Italian classics, and seasonal ingredients in the heart of Berlin.",
  story: "Our dough rests for 48 hours. Our tomatoes come from San Marzano, and every guest is welcomed like family.",
  address: "Sonnenallee 42",
  city: "Berlin",
  postal_code: "12045",
  phone: "+49 30 555 0123",
  email: "ciao@bellanapoli.demo",
  google_maps_url: "https://www.google.com/maps/search/?api=1&query=Sonnenallee%2042%2012045%20Berlin",
  facebook_url: "",
  instagram_url: "https://instagram.example/bella",
  tiktok_url: "",
  opening_hours: JSON.stringify({
    monday: "Closed",
    tuesday: "17:00-22:30",
    wednesday: "17:00-22:30",
    thursday: "17:00-22:30",
    friday: "12:00-23:00",
    saturday: "12:00-23:00",
    sunday: "12:00-22:00",
  }),
  logo_url: "",
  hero_image: DEMO_HERO_IMAGE,
  loading_video_url: "",
  loading_video_filename: "",
  loading_video_size_bytes: 0,
  reservation_url: "",
  primary_color: "#c84b31",
  secondary_color: "#6b7048",
  background_color: "#f7f3ea",
  text_color: "#1b1b18",
  font_family: "Cormorant Garamond",
  button_style: "pill",
  homepage_style: "editorial",
  menu_style: "cards",
  gallery_style: "grid",
  reservations_enabled: true,
  ordering_enabled: true,
  delivery_enabled: false,
  pickup_enabled: true,
  dine_in_enabled: true,
  chatbot_enabled: true,
  ai_name: "Bella AI Maitre d'",
  ai_welcome_message: "Guten Abend. Fragen Sie nach Gerichten, Allergenen, Öffnungszeiten oder Reservierungen.",
  ai_tone: "Warm Italian hospitality",
  ai_allowed_topics: "Speisekarte, Allergene, Öffnungszeiten, Reservierungen, Abholung, Vor-Ort-Bestellung und Restaurantgeschichte.",
  ai_fallback_message: "Diese Information liegt mir noch nicht vor. Bitte kontaktieren Sie Bella Napoli direkt.",
  ai_escalation_message: "Für dringende Reservierungen, Allergien oder besondere Wünsche rufen Sie Bella Napoli bitte direkt an.",
  ai_language: "German",
  ai_safety_instructions: "Do not invent prices, allergens, hours, or reservation availability.",
  is_published: true,
  created_at: "2026-01-01T00:00:00Z",
  theme: {
    id: 1,
    key: "italian",
    name: "Italian",
    description: "Warm Italian hospitality",
    primary_color: "#c84b31",
    secondary_color: "#6b7048",
    background_color: "#f7f3ea",
    text_color: "#1b1b18",
    font_family: "Cormorant Garamond",
    button_style: "pill",
    homepage_style: "editorial",
    menu_style: "cards",
    gallery_style: "grid",
  },
  categories: [
    {
      id: 10,
      name: "Antipasti",
      description: "Small plates to begin.",
      sort_order: 1,
      items: [
        {
          id: 101,
          category_id: 10,
          name: "Burrata Pugliese",
          description: "Cremige Burrata mit Kirschtomaten, Basilikumöl und Meersalz.",
          price: "11.50",
          image_url: "",
          is_available: true,
          is_vegan: false,
          is_vegetarian: true,
          is_halal: false,
          allergens: "Milk",
        },
        {
          id: 102,
          category_id: 10,
          name: "Focaccia Rosmarino",
          description: "Hausgebackene Focaccia mit Rosmarin und Olivenöl.",
          price: "6.50",
          image_url: "",
          is_available: true,
          is_vegan: true,
          is_vegetarian: true,
          is_halal: false,
          allergens: "Gluten",
        },
      ],
    },
    {
      id: 11,
      name: "Wood-fired Pizza",
      description: "Slow-fermented dough from the oven.",
      sort_order: 2,
      items: [
        {
          id: 201,
          category_id: 11,
          name: "Margherita",
          description: "San-Marzano-Tomaten, Fior di Latte, Basilikum und Olivenöl.",
          price: "12.50",
          image_url: "",
          is_available: true,
          is_vegan: false,
          is_vegetarian: true,
          is_halal: false,
          allergens: "Gluten, Milk",
        },
        {
          id: 202,
          category_id: 11,
          name: "Diavola",
          description: "Tomate, Mozzarella, pikante Rindersalami und Chili.",
          price: "15.50",
          image_url: "",
          is_available: true,
          is_vegan: false,
          is_vegetarian: false,
          is_halal: false,
          allergens: "Gluten, Milk",
        },
        {
          id: 203,
          category_id: 11,
          name: "Ortolana",
          description: "Tomate, gegrilltes Gemüse und vegane Mozzarella.",
          price: "14.50",
          image_url: "",
          is_available: true,
          is_vegan: true,
          is_vegetarian: true,
          is_halal: true,
          allergens: "Gluten",
        },
      ],
    },
    {
      id: 12,
      name: "Dolci",
      description: "Ein süßer italienischer Abschluss.",
      sort_order: 3,
      items: [
        {
          id: 301,
          category_id: 12,
          name: "Tiramisù",
          description: "Espresso, Mascarpone, Kakao und Savoiardi.",
          price: "7.50",
          image_url: "",
          is_available: true,
          is_vegan: false,
          is_vegetarian: true,
          is_halal: false,
          allergens: "Gluten, Egg, Milk",
        },
      ],
    },
  ],
  images: [
    {
      id: 1,
      restaurant_id: 1,
      image_type: "gallery",
      url: DEMO_GALLERY_IMAGES[0],
      alt_text: "Pizza from Bella Napoli",
      sort_order: 0,
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: 2,
      restaurant_id: 1,
      image_type: "gallery",
      url: DEMO_GALLERY_IMAGES[1],
      alt_text: "Fresh pizza being prepared",
      sort_order: 1,
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: 3,
      restaurant_id: 1,
      image_type: "gallery",
      url: DEMO_GALLERY_IMAGES[2],
      alt_text: "Bella Napoli dining atmosphere",
      sort_order: 2,
      created_at: "2026-01-01T00:00:00Z",
    },
  ],
};

export function getLocalDevelopmentRestaurantFallback(slug: string): Restaurant | null {
  if (!isDemoFallbackAllowed(slug)) {
    return null;
  }

  return cloneRestaurant(localBellaNapoliRestaurant);
}

export function getLocalDevelopmentRestaurantFallbackForStatus(
  slug: string,
  status: number,
): Restaurant | null {
  if (!LOCAL_FALLBACK_STATUSES.has(status)) {
    return null;
  }

  return getLocalDevelopmentRestaurantFallback(slug);
}

export function getLocalDevelopmentRestaurantFallbackForError(
  slug: string,
  error: unknown,
): Restaurant | null {
  const status = statusFromError(error);

  if (status !== null) {
    return getLocalDevelopmentRestaurantFallbackForStatus(slug, status);
  }

  if (!isNetworkFetchError(error)) {
    return null;
  }

  return getLocalDevelopmentRestaurantFallback(slug);
}

function cloneRestaurant(restaurant: Restaurant): Restaurant {
  return JSON.parse(JSON.stringify(restaurant)) as Restaurant;
}

function isDemoFallbackAllowed(slug: string) {
  if (slug !== LOCAL_FALLBACK_SLUG) {
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  if (process.env.NEXT_PUBLIC_DEMO_FALLBACK === "false") {
    return false;
  }

  if (process.env.NEXT_PUBLIC_DEMO_FALLBACK === "true") {
    return true;
  }

  return !process.env.BACKEND_INTERNAL_URL?.trim();
}

function statusFromError(error: unknown): number | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const match = error.message.match(/\((\d{3})\)/);
  return match ? Number(match[1]) : null;
}

function isNetworkFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /failed to fetch|fetch failed|network|econnrefused|econnreset|connection refused/i.test(error.message);
}
