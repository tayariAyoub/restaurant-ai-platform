import {
  ArrowRight,
  CalendarDays,
  Camera,
  ChefHat,
  Clock3,
  MapPin,
  Menu as MenuIcon,
  MessageCircle,
  Phone,
  Sparkles,
  Utensils,
  Wine,
  X,
  type LucideIcon,
} from "lucide-react";

import type { RestaurantThemeIdentity } from "@/lib/restaurantTheme";
import type { MenuItem, Restaurant, RestaurantImage } from "@/lib/types";
import { formatPrice } from "./experience";

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

export default function PremiumHomepage(props: PremiumHomepageProps) {
  const { restaurant, themeIdentity, heroVisual, gallery } = props;
  const visual = heroVisual || gallery[0]?.url || "";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080604] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,.08),transparent_26rem),radial-gradient(circle_at_82%_12%,rgba(200,75,49,.14),transparent_28rem)]" />
      <PremiumNavigation {...props} />
      <PremiumHero {...props} visual={visual} />
      <EditorialStory restaurant={restaurant} themeIdentity={themeIdentity} gallery={gallery} visual={visual} />
      <SignatureDishes restaurant={restaurant} themeIdentity={themeIdentity} featuredItems={props.featuredItems} availableItems={props.availableItems} orderingEnabled={props.orderingEnabled} />
      <AtmosphereTeaser restaurant={restaurant} themeIdentity={themeIdentity} gallery={gallery} visual={visual} />
      <EventsTeaser restaurant={restaurant} themeIdentity={themeIdentity} visual={visual} />
      <LocationTeaser restaurant={restaurant} themeIdentity={themeIdentity} hours={props.hours} />
      <PremiumHomepageFooter restaurant={restaurant} themeIdentity={themeIdentity} />
    </div>
  );
}

