import PageRenderer from "@/components/engine/PageRenderer";
import ThemeProvider from "@/components/engine/ThemeProvider";
import PremiumFooter from "@/components/public/restaurant/PremiumFooter";
import PremiumNavigation from "@/components/public/restaurant/PremiumNavigation";
import { BLOCK_COMPONENT_IDS } from "@/lib/engine/BlockRegistry";
import { loadRestaurantConfig } from "@/lib/engine/ConfigLoader";
import type { RestaurantThemeIdentity } from "@/lib/restaurantTheme";
import { mockRestaurantConfig } from "@/lib/schema/mockRestaurantConfig";
import type { HeroBlock, RestaurantConfig, StoryBlock } from "@/lib/schema/PlatformSchema";
import type { Restaurant, RestaurantImage } from "@/lib/types";

type EngineHomepagePreviewProps = {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  heroVisual: string;
  gallery: RestaurantImage[];
  reservationsEnabled: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
};

type EngineHomepageConfigInput = {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  heroVisual: string;
  gallery: RestaurantImage[];
  basePath: string;
};

export default function EngineHomepagePreview({
  restaurant,
  themeIdentity,
  heroVisual,
  gallery,
  reservationsEnabled,
  mobileOpen,
  onToggleMobile,
  onCloseMobile,
}: EngineHomepagePreviewProps) {
  const basePath = `/restaurants/${restaurant.slug}`;
  const config = loadRestaurantConfig(buildEngineHomepageConfig({
    restaurant,
    themeIdentity,
    heroVisual,
    gallery,
    basePath,
  }));
  const reservationCta = reservationsEnabled
    ? { label: "Reserve Table", href: `${basePath}/reservations` }
    : { label: "Contact", href: `${basePath}/contact` };

  return (
    <div data-engine-homepage className="relative min-h-screen overflow-hidden bg-[#080604] text-white">
      <ThemeProvider theme={config.theme}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,.08),transparent_26rem),radial-gradient(circle_at_82%_12%,rgba(200,75,49,.14),transparent_28rem)]" />
        <PremiumNavigation
          restaurantName={restaurant.name}
          locationLabel={restaurant.city || "Restaurant experience"}
          logoUrl={restaurant.logo_url}
          homeHref={basePath}
          links={[
            { label: "Story", href: "#story" },
            { label: "Menu", href: `${basePath}/menu` },
            { label: "Gallery", href: `${basePath}/gallery` },
            { label: "Events", href: `${basePath}/events` },
            { label: "Contact", href: `${basePath}/contact` },
          ]}
          cta={reservationCta}
          buttonClass={themeIdentity.buttonClass}
          mobileOpen={mobileOpen}
          onToggleMobile={onToggleMobile}
          onCloseMobile={onCloseMobile}
        />
        <PageRenderer page={config.pages.home} />
        <PremiumFooter
          restaurantName={restaurant.name}
          locationLabel={restaurant.city || restaurant.address}
          links={[
            { label: "Menu", href: `${basePath}/menu` },
            { label: "Reservations", href: `${basePath}/reservations` },
            { label: "Gallery", href: `${basePath}/gallery` },
            { label: "Events", href: `${basePath}/events` },
            { label: "Contact", href: `${basePath}/contact` },
          ]}
          note="Restaurant-owned experience. Direct paths to menu, table, room, and team."
          accentColor={themeIdentity.primary}
        />
      </ThemeProvider>
    </div>
  );
}

