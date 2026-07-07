import type { Restaurant } from "./types";

const BELLA_NAPOLI_SLUG = "bella-napoli";
const WISE_AYO_SLUG = "wise-and-ayo";
const LOCAL_FALLBACK_STATUSES = new Set([500, 502, 503, 504]);
const DEMO_HERO_IMAGE =
  "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1800&q=85";
const DEMO_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1200&q=85",
];
const WISE_AYO_HERO_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80";
const WISE_AYO_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&q=80",
];
const WISE_AYO_GALLERY_ALTS = [
  "Grilled meat over flame",
  "Warm restaurant interior",
  "Plated dish",
  "Dining room",
  "Chef plating",
  "Guests celebrating",
  "Fresh ingredients",
];

export const localBellaNapoliRestaurant: Restaurant = {
  id: 1,
  owner_id: 1,
  theme_id: 1,
  name: "Bella Napoli",
  slug: BELLA_NAPOLI_SLUG,
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

export const localWiseAyoRestaurant: Restaurant = {
  id: 2,
  owner_id: 1,
  theme_id: 2,
  name: "Wise & Ayo",
  slug: WISE_AYO_SLUG,
  tagline: "Where Fire Meets Flavor",
  description: "Bold, wood-fired flavors in a warm, rustic ambiance. A culinary journey in the heart of New York City.",
  story: "We believe that great food tells a story. Our chefs masterfully blend global influences with modern techniques, crafting dishes that celebrate fresh, seasonal ingredients.",
  address: "123 Kindling Street",
  city: "New York",
  postal_code: "NY 10001",
  phone: "(555) 012-3456",
  email: "hello@wiseandayo.com",
  google_maps_url: "https://www.google.com/maps/search/?api=1&query=123%20Kindling%20Street%20New%20York%20NY%2010001",
  facebook_url: "",
  instagram_url: "https://instagram.example/wiseandayo",
  tiktok_url: "",
  opening_hours: JSON.stringify({
    monday: "17:00-22:00",
    tuesday: "17:00-22:00",
    wednesday: "17:00-22:00",
    thursday: "17:00-22:00",
    friday: "17:00-00:00",
    saturday: "17:00-00:00",
    sunday: "10:00-14:00",
  }),
  logo_url: "",
  hero_image: WISE_AYO_HERO_IMAGE,
  loading_video_url: "",
  loading_video_filename: "",
  loading_video_size_bytes: 0,
  reservation_url: "",
  primary_color: "#d65a28",
  secondary_color: "#8a6a2e",
  background_color: "#ffffff",
  text_color: "#163f2c",
  font_family: "Jost",
  button_style: "editorial",
  homepage_style: WISE_AYO_SLUG,
  menu_style: "tabs",
  gallery_style: "editorial-grid",
  reservations_enabled: true,
  ordering_enabled: false,
  delivery_enabled: false,
  pickup_enabled: false,
  dine_in_enabled: false,
  chatbot_enabled: false,
  ai_name: "Wise & Ayo AI Maitre d'",
  ai_welcome_message: "Welcome to Wise & Ayo. Ask about the menu, reservations, opening hours, or private dining.",
  ai_tone: "Warm, polished, wood-fired hospitality",
  ai_allowed_topics: "Menu, ingredients, opening hours, reservations, private dining, events, and restaurant story.",
  ai_fallback_message: "I do not have that detail yet. Please contact Wise & Ayo directly.",
  ai_escalation_message: "For urgent reservations, allergies, or private events, please contact Wise & Ayo directly.",
  ai_language: "English",
  ai_safety_instructions: "Do not invent prices, allergens, hours, or availability.",
  is_published: true,
  created_at: "2026-01-01T00:00:00Z",
  theme: {
    id: 2,
    key: WISE_AYO_SLUG,
    name: "Wise & Ayo",
    description: "Premium white editorial restaurant theme with fire-led imagery, horizontal panels, and refined menu tabs.",
    primary_color: "#d65a28",
    secondary_color: "#8a6a2e",
    background_color: "#ffffff",
    text_color: "#163f2c",
    font_family: "Jost",
    button_style: "editorial",
    homepage_style: WISE_AYO_SLUG,
    menu_style: "tabs",
    gallery_style: "editorial-grid",
  },
  categories: [
    {
      id: 20,
      name: "Starters",
      description: "Crafted by fire to begin the meal.",
      sort_order: 1,
      items: [
        wiseAyoItem(2001, 20, "Charred Sourdough & Smoked Butter", "House-baked sourdough, lightly charred, served with smoked sea salt butter.", "V"),
        wiseAyoItem(2002, 20, "Grilled Prawns with Chimichurri", "Fire-roasted prawns, citrus herb butter and fresh chimichurri.", "GF"),
        wiseAyoItem(2003, 20, "Heirloom Tomato & Burrata", "Vine-ripened tomatoes, creamy burrata, aged balsamic and fresh basil.", "V · GF"),
        wiseAyoItem(2004, 20, "Smoked Wagyu Tartare", "Hand-chopped Wagyu, egg yolk, pickled shallots, crispy capers and toasted rye.", ""),
        wiseAyoItem(2005, 20, "Truffle Mushroom Arancini", "Crispy risotto balls stuffed with wild mushrooms, parmesan and truffle aioli.", "V"),
        wiseAyoItem(2006, 20, "Fire-Grilled Calamari", "Charred calamari with lemon-garlic aioli and fresh herbs.", "GF"),
      ],
    },
    {
      id: 21,
      name: "Mains",
      description: "Open-fire cooking with seasonal ingredients.",
      sort_order: 2,
      items: [
        wiseAyoItem(2101, 21, "Fire-Grilled Ribeye", "12oz ribeye, dry-aged 30 days, bone marrow butter and charred asparagus.", "GF"),
        wiseAyoItem(2102, 21, "Cedar-Plank Salmon", "Roasted over open flame, honey-lime glaze and a side of wild rice.", "GF"),
        wiseAyoItem(2103, 21, "Lobster & Creamy Pasta", "Butter-poached lobster, rich garlic cream, cherry tomatoes and microgreens.", ""),
        wiseAyoItem(2104, 21, "Smoked Herb-Rubbed Chicken", "Fire-roasted chicken, rosemary jus, garlic confit and crispy potatoes.", "GF"),
        wiseAyoItem(2105, 21, "Crispy Cauliflower Schnitzel", "Breaded cauliflower steaks, black lentils, roasted zucchini, carrots and greens.", "V · GF"),
        wiseAyoItem(2106, 21, "Heirloom Tomato & Burrata", "Vine-ripened tomatoes, creamy burrata, aged balsamic and fresh basil.", "V · GF"),
      ],
    },
    {
      id: 22,
      name: "Desserts",
      description: "A polished finish with smoke, fruit, and cream.",
      sort_order: 3,
      items: [
        wiseAyoItem(2201, 22, "Molten Dark Chocolate Cake", "Rich chocolate cake with a gooey center and vanilla bean gelato.", "V"),
        wiseAyoItem(2202, 22, "Smoked Maple Crème Brûlée", "Silky custard infused with smoked maple and a caramelized sugar crust.", "GF · V"),
        wiseAyoItem(2203, 22, "Wood-Fired Apple Tart", "Flaky pastry, caramelized apples and cinnamon-spiced Chantilly cream.", "V"),
        wiseAyoItem(2204, 22, "Berry Pavlova", "Light meringue topped with seasonal berries and lemon-mascarpone cream.", "GF · V"),
        wiseAyoItem(2205, 22, "Salted Caramel Pecan Pie", "Buttery crust, toasted pecans, bourbon caramel and whipped cream.", "V"),
        wiseAyoItem(2206, 22, "House-Made Gelato Trio", "A selection of handcrafted gelato flavors, rotating seasonally.", "GF · V"),
      ],
    },
    {
      id: 23,
      name: "Drinks & Cocktails",
      description: "Smoked cocktails, wine pairings, and zero-proof signatures.",
      sort_order: 4,
      items: [
        wiseAyoItem(2301, 23, "Wise Old Fashioned", "Bourbon, smoked maple, orange bitters and charred oak essence.", ""),
        wiseAyoItem(2302, 23, "Hibiscus Fire Margarita", "Tequila, fresh hibiscus reduction, lime and a smoked salt rim.", ""),
        wiseAyoItem(2303, 23, "Rosemary Smoked Negroni", "Gin, vermouth, Campari and a rosemary smoke infusion.", ""),
        wiseAyoItem(2304, 23, "Whiskey & Smoke", "Aged whiskey, black walnut bitters, smoked cinnamon and a touch of honey.", ""),
        wiseAyoItem(2305, 23, "House Wine Pairings", "A curated selection of reds, whites and rosés to complement your meal.", ""),
        wiseAyoItem(2306, 23, "Signature Mocktails", "Citrus Basil Spritz and Berry Smoke Cooler — refreshing, alcohol-free.", "0%"),
      ],
    },
  ],
  images: WISE_AYO_GALLERY_IMAGES.map((url, index) => ({
    id: 20 + index,
    restaurant_id: 2,
    image_type: "gallery" as const,
    url,
    alt_text: WISE_AYO_GALLERY_ALTS[index] ?? "Wise & Ayo gallery image",
    sort_order: index,
    created_at: "2026-01-01T00:00:00Z",
  })),
};

const LOCAL_FALLBACK_RESTAURANTS: Record<string, Restaurant> = {
  [BELLA_NAPOLI_SLUG]: localBellaNapoliRestaurant,
  [WISE_AYO_SLUG]: localWiseAyoRestaurant,
};

export function getLocalDevelopmentRestaurantFallback(slug: string): Restaurant | null {
  if (!isDemoFallbackAllowed(slug)) {
    return null;
  }

  return cloneRestaurant(LOCAL_FALLBACK_RESTAURANTS[slug]);
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
  if (!LOCAL_FALLBACK_RESTAURANTS[slug]) {
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

function wiseAyoItem(id: number, categoryId: number, name: string, description: string, tags: string) {
  return {
    id,
    category_id: categoryId,
    name,
    description,
    price: "0.00",
    image_url: "",
    is_available: true,
    is_vegan: tags.includes("V") || tags.includes("0%"),
    is_vegetarian: tags.includes("V") || tags.includes("0%"),
    is_halal: false,
    allergens: tags,
  };
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
