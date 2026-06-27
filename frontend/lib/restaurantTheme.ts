import type { Restaurant } from "./types";

type ThemePersonality = {
  name: string;
  description: string;
  momentTitle: string;
  momentCopy: string;
};

type ThemePreset = {
  key: string;
  name: string;
  fallbackPrimary: string;
  fallbackSecondary: string;
  fallbackBackground: string;
  fallbackText: string;
  fallbackFont: string;
  buttonStyle: string;
  homepageStyle: string;
  menuStyle: string;
  galleryStyle: string;
  heroOverlay: string;
  heroFallback: string;
  shellBackground: string;
  signaturePanelClass: string;
  menuCardClass: string;
  galleryClass: string;
  personality: ThemePersonality;
};

export type RestaurantThemeIdentity = ThemePreset & {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  fontFamily: string;
  buttonClass: string;
};

const presets: Record<string, ThemePreset> = {
  elegant: {
    key: "elegant",
    name: "Michelin Fine Dining",
    fallbackPrimary: "#c6a15b",
    fallbackSecondary: "#2c2925",
    fallbackBackground: "#11110f",
    fallbackText: "#f7f2e8",
    fallbackFont: "Cormorant Garamond",
    buttonStyle: "pill",
    homepageStyle: "editorial",
    menuStyle: "refined",
    galleryStyle: "masonry",
    heroOverlay: "linear-gradient(90deg, rgba(5,5,4,.96), rgba(12,10,8,.76) 44%, rgba(10,8,5,.22))",
    heroFallback: "linear-gradient(135deg, #090807, #2c2925 52%, #11110f)",
    shellBackground:
      "radial-gradient(circle at 12% 0%, rgba(198, 161, 91, 0.18), transparent 24rem), linear-gradient(180deg, rgba(17,17,15,.96), rgba(31,28,24,.9) 36%, rgba(247,243,234,1) 70%)",
    signaturePanelClass: "bg-[#11110f] text-white",
    menuCardClass: "luxury-menu-card",
    galleryClass: "md:grid-cols-4",
    personality: {
      name: "Michelin Fine Dining",
      description: "A quiet, high-touch identity for restaurants that want every interaction to feel composed and intentional.",
      momentTitle: "A room designed around anticipation.",
      momentCopy: "Before the first plate arrives, the evening already has a rhythm: soft light, clear choices, and a sense that the kitchen is ready for you.",
    },
  },
  cafe: {
    key: "cafe",
    name: "Modern Cafe",
    fallbackPrimary: "#8b5e3c",
    fallbackSecondary: "#d9c3a5",
    fallbackBackground: "#f4ecdf",
    fallbackText: "#30271f",
    fallbackFont: "Inter",
    buttonStyle: "soft",
    homepageStyle: "cards",
    menuStyle: "cards",
    galleryStyle: "grid",
    heroOverlay: "linear-gradient(90deg, rgba(48,39,31,.9), rgba(48,39,31,.58) 46%, rgba(48,39,31,.14))",
    heroFallback: "linear-gradient(135deg, #30271f, #8b5e3c 52%, #f4ecdf)",
    shellBackground:
      "radial-gradient(circle at 15% 0%, rgba(139, 94, 60, 0.14), transparent 24rem), linear-gradient(180deg, rgba(255,255,255,.78), rgba(244,236,223,.98))",
    signaturePanelClass: "bg-[#30271f] text-white",
    menuCardClass: "bg-white",
    galleryClass: "md:grid-cols-3",
    personality: {
      name: "Modern Cafe",
      description: "Warm, bright, and approachable for cafes, brunch rooms, bakeries, and all-day neighborhood spots.",
      momentTitle: "An easy room for regulars and first visits.",
      momentCopy: "The experience feels relaxed and useful: clear menus, friendly choices, and ordering that never feels heavy.",
    },
  },
  "italian-warm": {
    key: "italian-warm",
    name: "Italian Warm",
    fallbackPrimary: "#c84b31",
    fallbackSecondary: "#6b7048",
    fallbackBackground: "#f7f3ea",
    fallbackText: "#1b1b18",
    fallbackFont: "Cormorant Garamond",
    buttonStyle: "pill",
    homepageStyle: "story",
    menuStyle: "cards",
    galleryStyle: "grid",
    heroOverlay: "linear-gradient(90deg, rgba(45,29,19,.94), rgba(70,43,28,.64) 44%, rgba(90,52,30,.18))",
    heroFallback: "linear-gradient(135deg, #17120f, #7f3328 52%, #f7f3ea)",
    shellBackground:
      "radial-gradient(circle at 12% 0%, rgba(200,75,49,.13), transparent 24rem), radial-gradient(circle at 88% 12%, rgba(107,112,72,.12), transparent 25rem), linear-gradient(180deg, rgba(255,255,255,.72), rgba(247,243,234,.98))",
    signaturePanelClass: "bg-[#171511] text-white",
    menuCardClass: "luxury-menu-card",
    galleryClass: "md:grid-cols-3",
    personality: {
      name: "Italian Warm",
      description: "Warm, generous, ingredient-led storytelling for restaurants built on family, fire, wine, and memory.",
      momentTitle: "An evening that begins with the table.",
      momentCopy: "Comfort, aroma, and hospitality lead the experience, with dishes presented as familiar rituals rather than simple products.",
    },
  },
  mediterranean: {
    key: "mediterranean",
    name: "Italian Warm",
    fallbackPrimary: "#c84b31",
    fallbackSecondary: "#6b7048",
    fallbackBackground: "#f7f3ea",
    fallbackText: "#1b1b18",
    fallbackFont: "Cormorant Garamond",
    buttonStyle: "pill",
    homepageStyle: "story",
    menuStyle: "cards",
    galleryStyle: "grid",
    heroOverlay: "linear-gradient(90deg, rgba(45,29,19,.94), rgba(70,43,28,.64) 44%, rgba(90,52,30,.18))",
    heroFallback: "linear-gradient(135deg, #17120f, #7f3328 52%, #f7f3ea)",
    shellBackground:
      "radial-gradient(circle at 12% 0%, rgba(200,75,49,.13), transparent 24rem), radial-gradient(circle at 88% 12%, rgba(107,112,72,.12), transparent 25rem), linear-gradient(180deg, rgba(255,255,255,.72), rgba(247,243,234,.98))",
    signaturePanelClass: "bg-[#171511] text-white",
    menuCardClass: "luxury-menu-card",
    galleryClass: "md:grid-cols-3",
    personality: {
      name: "Italian Warm",
      description: "Sunlit, relaxed, produce-forward hospitality for restaurants that want warmth without losing polish.",
      momentTitle: "Bright plates, generous tables, easy decisions.",
      momentCopy: "The guest journey feels open and inviting, with seasonal dishes, direct ordering, and reservations gathered into one elegant flow.",
    },
  },
  japanese: {
    key: "japanese",
    name: "Sushi Minimal",
    fallbackPrimary: "#111111",
    fallbackSecondary: "#b23a31",
    fallbackBackground: "#fafafa",
    fallbackText: "#171717",
    fallbackFont: "Inter",
    buttonStyle: "square",
    homepageStyle: "minimal",
    menuStyle: "minimal",
    galleryStyle: "filmstrip",
    heroOverlay: "linear-gradient(90deg, rgba(0,0,0,.92), rgba(0,0,0,.62) 46%, rgba(0,0,0,.16))",
    heroFallback: "linear-gradient(135deg, #050505, #1f1f1f 48%, #fafafa)",
    shellBackground:
      "linear-gradient(180deg, rgba(250,250,250,1), rgba(242,242,240,.98)), radial-gradient(circle at 80% 0%, rgba(178,58,49,.08), transparent 24rem)",
    signaturePanelClass: "bg-black text-white",
    menuCardClass: "bg-white",
    galleryClass: "md:grid-cols-4",
    personality: {
      name: "Sushi Minimal",
      description: "Disciplined pacing, quiet detail, and trust in the chef's sequence for restaurants centered on craft.",
      momentTitle: "Let the evening unfold one course at a time.",
      momentCopy: "The menu feels guided, personal, and precise, with the AI Maitre d' helping guests navigate preferences before they arrive.",
    },
  },
  "vegan-natural": {
    key: "vegan-natural",
    name: "Vegan Natural",
    fallbackPrimary: "#496b3a",
    fallbackSecondary: "#b98f4b",
    fallbackBackground: "#f3f0e4",
    fallbackText: "#1f2a1b",
    fallbackFont: "Inter",
    buttonStyle: "soft",
    homepageStyle: "seasonal",
    menuStyle: "cards",
    galleryStyle: "masonry",
    heroOverlay: "linear-gradient(90deg, rgba(31,42,27,.92), rgba(54,77,43,.62) 46%, rgba(31,42,27,.12))",
    heroFallback: "linear-gradient(135deg, #1f2a1b, #496b3a 52%, #f3f0e4)",
    shellBackground:
      "radial-gradient(circle at 12% 0%, rgba(73,107,58,.13), transparent 24rem), radial-gradient(circle at 88% 10%, rgba(185,143,75,.12), transparent 24rem), linear-gradient(180deg, rgba(255,255,255,.75), rgba(243,240,228,.98))",
    signaturePanelClass: "bg-[#1f2a1b] text-white",
    menuCardClass: "bg-white",
    galleryClass: "md:grid-cols-4",
    personality: {
      name: "Vegan Natural",
      description: "Seasonal, ingredient-led, calm, and natural for plant-forward restaurants and produce-driven kitchens.",
      momentTitle: "Seasonality, freshness, and a grounded table.",
      momentCopy: "The site feels clean and alive, making dietary clarity and ingredient stories part of the premium experience.",
    },
  },
};