function PremiumNavigation({
  restaurant,
  themeIdentity,
  reservationsEnabled,
  mobileOpen,
  onToggleMobile,
  onCloseMobile,
}: PremiumHomepageProps) {
  const basePath = `/restaurants/${restaurant.slug}`;
  const links = [
    ["Story", "#story"],
    ["Menu", `${basePath}/menu`],
    ["Gallery", `${basePath}/gallery`],
    ["Events", `${basePath}/events`],
    ["Contact", `${basePath}/contact`],
  ];

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:py-7">
        <a href={basePath} aria-label={`${restaurant.name} home`} className="group flex min-w-0 items-center gap-3">
          {restaurant.logo_url ? (
            <img src={restaurant.logo_url} alt="" className="h-11 w-11 rounded-full border border-white/25 object-cover" loading="eager" decoding="async" />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
              <ChefHat size={19} />
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold uppercase text-white/85">{restaurant.name}</span>
            <span className="hidden text-xs text-white/45 sm:block">{restaurant.city || "Restaurant experience"}</span>
          </span>
        </a>
        <nav className="hidden items-center gap-1 rounded-full border border-white/12 bg-black/24 p-1 text-sm font-semibold text-white/70 shadow-2xl backdrop-blur-xl lg:flex">
          {links.map(([label, href]) => (
            <a key={label} href={href} className="rounded-full px-4 py-2.5 transition hover:bg-white/10 hover:text-white">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={reservationsEnabled ? `${basePath}/reservations` : `${basePath}/contact`}
            className={`${themeIdentity.buttonClass} hidden min-h-11 items-center justify-center bg-white px-5 py-2.5 text-sm font-bold text-[#100c08] shadow-2xl sm:inline-flex`}
          >
            {reservationsEnabled ? "Reserve Table" : "Contact"}
          </a>
          <button
            className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur lg:hidden"
            onClick={onToggleMobile}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 grid gap-2 rounded-[1.5rem] border border-white/10 bg-[#080604]/95 p-3 text-sm font-bold text-white shadow-2xl backdrop-blur-xl sm:grid-cols-3 lg:hidden">
          {links.map(([label, href]) => (
            <a key={label} href={href} onClick={onCloseMobile} className="rounded-2xl bg-white/[.08] px-4 py-3 text-center">
              {label}
            </a>
          ))}
          <a
            href={reservationsEnabled ? `${basePath}/reservations` : `${basePath}/contact`}
            onClick={onCloseMobile}
            className="rounded-2xl bg-white px-4 py-3 text-center text-[#100c08]"
          >
            {reservationsEnabled ? "Reserve Table" : "Contact"}
          </a>
        </nav>
      )}
    </header>
  );
}

function PremiumHero({
  restaurant,
  themeIdentity,
  visual,
  availableItems,
  reservationsEnabled,
  orderingEnabled,
  deliveryEnabled,
  pickupEnabled,
  dineInEnabled,
  chatbotEnabled,
}: PremiumHomepageProps & { visual: string }) {
  const basePath = `/restaurants/${restaurant.slug}`;
  const identityLine = [themeIdentity.personality.guestKicker, restaurant.city].filter(Boolean).join(" / ");
  const headline = restaurant.tagline || restaurant.description || themeIdentity.personality.momentTitle;

  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden">
      <HomepageImage src={visual} alt={restaurant.name} treatment={themeIdentity.imageTreatmentClass} priority />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,4,3,.98),rgba(8,5,3,.84)_43%,rgba(8,5,3,.26)),radial-gradient(circle_at_76%_22%,rgba(255,255,255,.13),transparent_24rem)]" />
      <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-[#080604] via-[#080604]/86 to-transparent" />
      <div className="cinematic-grain opacity-[.35]" />
      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-4 pb-9 pt-32 sm:px-6 sm:pb-14 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:pb-20">
        <div className="max-w-4xl">
          <p className="inline-flex rounded-full border border-white/14 bg-white/[.08] px-4 py-2 text-xs font-semibold text-white/68 backdrop-blur">
            {identityLine || themeIdentity.personality.guestKicker}
          </p>
          <h1 className="mt-5 text-balance text-[clamp(4rem,18vw,10rem)] font-semibold leading-[.78] text-white">
            {restaurant.name}
          </h1>
          <p className="mt-7 max-w-2xl font-display text-2xl leading-tight text-white/86 sm:text-4xl">
            {headline}
          </p>
          {restaurant.description && restaurant.description !== headline && (
            <p className="mt-5 max-w-xl text-base leading-8 text-white/66">
              {restaurant.description}
            </p>
          )}
          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <a href={`${basePath}/menu`} className={`${themeIdentity.buttonClass} inline-flex min-h-12 items-center justify-center gap-2 bg-white px-7 py-3.5 text-sm font-bold text-[#100c08] shadow-2xl`}>
              View Menu <ArrowRight size={17} />
            </a>
            <a
              href={reservationsEnabled ? `${basePath}/reservations` : `${basePath}/contact`}
              className={`${themeIdentity.buttonClass} inline-flex min-h-12 items-center justify-center border border-white/22 bg-white/[.08] px-7 py-3.5 text-sm font-bold text-white backdrop-blur`}
            >
              {reservationsEnabled ? "Reserve Table" : "Contact Restaurant"}
            </a>
          </div>
          <div className="mt-6 grid max-w-3xl grid-cols-3 divide-x divide-white/12 rounded-[1.5rem] border border-white/12 bg-black/24 text-center shadow-2xl backdrop-blur sm:mt-8">
            <HeroMetric value={availableItems || "Fresh"} label={availableItems ? "Dishes online" : "Menu"} />
            <HeroMetric value={orderingEnabled ? "Direct" : "Browse"} label={orderingEnabled ? "Ordering" : "Menu"} />
            <HeroMetric value={reservationsEnabled ? "Table" : "Contact"} label={reservationsEnabled ? "Requests" : "Details"} />
          </div>
        </div>
        <aside className="rounded-[2rem] border border-white/12 bg-white/[.07] p-5 shadow-2xl backdrop-blur-xl">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles size={17} style={{ color: themeIdentity.primary }} />
            Why guests trust this page
          </p>
          <div className="mt-5 grid gap-4">
            <TrustLine icon={Utensils} title="Menu clarity" copy={orderingEnabled ? "Guests can explore dishes and order without losing the story." : "Guests can explore dishes before choosing their next step."} />
            <TrustLine icon={CalendarDays} title="Clear next step" copy={reservationsEnabled ? "Reservation requests have their own focused path." : "Contact details are easy to reach when reservations are paused."} />
            <TrustLine icon={MessageCircle} title="AI Maitre d'" copy={chatbotEnabled ? "Menu, allergy, opening-hour, and table questions stay close to the experience." : "The digital host can be enabled when the restaurant is ready."} />
            <TrustLine icon={Clock3} title="Service modes" copy={serviceModeLabel({ deliveryEnabled, pickupEnabled, dineInEnabled })} />
          </div>
        </aside>
      </div>
    </section>
  );
}

