import { RestaurantConfigSchema, type RestaurantConfig } from "./PlatformSchema";

const openingHours = {
  monday: "Closed",
  tuesday: "18:00-23:00",
  wednesday: "18:00-23:00",
  thursday: "18:00-23:00",
  friday: "18:00-00:00",
  saturday: "17:30-00:00",
  sunday: "17:30-22:30",
};

const socialLinks = {
  instagram: "https://instagram.example.com/napoli-antica",
  facebook: "https://facebook.example.com/napoli-antica",
};

const defaultBlockSettings = {
  spacing: "section-xl",
  visibility: "visible",
  background: "dark-warm",
  animation: "fade-up",
} as const;

const defaultAiMetadata = {
  editable: true,
  generated: false,
  prompt: "",
};

export const mockRestaurantConfig: RestaurantConfig = RestaurantConfigSchema.parse({
  schema_version: "1.0.0",
  identity: {
    tenant_id: "tenant_napoli_antica",
    restaurant_name: "Napoli Antica",
    slug: "napoli-antica",
    cuisine: "Italian",
    city: "Aachen",
    country: "Germany",
    address: "Theaterplatz 12, 52062 Aachen",
    phone: "+49 241 123456",
    email: "ciao@napoli-antica.example",
    opening_hours: openingHours,
    social_links: socialLinks,
  },
  domain: "https://napoli-antica.example.com",
  theme: {
    preset: "italian-warm",
    colors: {
      brand: {
        primary: "#a6422b",
        secondary: "#d8a85f",
      },
      surface: {
        default: "#fff8ef",
        alt: "#201512",
      },
      text: {
        primary: "#201512",
        secondary: "#6f5c50",
      },
      status: {
        success: "#2f7d4f",
        warning: "#b9781d",
        error: "#b83232",
      },
    },
    typography: {
      heading_font: "Cormorant Garamond",
      body_font: "Inter",
    },
    geometry: {
      radius_button: "999px",
      radius_card: "24px",
      section_spacing: "96px",
    },
  },
  navigation: {
    logo_text: "Napoli Antica",
    links: [
      { label: "Experience", href: "/restaurants/napoli-antica" },
      { label: "Menu", href: "/restaurants/napoli-antica/menu" },
      { label: "Gallery", href: "/restaurants/napoli-antica/gallery" },
      { label: "Contact", href: "/restaurants/napoli-antica/contact" },
    ],
    primary_cta_label: "Reserve",
    primary_cta_href: "/restaurants/napoli-antica/reservations",
  },
  footer: {
    address: "Theaterplatz 12, 52062 Aachen",
    phone: "+49 241 123456",
    email: "ciao@napoli-antica.example",
    opening_hours: openingHours,
    social_links: socialLinks,
  },
  pages: {
    home: {
      layout: "cinematic-home",
      seo: {
        title: "Napoli Antica | Italian Restaurant in Aachen",
        description: "A warm Italian dining experience in Aachen with handmade pasta, wood-fired dishes, and elegant hospitality.",
        canonical: "https://napoli-antica.example.com/restaurants/napoli-antica",
        og_image: "https://images.example.com/napoli-antica/hero.jpg",
        robots: "index,follow",
        locale: "en_US",
      },
      blocks: [
        {
          id: "home-hero",
          component_id: "platform.hero.cinematic",
          type: "hero",
          variant: "default",
          enabled: true,
          order: 0,
          settings: defaultBlockSettings,
          ai: defaultAiMetadata,
          props: {
            headline: "An evening shaped by fire, pasta, and southern Italian warmth.",
            subheadline: "Napoli Antica brings slow dining, seasonal ingredients, and elegant hospitality to the heart of Aachen.",
            image_url: "https://images.example.com/napoli-antica/hero.jpg",
            cta_text: "Reserve tonight",
            cta_href: "/restaurants/napoli-antica/reservations",
          },
        },
        {
          id: "home-story",
          component_id: "platform.story.editorial",
          type: "story",
          variant: "editorial",
          enabled: true,
          order: 1,
          settings: defaultBlockSettings,
          ai: defaultAiMetadata,
          props: {
            title: "A table that feels like Naples after sunset.",
            body_text: "The room is intimate, the service is calm, and every course is built around handmade craft.",
            image_url: "https://images.example.com/napoli-antica/story.jpg",
            image_position: "right",
          },
        },
      ],
    },
    menu: {
      layout: "menu-experience",
      seo: {
        title: "Napoli Antica Menu | Handmade Italian Food in Aachen",
        description: "Explore the Napoli Antica menu with pasta, antipasti, wood-fired specialties, and seasonal Italian dishes.",
        canonical: "https://napoli-antica.example.com/restaurants/napoli-antica/menu",
        og_image: "https://images.example.com/napoli-antica/menu.jpg",
        robots: "index,follow",
        locale: "en_US",
      },
      blocks: [
        {
          id: "menu-hero",
          component_id: "platform.hero.menu",
          type: "hero",
          variant: "menu",
          enabled: true,
          order: 0,
          settings: defaultBlockSettings,
          ai: defaultAiMetadata,
          props: {
            headline: "A menu guided by handmade pasta and wood fire.",
            subheadline: "Browse signature dishes, dietary notes, and seasonal recommendations before ordering or reserving.",
            image_url: "https://images.example.com/napoli-antica/menu.jpg",
            cta_text: "Order from the menu",
            cta_href: "/restaurants/napoli-antica/menu",
          },
        },
      ],
    },
    reservations: {
      layout: "reservation-focused",
      seo: {
        title: "Reserve at Napoli Antica | Italian Restaurant in Aachen",
        description: "Request a table at Napoli Antica in Aachen for dinner, celebrations, and warm Italian hospitality.",
        canonical: "https://napoli-antica.example.com/restaurants/napoli-antica/reservations",
        og_image: "https://images.example.com/napoli-antica/reservations.jpg",
        robots: "index,follow",
        locale: "en_US",
      },
      blocks: [
        {
          id: "reservations-hero",
          component_id: "platform.hero.reservations",
          type: "hero",
          variant: "reservation",
          enabled: true,
          order: 0,
          settings: defaultBlockSettings,
          ai: defaultAiMetadata,
          props: {
            headline: "Reserve a quiet table for the evening.",
            subheadline: "Share your preferred time, party size, and occasion so the team can prepare the right welcome.",
            image_url: "https://images.example.com/napoli-antica/reservations.jpg",
            cta_text: "Request a table",
            cta_href: "/restaurants/napoli-antica/reservations",
          },
        },
      ],
    },
    gallery: {
      layout: "immersive-gallery",
      seo: {
        title: "Napoli Antica Gallery | Food and Atmosphere",
        description: "Step inside Napoli Antica through food, dining room, wine, and kitchen photography.",
        canonical: "https://napoli-antica.example.com/restaurants/napoli-antica/gallery",
        og_image: "https://images.example.com/napoli-antica/gallery.jpg",
        robots: "index,follow",
        locale: "en_US",
      },
      blocks: [
        {
          id: "gallery-story",
          component_id: "platform.story.gallery",
          type: "story",
          variant: "gallery-intro",
          enabled: true,
          order: 0,
          settings: defaultBlockSettings,
          ai: defaultAiMetadata,
          props: {
            title: "The glow of the room before the first plate arrives.",
            body_text: "Warm light, stone, linen, and open kitchen details create the visual language of Napoli Antica.",
            image_url: "https://images.example.com/napoli-antica/gallery.jpg",
            image_position: "left",
          },
        },
      ],
    },
    contact: {
      layout: "contact-practical",
      seo: {
        title: "Contact Napoli Antica | Address and Opening Hours",
        description: "Find Napoli Antica's address, opening hours, phone, email, map, and social channels in Aachen.",
        canonical: "https://napoli-antica.example.com/restaurants/napoli-antica/contact",
        og_image: "https://images.example.com/napoli-antica/contact.jpg",
        robots: "index,follow",
        locale: "en_US",
      },
      blocks: [
        {
          id: "contact-story",
          component_id: "platform.story.contact",
          type: "story",
          variant: "contact",
          enabled: true,
          order: 0,
          settings: defaultBlockSettings,
          ai: defaultAiMetadata,
          props: {
            title: "Find us near Theaterplatz.",
            body_text: "Call, write, or follow Napoli Antica for opening updates, private requests, and table questions.",
            image_url: "https://images.example.com/napoli-antica/contact.jpg",
            image_position: "right",
          },
        },
      ],
    },
  },
});
