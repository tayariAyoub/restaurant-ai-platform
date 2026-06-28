import type { Restaurant } from "./types";

type ThemePersonality = {
  name: string;
  guestKicker: string;
  description: string;
  momentTitle: string;
  momentCopy: string;
  signatureCopy: string;
};

type ThemeExperience = {
  kicker: string;
  title: string;
  copy: string;
  sensoryTitle: string;
  sensoryCopy: string;
  aiTitle: string;
  aiCopy: string;
  eventsTitle: string;
  eventsCopy: string;
  ctaTitle: string;
  ctaCopy: string;
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
  heroImageClass: string;
  imageTreatmentClass: string;
  trustPanelClass: string;
  personality: ThemePersonality;
  experience?: ThemeExperience;
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
    name: "Fine Dining Gold",
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
    heroImageClass: "saturate-[.92] contrast-110",
    imageTreatmentClass: "saturate-[.92] contrast-110",
    trustPanelClass: "bg-[#11110f] text-white",
    personality: {
      name: "Fine Dining Gold",
      guestKicker: "Quiet luxury",
      description: "A composed fine-dining mood built around soft light, precise choices, and a dining room that feels intentionally calm.",
      momentTitle: "A room designed around anticipation.",
      momentCopy: "Before the first plate arrives, the evening already has a rhythm: soft light, clear choices, and a sense that the kitchen is ready for you.",
      signatureCopy: "Begin with the dishes the kitchen would proudly place at the center of the table.",
    },
  },
  "ultraviolet-luxury": {
    key: "ultraviolet-luxury",
    name: "Ultraviolet Luxury",
    fallbackPrimary: "#b78cff",
    fallbackSecondary: "#20d6d2",
    fallbackBackground: "#05030b",
    fallbackText: "#f7f2ff",
    fallbackFont: "Cormorant Garamond",
    buttonStyle: "pill",
    homepageStyle: "immersive",
    menuStyle: "refined",
    galleryStyle: "masonry",
    heroOverlay:
      "radial-gradient(circle at 74% 18%, rgba(183,140,255,.26), transparent 24rem), radial-gradient(circle at 20% 70%, rgba(32,214,210,.16), transparent 20rem), linear-gradient(90deg, rgba(3,2,9,.98), rgba(10,5,24,.82) 42%, rgba(10,5,24,.34))",
    heroFallback:
      "radial-gradient(circle at 70% 18%, rgba(183,140,255,.28), transparent 23rem), radial-gradient(circle at 18% 80%, rgba(32,214,210,.18), transparent 20rem), linear-gradient(135deg, #020108, #120727 52%, #05030b)",
    shellBackground:
      "radial-gradient(circle at 14% 2%, rgba(183,140,255,.16), transparent 25rem), radial-gradient(circle at 90% 9%, rgba(32,214,210,.11), transparent 24rem), radial-gradient(circle at 50% 52%, rgba(103,58,183,.12), transparent 34rem), linear-gradient(180deg, #020108 0%, #05030b 42%, #0d0718 100%)",
    signaturePanelClass: "ultraviolet-panel text-white",
    menuCardClass: "ultraviolet-menu-card text-white",
    galleryClass: "ultraviolet-gallery md:grid-cols-4",
    heroImageClass: "saturate-[.76] contrast-125 brightness-[.74]",
    imageTreatmentClass: "saturate-[.78] contrast-125 brightness-[.78]",
    trustPanelClass: "ultraviolet-panel text-white",
    personality: {
      name: "Ultraviolet Luxury",
      guestKicker: "Immersive nocturne",
      description:
        "A dark, cinematic fine-dining mood built for restaurants that want the website to feel like the beginning of the evening.",
      momentTitle: "A room where light, aroma, and timing become part of the menu.",
      momentCopy:
        "Guests are invited into a slower, more emotional rhythm: dramatic visuals, precise choices, and service that feels composed before they arrive.",
      signatureCopy:
        "Begin with the dishes that deserve the spotlight, then let the evening unfold course by course.",
    },
    experience: {
      kicker: "Immersive fine dining",
      title: "A cinematic evening, staged around taste.",
      copy:
        "This theme turns the public website into a dark, atmospheric invitation: fewer distractions, stronger appetite cues, and a sense that the table is part of a larger experience.",
      sensoryTitle: "Light, aroma, texture, and silence.",
      sensoryCopy:
        "Use the restaurant story, menu highlights, room photography, and direct reservation flow to make the guest feel the night before they book it.",
      aiTitle: "AI Maitre d'",
      aiCopy:
        "Guests can ask about dishes, allergens, opening hours, reservations, and ordering while staying grounded in the restaurant's real information.",
      eventsTitle: "Private evenings and special tables",
      eventsCopy:
        "For birthdays, client dinners, tasting nights, or private requests, guests are guided to contact the restaurant directly for what is possible.",
      ctaTitle: "Reserve the night before it disappears.",
      ctaCopy:
        "Keep the path from desire to action clear: view the menu, request a table, or contact the team for special arrangements.",
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
    heroImageClass: "saturate-110",
    imageTreatmentClass: "saturate-110 brightness-[1.02]",
    trustPanelClass: "bg-[#30271f] text-white",
    personality: {
      name: "Modern Cafe",
      guestKicker: "Cozy all-day table",
      description: "Warm, bright, and approachable for cafes, brunch rooms, bakeries, and all-day neighborhood spots.",
      momentTitle: "An easy room for regulars and first visits.",
      momentCopy: "The experience feels relaxed and useful: clear menus, friendly choices, and ordering that never feels heavy.",
      signatureCopy: "Choose something comforting, something fresh, and something worth coming back for.",
    },
  },
  "italian-warm": {
    key: "italian-warm",
    name: "Italian Luxury",
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
    heroImageClass: "saturate-125 contrast-105",
    imageTreatmentClass: "saturate-125 contrast-105",
    trustPanelClass: "bg-[#171511] text-white",
    personality: {
      name: "Italian Luxury",
      guestKicker: "Italian warmth",
      description: "Generous, ingredient-led hospitality for restaurants built on family, fire, wine, and memory.",
      momentTitle: "An evening that begins with the table.",
      momentCopy: "Comfort, aroma, and hospitality lead the experience, with dishes presented as familiar rituals rather than simple products.",
      signatureCopy: "Start with the plates that smell of the oven, the garden, and a table meant to be shared.",
    },
  },
  mediterranean: {
    key: "mediterranean",
    name: "Mediterranean Fresh",
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
    heroImageClass: "saturate-115 contrast-105",
    imageTreatmentClass: "saturate-115 contrast-105",
    trustPanelClass: "bg-[#171511] text-white",
    personality: {
      name: "Mediterranean Fresh",
      guestKicker: "Sunlit table",
      description: "Sunlit, relaxed, produce-forward hospitality for restaurants that want warmth without losing polish.",
      momentTitle: "Bright plates, generous tables, easy decisions.",
      momentCopy: "The guest journey feels open and inviting, with seasonal dishes, direct ordering, and reservations gathered into one elegant flow.",
      signatureCopy: "Start with colorful plates, seasonal produce, and the dishes guests naturally share.",
    },
  },
  japanese: {
    key: "japanese",
    name: "Japanese Minimal",
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
    heroImageClass: "grayscale contrast-125",
    imageTreatmentClass: "grayscale-[.35] contrast-110",
    trustPanelClass: "bg-black text-white",
    personality: {
      name: "Japanese Minimal",
      guestKicker: "Japanese minimal",
      description: "Disciplined pacing, quiet detail, and trust in the chef's sequence for restaurants centered on craft.",
      momentTitle: "Let the evening unfold one course at a time.",
      momentCopy: "The menu feels precise and calm, helping guests move from craving to choice without noise.",
      signatureCopy: "Begin with clean, exact flavors and a sequence that respects appetite, timing, and balance.",
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
    heroImageClass: "saturate-125 brightness-[1.04]",
    imageTreatmentClass: "saturate-125 brightness-[1.04]",
    trustPanelClass: "bg-[#1f2a1b] text-white",
    personality: {
      name: "Vegan Natural",
      guestKicker: "Fresh and plant-led",
      description: "Seasonal, ingredient-led, calm, and natural for plant-forward restaurants and produce-driven kitchens.",
      momentTitle: "Seasonality, freshness, and a grounded table.",
      momentCopy: "The site feels clean and alive, making dietary clarity and ingredient stories part of the premium experience.",
      signatureCopy: "Start with vivid, produce-led dishes that feel fresh, nourishing, and full of texture.",
    },
  },
  "steakhouse-dark": {
    key: "steakhouse-dark",
    name: "Steakhouse Dark",
    fallbackPrimary: "#b86b35",
    fallbackSecondary: "#8a1f1d",
    fallbackBackground: "#120d0a",
    fallbackText: "#f7efe5",
    fallbackFont: "Cormorant Garamond",
    buttonStyle: "bold",
    homepageStyle: "nocturne",
    menuStyle: "refined",
    galleryStyle: "masonry",
    heroOverlay: "linear-gradient(90deg, rgba(10,7,5,.96), rgba(36,20,12,.74) 48%, rgba(80,34,18,.18))",
    heroFallback: "linear-gradient(135deg, #070504, #351b10 50%, #120d0a)",
    shellBackground:
      "radial-gradient(circle at 12% 0%, rgba(184,107,53,.16), transparent 24rem), radial-gradient(circle at 84% 8%, rgba(138,31,29,.12), transparent 24rem), linear-gradient(180deg, rgba(18,13,10,.98), rgba(36,24,18,.92) 34%, rgba(250,245,237,1) 72%)",
    signaturePanelClass: "bg-[#120d0a] text-white",
    menuCardClass: "luxury-steakhouse-card",
    galleryClass: "md:grid-cols-4",
    heroImageClass: "saturate-[.85] contrast-125 brightness-[.9]",
    imageTreatmentClass: "saturate-[.9] contrast-125 brightness-[.92]",
    trustPanelClass: "bg-[#120d0a] text-white",
    personality: {
      name: "Steakhouse Dark",
      guestKicker: "Fire and cellar",
      description: "A nocturne of flame, aged beef, cellar depth, and polished service for restaurants built around richness and ritual.",
      momentTitle: "A darker room, a hotter grill, a slower evening.",
      momentCopy: "The experience is confident and intimate: clear cuts, bold pairings, low light, and a table that feels reserved for a proper night out.",
      signatureCopy: "Begin with the plates that deserve a sharp knife, a warm side, and a glass with structure.",
    },
  },
};

export const premiumThemeKeys = ["ultraviolet-luxury", "elegant", "italian-warm", "japanese", "steakhouse-dark", "cafe", "vegan-natural"];

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
  const raw = normalizeText(restaurant.theme?.key || restaurant.theme?.name || "");
  const haystack = normalizeText(`${raw} ${restaurant.name} ${restaurant.description} ${restaurant.story}`);
  if (raw.includes("ultraviolet") || raw.includes("violet") || raw.includes("cinematic") || raw.includes("immersive")) return "ultraviolet-luxury";
  if (raw.includes("italian") || raw.includes("mediterranean") || haystack.includes("pizza") || haystack.includes("pasta")) return "italian-warm";
  if (raw.includes("japanese") || raw.includes("sushi") || raw.includes("minimal")) return "japanese";
  if (raw.includes("steak") || raw.includes("grill") || haystack.includes("steak") || haystack.includes("beef")) return "steakhouse-dark";
  if (raw.includes("vegan") || raw.includes("natural") || haystack.includes("vegan") || haystack.includes("plant")) return "vegan-natural";
  if (raw.includes("cafe") || raw.includes("coffee") || raw.includes("brunch")) return "cafe";
  if (raw.includes("elegant") || raw.includes("fine") || raw.includes("michelin")) return "elegant";
  return raw || "mediterranean";
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