export function buildEngineHomepageConfig({
  restaurant,
  themeIdentity,
  heroVisual,
  gallery,
  basePath,
}: EngineHomepageConfigInput): RestaurantConfig {
  const heroBlock = getMockHomeHeroBlock();
  const storyBlock = getMockHomeStoryBlock();
  const imageUrl = toSchemaImageUrl(heroVisual || gallery[0]?.url, heroBlock.props.image_url);
  const storyImageUrl = toSchemaImageUrl(gallery[0]?.url || heroVisual, storyBlock.props.image_url);
  const headline = restaurant.tagline || restaurant.description || themeIdentity.personality.momentTitle;

  return {
    ...mockRestaurantConfig,
    identity: {
      ...mockRestaurantConfig.identity,
      tenant_id: `restaurant_${restaurant.id}`,
      restaurant_name: restaurant.name,
      slug: restaurant.slug,
      cuisine: "Restaurant",
      city: restaurant.city || mockRestaurantConfig.identity.city,
      address: restaurant.address || mockRestaurantConfig.identity.address,
      phone: restaurant.phone || mockRestaurantConfig.identity.phone,
      email: restaurant.email || mockRestaurantConfig.identity.email,
    },
    theme: {
      ...mockRestaurantConfig.theme,
      preset: restaurant.homepage_style || mockRestaurantConfig.theme.preset,
      colors: {
        ...mockRestaurantConfig.theme.colors,
        brand: {
          primary: restaurant.primary_color || themeIdentity.primary,
          secondary: restaurant.secondary_color || mockRestaurantConfig.theme.colors.brand.secondary,
        },
        surface: {
          default: restaurant.background_color || mockRestaurantConfig.theme.colors.surface.default,
          alt: themeIdentity.background,
        },
        text: {
          primary: restaurant.text_color || mockRestaurantConfig.theme.colors.text.primary,
          secondary: mockRestaurantConfig.theme.colors.text.secondary,
        },
      },
      typography: {
        ...mockRestaurantConfig.theme.typography,
        heading_font: restaurant.font_family || mockRestaurantConfig.theme.typography.heading_font,
      },
    },
    navigation: {
      logo_text: restaurant.name,
      links: [
        { label: "Experience", href: basePath },
        { label: "Menu", href: `${basePath}/menu` },
        { label: "Gallery", href: `${basePath}/gallery` },
        { label: "Contact", href: `${basePath}/contact` },
      ],
      primary_cta_label: "Reserve",
      primary_cta_href: `${basePath}/reservations`,
    },
    footer: {
      ...mockRestaurantConfig.footer,
      address: `${restaurant.address}, ${restaurant.postal_code} ${restaurant.city}`,
      phone: restaurant.phone || mockRestaurantConfig.footer.phone,
      email: restaurant.email || mockRestaurantConfig.footer.email,
    },
    pages: {
      ...mockRestaurantConfig.pages,
      home: {
        ...mockRestaurantConfig.pages.home,
        seo: {
          ...mockRestaurantConfig.pages.home.seo,
          title: `${restaurant.name} | ${restaurant.city || "Restaurant"}`,
          description: restaurant.description || mockRestaurantConfig.pages.home.seo.description,
          canonical: `https://restaurantai.local${basePath}`,
          og_image: imageUrl,
        },
        blocks: [
          {
            ...heroBlock,
            component_id: BLOCK_COMPONENT_IDS.platformHeroCinematic,
            props: {
              headline: restaurant.name,
              subheadline: headline,
              image_url: imageUrl,
              cta_text: "View Menu",
              cta_href: `${basePath}/menu`,
            },
          },
          {
            ...storyBlock,
            component_id: BLOCK_COMPONENT_IDS.platformStoryEditorial,
            props: {
              title: themeIdentity.personality.momentTitle,
              body_text: restaurant.story || themeIdentity.personality.momentCopy || restaurant.description,
              image_url: storyImageUrl,
              image_position: "right",
            },
          },
        ],
      },
    },
  };
}

function getMockHomeHeroBlock(): HeroBlock {
  const block = mockRestaurantConfig.pages.home.blocks.find((candidate): candidate is HeroBlock => candidate.type === "hero");

  if (!block) {
    throw new Error("mockRestaurantConfig.pages.home is missing a hero block.");
  }

  return block;
}

function getMockHomeStoryBlock(): StoryBlock {
  const block = mockRestaurantConfig.pages.home.blocks.find((candidate): candidate is StoryBlock => candidate.type === "story");

  if (!block) {
    throw new Error("mockRestaurantConfig.pages.home is missing a story block.");
  }

  return block;
}

function toSchemaImageUrl(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  try {
    return new URL(value).toString();
  } catch {
    if (value.startsWith("/")) {
      return new URL(value, "http://localhost:3000").toString();
    }

    return fallback;
  }
}
