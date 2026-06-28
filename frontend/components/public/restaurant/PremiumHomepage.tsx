import { CalendarDays, Clock3, MapPin, MessageCircle, Phone, Utensils } from "lucide-react";

import type { RestaurantThemeIdentity } from "@/lib/restaurantTheme";
import type { MenuItem, Restaurant, RestaurantImage } from "@/lib/types";
import EditorialStory from "./EditorialStory";
import EventsTeaser from "./EventsTeaser";
import { formatPrice } from "./experience";
import GalleryTeaser from "./GalleryTeaser";
import type { GalleryTeaserImage } from "./GalleryTeaser";
import LocationTeaser from "./LocationTeaser";
import PremiumFooter from "./PremiumFooter";
import PremiumHero from "./PremiumHero";
import PremiumNavigation from "./PremiumNavigation";
import SignatureDishes from "./SignatureDishes";
import type { SignatureDish } from "./SignatureDishes";

type PremiumHomepageProps = {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  heroVisual: string;
  gallery: RestaurantImage[];
  featuredItems: MenuItem[];
  availableItems: number;
  hours: Record<string, string>;
  reservationsEnabled: boolean;
  orderingEnabled: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  dineInEnabled: boolean;
  chatbotEnabled: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
};

export default function PremiumHomepage({
  restaurant,
  themeIdentity,
  heroVisual,
  gallery,
  featuredItems,
  availableItems,
  hours,
  reservationsEnabled,
  orderingEnabled,
  deliveryEnabled,
  pickupEnabled,
  dineInEnabled,
  chatbotEnabled,
  mobileOpen,
  onToggleMobile,
  onCloseMobile,
}: PremiumHomepageProps) {
  const basePath = `/restaurants/${restaurant.slug}`;
  const visual = heroVisual || gallery[0]?.url || "";
  const reservationCta = reservationsEnabled
    ? { label: "Reserve Table", href: `${basePath}/reservations` }
    : { label: "Contact", href: `${basePath}/contact` };
  const identityLine = [themeIdentity.personality.guestKicker, restaurant.city].filter(Boolean).join(" / ");
  const headline = restaurant.tagline || restaurant.description || themeIdentity.personality.momentTitle;
  const storyImage = gallery[0]?.url || visual;
  const firstHours = Object.entries(hours)[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080604] text-white">
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
      <PremiumHero
        restaurantName={restaurant.name}
        eyebrow={identityLine || themeIdentity.personality.guestKicker}
        headline={headline}
        description={restaurant.description}
        image={visual}
        imageAlt={restaurant.name}
        imageTreatment={themeIdentity.imageTreatmentClass}
        primaryCta={{ label: "View Menu", href: `${basePath}/menu` }}
        secondaryCta={reservationsEnabled ? { label: "Reserve Table", href: `${basePath}/reservations` } : { label: "Contact Restaurant", href: `${basePath}/contact` }}
        buttonClass={themeIdentity.buttonClass}
        accentColor={themeIdentity.primary}
        trustTitle="Why guests trust this page"
        metrics={[
          { value: availableItems || "Fresh", label: availableItems ? "Dishes online" : "Menu" },
          { value: orderingEnabled ? "Direct" : "Browse", label: orderingEnabled ? "Ordering" : "Menu" },
          { value: reservationsEnabled ? "Table" : "Contact", label: reservationsEnabled ? "Requests" : "Details" },
        ]}
        trustLines={[
          {
            icon: Utensils,
            title: "Menu clarity",
            copy: orderingEnabled ? "Guests can explore dishes and order without losing the story." : "Guests can explore dishes before choosing their next step.",
          },
          {
            icon: CalendarDays,
            title: "Clear next step",
            copy: reservationsEnabled ? "Reservation requests have their own focused path." : "Contact details are easy to reach when reservations are paused.",
          },
          {
            icon: MessageCircle,
            title: "AI Maitre d'",
            copy: chatbotEnabled ? "Menu, allergy, opening-hour, and table questions stay close to the experience." : "The digital host can be enabled when the restaurant is ready.",
          },
          {
            icon: Clock3,
            title: "Service modes",
            copy: serviceModeLabel({ deliveryEnabled, pickupEnabled, dineInEnabled }),
          },
        ]}
      />
      <EditorialStory
        kicker="The experience"
        title={themeIdentity.personality.momentTitle}
        body={restaurant.story || themeIdentity.personality.momentCopy || restaurant.description}
        image={storyImage}
        imageAlt={gallery[0]?.alt_text || restaurant.name}
        imageTreatment={themeIdentity.imageTreatmentClass}
        caption={themeIdentity.personality.description}
        cta={{ label: "See the atmosphere", href: `${basePath}/gallery` }}
        accentColor={themeIdentity.primary}
      />
      <SignatureDishes
        kicker="Signature dishes"
        title="A teaser, not the full menu."
        description={themeIdentity.personality.signatureCopy}
        dishes={buildSignatureDishes(featuredItems)}
        cta={{ label: "View Menu", href: `${basePath}/menu` }}
        availabilityLabel={`${availableItems || "Fresh"} ${availableItems === 1 ? "dish" : "dishes"} available online.`}
        orderingNote={orderingEnabled ? "Ordering stays on the dedicated menu page so this homepage can stay cinematic and focused." : undefined}
        buttonClass={themeIdentity.buttonClass}
        accentColor={themeIdentity.primary}
      />
      <GalleryTeaser
        kicker="Atmosphere"
        title="The room should be felt before it is found."
        cta={{ label: "Open Gallery", href: `${basePath}/gallery` }}
        images={buildGalleryTeaserImages({ gallery, visual, restaurantName: restaurant.name })}
        imageTreatment={themeIdentity.imageTreatmentClass}
        accentColor={themeIdentity.primary}
      />
      <EventsTeaser
        kicker="Private dining"
        title="Some evenings need more than a table."
        description="Birthdays, client dinners, tasting nights, and private requests deserve a slower conversation with the team."
        image={visual}
        imageAlt={`${restaurant.name} private dining`}
        imageTreatment={themeIdentity.imageTreatmentClass}
        cta={{ label: "Explore Events", href: `${basePath}/events` }}
        buttonClass={themeIdentity.buttonClass}
        accentColor={themeIdentity.primary}
      />
      <LocationTeaser
        kicker="Location"
        title="Find the table. Keep the details close."
        description="This is only a contact teaser. Full address, opening hours, map, phone, email, and social links stay on the contact page."
        cta={{ label: "Open Contact", href: `${basePath}/contact` }}
        details={[
          { icon: MapPin, title: "Address", copy: `${restaurant.address}, ${restaurant.postal_code} ${restaurant.city}` },
          { icon: Phone, title: "Phone", copy: restaurant.phone || "Phone coming soon" },
          { icon: Clock3, title: firstHours ? firstHours[0] : "Hours", copy: firstHours ? firstHours[1] : "Opening hours available on the contact page" },
        ]}
        mapCta={restaurant.google_maps_url ? { label: "Open Map", href: restaurant.google_maps_url } : undefined}
        buttonClass={themeIdentity.buttonClass}
        accentColor={themeIdentity.primary}
      />
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
    </div>
  );
}