function EditorialStory({
  restaurant,
  themeIdentity,
  gallery,
  visual,
}: {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  gallery: RestaurantImage[];
  visual: string;
}) {
  const image = gallery[0]?.url || visual;

  return (
    <section id="story" className="relative px-4 py-20 sm:px-6 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.86fr_1.14fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold" style={{ color: themeIdentity.primary }}>The experience</p>
          <h2 className="mt-5 max-w-2xl text-balance text-5xl font-semibold leading-[.92] sm:text-7xl">
            {themeIdentity.personality.momentTitle}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/62">
            {restaurant.story || themeIdentity.personality.momentCopy || restaurant.description}
          </p>
          <a href={`/restaurants/${restaurant.slug}/gallery`} className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-white/82">
            See the atmosphere <ArrowRight size={16} />
          </a>
        </div>
        <figure className="relative min-h-[62svh] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] shadow-2xl">
          <HomepageImage src={image} alt={gallery[0]?.alt_text || restaurant.name} treatment={themeIdentity.imageTreatmentClass} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/18 to-transparent" />
          <figcaption className="absolute bottom-0 left-0 max-w-md p-6 text-sm leading-7 text-white/72 sm:p-8">
            {themeIdentity.personality.description}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function SignatureDishes({
  restaurant,
  themeIdentity,
  featuredItems,
  availableItems,
  orderingEnabled,
}: {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  featuredItems: MenuItem[];
  availableItems: number;
  orderingEnabled: boolean;
}) {
  const dishes = featuredItems.slice(0, 3);

  return (
    <section id="signature-dishes" className="relative border-y border-white/10 bg-white/[.04] px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <p className="text-sm font-semibold" style={{ color: themeIdentity.primary }}>Signature dishes</p>
          <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight sm:text-6xl">
            A teaser, not the full menu.
          </h2>
          <p className="mt-5 text-base leading-8 text-white/58">
            {themeIdentity.personality.signatureCopy}
          </p>
          <a href={`/restaurants/${restaurant.slug}/menu`} className={`${themeIdentity.buttonClass} mt-8 inline-flex min-h-12 items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-bold text-[#100c08]`}>
            View Menu <ArrowRight size={16} />
          </a>
          <p className="mt-5 text-sm text-white/42">
            {availableItems || "Fresh"} {availableItems === 1 ? "dish" : "dishes"} available online.
          </p>
        </div>
        <div className="divide-y divide-white/10">
          {dishes.length > 0 ? dishes.map((item, index) => (
            <article key={item.id} className="group grid gap-5 py-6 first:pt-0 sm:grid-cols-[auto_1fr_auto] sm:items-start">
              <span className="font-display text-4xl text-white/28">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-3xl font-semibold leading-tight text-white">{item.name}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/56">{item.description || "Prepared by the kitchen tonight."}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white/56">
                  {item.is_vegetarian && <span className="rounded-full border border-white/10 px-3 py-1.5">Vegetarian</span>}
                  {item.is_vegan && <span className="rounded-full border border-white/10 px-3 py-1.5">Vegan</span>}
                  {item.is_halal && <span className="rounded-full border border-white/10 px-3 py-1.5">Halal</span>}
                  {!item.is_available && <span className="rounded-full border border-white/10 px-3 py-1.5">Sold out tonight</span>}
                </div>
              </div>
              <span className="text-lg font-bold" style={{ color: themeIdentity.primary }}>{formatPrice(item.price)}</span>
            </article>
          )) : (
            <div className="rounded-[2rem] border border-white/10 p-8 text-white/58">
              The restaurant has not published signature dishes yet.
            </div>
          )}
          {orderingEnabled && (
            <p className="pt-6 text-sm leading-7 text-white/46">
              Ordering stays on the dedicated menu page so this homepage can stay cinematic and focused.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function AtmosphereTeaser({
  restaurant,
  themeIdentity,
  gallery,
  visual,
}: {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  gallery: RestaurantImage[];
  visual: string;
}) {
  const images = [gallery[0], gallery[1], gallery[2]].filter(Boolean) as RestaurantImage[];

  return (
    <section id="atmosphere" className="px-3 py-20 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: themeIdentity.primary }}>Atmosphere</p>
            <h2 className="mt-4 max-w-3xl text-balance text-5xl font-semibold leading-[.95] sm:text-7xl">
              The room should be felt before it is found.
            </h2>
          </div>
          <a href={`/restaurants/${restaurant.slug}/gallery`} className="inline-flex items-center gap-2 text-sm font-bold text-white/72">
            Open Gallery <ArrowRight size={16} />
          </a>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {(images.length > 0 ? images : [{ id: 0, url: visual, alt_text: restaurant.name } as RestaurantImage]).map((image, index) => (
            <figure key={image.id || index} className={`relative min-h-80 overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[.04] ${index === 0 ? "md:col-span-3 md:min-h-[34rem]" : "md:col-span-2"}`}>
              <HomepageImage src={image.url} alt={image.alt_text || restaurant.name} treatment={themeIdentity.imageTreatmentClass} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/58 to-transparent" />
              <figcaption className="absolute bottom-0 left-0 p-5 text-sm text-white/64">
                {image.alt_text || `${restaurant.name} atmosphere`}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function EventsTeaser({
  restaurant,
  themeIdentity,
  visual,
}: {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  visual: string;
}) {
  return (
    <section id="events" className="relative overflow-hidden px-4 py-20 sm:px-6 lg:py-32">
      <HomepageImage src={visual} alt={`${restaurant.name} private dining`} treatment={themeIdentity.imageTreatmentClass} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,6,4,.96),rgba(8,6,4,.76)_48%,rgba(8,6,4,.34)),radial-gradient(circle_at_82%_28%,rgba(255,255,255,.1),transparent_26rem)]" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <p className="text-sm font-semibold" style={{ color: themeIdentity.primary }}>Private dining</p>
        <h2 className="mt-5 max-w-3xl text-balance text-5xl font-semibold leading-[.92] sm:text-7xl">
          Some evenings need more than a table.
        </h2>
        <p className="mt-6 max-w-xl text-base leading-8 text-white/64">
          Birthdays, client dinners, tasting nights, and private requests deserve a slower conversation with the team.
        </p>
        <a href={`/restaurants/${restaurant.slug}/events`} className={`${themeIdentity.buttonClass} mt-8 inline-flex min-h-12 items-center justify-center gap-2 border border-white/20 bg-white/[.08] px-6 py-3 text-sm font-bold text-white backdrop-blur`}>
          Explore Events <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}

function LocationTeaser({
  restaurant,
  themeIdentity,
  hours,
}: {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  hours: Record<string, string>;
}) {
  const firstHours = Object.entries(hours)[0];

  return (
    <section id="location" className="px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 rounded-[2rem] border border-white/10 bg-white/[.05] p-6 shadow-2xl backdrop-blur sm:p-8 lg:grid-cols-[.95fr_1.05fr] lg:p-10">
        <div>
          <p className="text-sm font-semibold" style={{ color: themeIdentity.primary }}>Location</p>
          <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight sm:text-6xl">
            Find the table. Keep the details close.
          </h2>
          <p className="mt-5 text-base leading-8 text-white/58">
            This is only a contact teaser. Full address, opening hours, map, phone, email, and social links stay on the contact page.
          </p>
          <a href={`/restaurants/${restaurant.slug}/contact`} className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-white/82">
            Open Contact <ArrowRight size={16} />
          </a>
        </div>
        <div className="grid gap-4">
          <DetailLine icon={MapPin} title="Address" copy={`${restaurant.address}, ${restaurant.postal_code} ${restaurant.city}`} color={themeIdentity.primary} />
          <DetailLine icon={Phone} title="Phone" copy={restaurant.phone || "Phone coming soon"} color={themeIdentity.primary} />
          <DetailLine icon={Clock3} title={firstHours ? firstHours[0] : "Hours"} copy={firstHours ? firstHours[1] : "Opening hours available on the contact page"} color={themeIdentity.primary} />
          {restaurant.google_maps_url && (
            <a href={restaurant.google_maps_url} target="_blank" className={`${themeIdentity.buttonClass} inline-flex min-h-12 items-center justify-center bg-white px-5 py-3 text-sm font-bold text-[#100c08]`}>
              Open Map
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function PremiumHomepageFooter({
  restaurant,
  themeIdentity,
}: {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
}) {
  const basePath = `/restaurants/${restaurant.slug}`;
  return (
    <footer className="border-t border-white/10 px-4 py-12 text-center sm:px-6">
      <p className="font-display text-4xl font-semibold">{restaurant.name}</p>
      <p className="mt-3 text-sm text-white/44">{restaurant.city || restaurant.address}</p>
      <nav className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2 text-sm font-semibold text-white/62">
        {[
          ["Menu", `${basePath}/menu`],
          ["Reservations", `${basePath}/reservations`],
          ["Gallery", `${basePath}/gallery`],
          ["Events", `${basePath}/events`],
          ["Contact", `${basePath}/contact`],
        ].map(([label, href]) => (
          <a key={label} href={href} className="rounded-full border border-white/10 px-4 py-2.5 hover:text-white">
            {label}
          </a>
        ))}
      </nav>
      <p className="mt-8 text-xs text-white/32" style={{ color: themeIdentity.primary }}>
        Restaurant-owned experience. Direct paths to menu, table, room, and team.
      </p>
    </footer>
  );
}

function HeroMetric({ value, label }: { value: string | number; label: string }) {
  return (
    <span className="px-3 py-4">
      <span className="block font-display text-2xl font-semibold text-white">{value}</span>
      <span className="mt-1 block text-xs text-white/45">{label}</span>
    </span>
  );
}

function TrustLine({ icon: Icon, title, copy }: { icon: LucideIcon; title: string; copy: string }) {
  return (
    <p className="grid grid-cols-[auto_1fr] gap-3 text-sm leading-6 text-white/62">
      <Icon size={18} className="mt-0.5 text-white/72" />
      <span>
        <b className="block text-white">{title}</b>
        {copy}
      </span>
    </p>
  );
}

function DetailLine({ icon: Icon, title, copy, color }: { icon: LucideIcon; title: string; copy: string; color: string }) {
  return (
    <p className="grid grid-cols-[auto_1fr] gap-4 rounded-[1.4rem] border border-white/10 bg-black/[.18] p-4">
      <Icon size={20} style={{ color }} />
      <span>
        <span className="block text-sm font-bold text-white">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-white/55">{copy}</span>
      </span>
    </p>
  );
}

function HomepageImage({ src, alt, treatment, priority = false }: { src: string; alt: string; treatment: string; priority?: boolean }) {
  if (!src) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(200,75,49,.18),transparent_24rem),radial-gradient(circle_at_18%_82%,rgba(198,161,91,.14),transparent_22rem),linear-gradient(135deg,#070403,#1c130e_48%,#080604)]" />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`absolute inset-0 h-full w-full object-cover ${treatment}`}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
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