export const premiumThemeKeys = ["elegant", "cafe", "italian-warm", "japanese", "vegan-natural"];

export function resolveRestaurantTheme(restaurant: Restaurant): RestaurantThemeIdentity {
  const key = normalizeThemeKey(restaurant);
  const preset = presets[key] || presets.mediterranean;
  const buttonStyle = restaurant.button_style || restaurant.theme?.button_style || preset.buttonStyle;

  return {
    ...preset,
    key,
    primary: restaurant.primary_color || restaurant.theme?.primary_color || preset.fallbackPrimary,
    secondary: restaurant.secondary_color || restaurant.theme?.secondary_color || preset.fallbackSecondary,
    background: restaurant.background_color || restaurant.theme?.background_color || preset.fallbackBackground,
    text: restaurant.text_color || restaurant.theme?.text_color || preset.fallbackText,
    fontFamily: restaurant.font_family || restaurant.theme?.font_family || preset.fallbackFont,
    buttonStyle,
    homepageStyle: restaurant.homepage_style || restaurant.theme?.homepage_style || preset.homepageStyle,
    menuStyle: restaurant.menu_style || restaurant.theme?.menu_style || preset.menuStyle,
    galleryStyle: restaurant.gallery_style || restaurant.theme?.gallery_style || preset.galleryStyle,
    buttonClass:
      buttonStyle === "square"
        ? "rounded-none"
        : buttonStyle === "soft"
          ? "rounded-xl"
          : buttonStyle === "bold"
            ? "rounded-lg uppercase tracking-wide"
            : "rounded-full",
  };
}

function normalizeThemeKey(restaurant: Restaurant) {
  const raw = (restaurant.theme?.key || restaurant.theme?.name || "").toLowerCase();
  const haystack = `${raw} ${restaurant.name} ${restaurant.description} ${restaurant.story}`.toLowerCase();
  if (raw.includes("italian") || raw.includes("mediterranean") || haystack.includes("pizza") || haystack.includes("pasta")) return "italian-warm";
  if (raw.includes("japanese") || raw.includes("sushi") || raw.includes("minimal")) return "japanese";
  if (raw.includes("vegan") || raw.includes("natural") || haystack.includes("vegan") || haystack.includes("plant")) return "vegan-natural";
  if (raw.includes("cafe") || raw.includes("café") || raw.includes("coffee") || raw.includes("brunch")) return "cafe";
  if (raw.includes("elegant") || raw.includes("fine") || raw.includes("michelin")) return "elegant";
  return raw || "mediterranean";
}