function buildSignatureDishes(featuredItems: MenuItem[]): SignatureDish[] {
  return featuredItems.slice(0, 3).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description || "Prepared by the kitchen tonight.",
    price: formatPrice(item.price),
    tags: [
      item.is_vegetarian && "Vegetarian",
      item.is_vegan && "Vegan",
      item.is_halal && "Halal",
      !item.is_available && "Sold out tonight",
    ].filter(Boolean) as string[],
  }));
}

function buildGalleryTeaserImages({
  gallery,
  visual,
  restaurantName,
}: {
  gallery: RestaurantImage[];
  visual: string;
  restaurantName: string;
}): GalleryTeaserImage[] {
  const images = [gallery[0], gallery[1], gallery[2]].filter(Boolean) as RestaurantImage[];

  if (images.length === 0) {
    return [{
      id: "fallback",
      src: visual,
      alt: restaurantName,
      caption: `${restaurantName} atmosphere`,
    }];
  }

  return images.map((image, index) => ({
    id: image.id || index,
    src: image.url,
    alt: image.alt_text || restaurantName,
    caption: image.alt_text || `${restaurantName} atmosphere`,
  }));
}

function serviceModeLabel({
  deliveryEnabled,
  pickupEnabled,
  dineInEnabled,
}: {
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  dineInEnabled: boolean;
}) {
  const modes = [
    dineInEnabled && "dine-in",
    pickupEnabled && "pickup",
    deliveryEnabled && "delivery",
  ].filter(Boolean);
  return modes.length > 0 ? `Available for ${modes.join(", ")}` : "Service details available from the restaurant";
}
