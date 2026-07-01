import {
  ArrowRight,
  CalendarDays,
  Camera,
  Mail,
  MapPin,
  Phone,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { FormEvent } from "react";

import type { RestaurantThemeIdentity } from "@/lib/restaurantTheme";
import type { MenuItem, Restaurant, RestaurantImage } from "@/lib/types";
import MenuShowcase from "./MenuShowcase";
import PremiumHomepage from "./PremiumHomepage";
import PremiumNavigation, { getRestaurantNavigationLinks } from "./PremiumNavigation";

type ImmersivePage = "home" | "menu" | "reservations" | "gallery" | "contact" | "events";

type ImmersiveRestaurantExperienceProps = {
  page: ImmersivePage;
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  heroVisual: string;
  gallery: RestaurantImage[];
  menuItems: MenuItem[];
  featuredItems: MenuItem[];
  availableItems: number;
  quantities: Record<number, number>;
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
  reservationStatus: string;
  onReserve: (event: FormEvent<HTMLFormElement>) => void;
  onAdd: (item: MenuItem) => void;
};

export default function ImmersiveRestaurantExperience(props: ImmersiveRestaurantExperienceProps) {
  const { page, restaurant, themeIdentity, gallery, heroVisual, reservationsEnabled, mobileOpen, onToggleMobile, onCloseMobile } = props;
  const visuals = [heroVisual, ...gallery.map((image) => image.url)].filter(Boolean);
  const primaryVisual = visuals[0] || "";
  const basePath = `/restaurants/${restaurant.slug}`;

  if (page === "home") {
    return (
      <PremiumHomepage
        restaurant={restaurant}
        themeIdentity={themeIdentity}
        heroVisual={primaryVisual}
        gallery={gallery}
        featuredItems={props.featuredItems}
        availableItems={props.availableItems}
        hours={props.hours}
        reservationsEnabled={props.reservationsEnabled}
        orderingEnabled={props.orderingEnabled}
        deliveryEnabled={props.deliveryEnabled}
        pickupEnabled={props.pickupEnabled}
        dineInEnabled={props.dineInEnabled}
        chatbotEnabled={props.chatbotEnabled}
        mobileOpen={props.mobileOpen}
        onToggleMobile={props.onToggleMobile}
        onCloseMobile={props.onCloseMobile}
      />
    );
  }

  return (
    <div className="cinematic-experience min-h-screen bg-[#020108] text-white">
      <PremiumNavigation
        restaurantName={restaurant.name}
        locationLabel={restaurant.city || "Restaurant experience"}
        logoUrl={restaurant.logo_url}
        homeHref={basePath}
        links={getRestaurantNavigationLinks(restaurant.slug)}
        cta={{
          label: reservationsEnabled ? "Reserve Table" : "Contact",
          href: reservationsEnabled ? `${basePath}/reservations` : `${basePath}/contact`,
        }}
        activePage={page}
        buttonClass={themeIdentity.buttonClass}
        mobileOpen={mobileOpen}
        onToggleMobile={onToggleMobile}
        onCloseMobile={onCloseMobile}
      />
      {page === "menu" && <MenuPage {...props} visual={primaryVisual} />}
      {page === "reservations" && <ReservationsPage {...props} visual={primaryVisual} />}
      {page === "gallery" && <GalleryPage {...props} visual={primaryVisual} />}
      {page === "contact" && <ContactPage {...props} visual={primaryVisual} />}
      {page === "events" && <EventsPage {...props} visual={primaryVisual} />}
      <MinimalFooter restaurant={restaurant} themeIdentity={themeIdentity} />
    </div>
  );
}

function MenuPage(props: ImmersiveRestaurantExperienceProps & { visual: string }) {
  const { restaurant, themeIdentity, featuredItems, menuItems, quantities, orderingEnabled, onAdd } = props;
  return (
    <MenuShowcase
      restaurant={restaurant}
      themeIdentity={themeIdentity}
      menuItems={menuItems}
      featuredItems={featuredItems}
      quantities={quantities}
      orderingEnabled={orderingEnabled}
      onAdd={onAdd}
      showHeroNavigation={false}
    />
  );
}

function ReservationsPage(props: ImmersiveRestaurantExperienceProps & { visual: string }) {
  const { restaurant, themeIdentity, visual, reservationsEnabled, reservationStatus, onReserve } = props;
  return (
    <>
      <PageHero restaurant={restaurant} themeIdentity={themeIdentity} visual={visual} eyebrow="Reservations" title="Reserve the table. Let the evening do the rest." copy="One focused path for table requests, timing, party size, allergies, and occasion details." />
      <section className="cinematic-chapter px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-3xl">
          {reservationsEnabled ? (
            <ReservationForm restaurant={restaurant} themeIdentity={themeIdentity} reservationStatus={reservationStatus} onReserve={onReserve} />
          ) : (
            <div className="cinematic-reservation-panel rounded-[2rem] border border-white/10 p-7">
              <CalendarDays size={24} style={{ color: themeIdentity.primary }} />
              <h2 className="mt-5 text-3xl font-semibold">Online reservations are paused.</h2>
              <p className="mt-3 text-sm leading-7 text-white/58">Please contact the restaurant directly for table requests.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function GalleryPage(props: ImmersiveRestaurantExperienceProps & { visual: string }) {
  const { restaurant, themeIdentity, visual, gallery, reservationsEnabled } = props;
  return (
    <>
      <PageHero restaurant={restaurant} themeIdentity={themeIdentity} visual={visual} eyebrow="Gallery" title="A night told through shadow, glass, heat, and silence." copy="An immersive look at the room, food, and atmosphere before you arrive." />
      <section className="cinematic-chapter px-3 py-16 sm:px-6 lg:py-24">
        <div className="cinematic-gallery mx-auto grid max-w-7xl gap-3 md:grid-cols-4">
          {gallery.length > 0 ? gallery.map((image, index) => (
            <figure key={image.id} className={`group relative overflow-hidden rounded-[1.5rem] border border-white/10 ${index === 0 || index === 5 ? "md:col-span-2 md:row-span-2" : ""}`}>
              <img src={image.url} alt={image.alt_text || restaurant.name} className={`h-80 w-full object-cover transition duration-1000 group-hover:scale-[1.04] ${index === 0 || index === 5 ? "md:h-full" : ""} ${themeIdentity.imageTreatmentClass}`} loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent opacity-70" />
              <figcaption className="sr-only">{image.alt_text || `${restaurant.name} atmosphere`}</figcaption>
            </figure>
          )) : (
            <ImmersiveGalleryEmptyState restaurant={restaurant} themeIdentity={themeIdentity} reservationsEnabled={reservationsEnabled} />
          )}
        </div>
      </section>
    </>
  );
}

function ImmersiveGalleryEmptyState({
  restaurant,
  themeIdentity,
  reservationsEnabled,
}: {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  reservationsEnabled: boolean;
}) {
  const basePath = `/restaurants/${restaurant.slug}`;
  const actions = [
    { label: "View menu", href: `${basePath}/menu`, primary: true },
    reservationsEnabled ? { label: "Reserve a table", href: `${basePath}/reservations`, primary: false } : null,
    { label: "Plan your visit", href: `${basePath}/contact`, primary: false },
  ].filter(Boolean) as Array<{ label: string; href: string; primary: boolean }>;

  return (
    <div className="col-span-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.05] p-6 shadow-2xl sm:p-8 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
        <div>
          <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-white/10" style={{ color: themeIdentity.primary }}>
            <Camera size={24} />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.26em]" style={{ color: themeIdentity.primary }}>
            Gallery being composed
          </p>
          <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.02] sm:text-6xl">
            The visual story is still being prepared.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/62">
            {restaurant.name} has not published gallery photography yet. The essentials are ready: explore the menu, request a table, or plan your visit directly with the restaurant.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {actions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${
                  action.primary
                    ? "text-white shadow-lg"
                    : "border border-white/12 bg-white/[.08] text-white"
                }`}
                style={action.primary ? { backgroundColor: themeIdentity.primary } : undefined}
              >
                {action.label}
              </a>
            ))}
          </div>
        </div>
        <div className="grid gap-3 text-sm text-white/62">
          <ImmersiveGalleryEmptySignal icon={Utensils} title="Menu first" copy="Guests can still inspect dishes, prices, dietary notes, and ordering options." />
          <ImmersiveGalleryEmptySignal icon={CalendarDays} title="Table ready" copy={reservationsEnabled ? "Reservation requests remain available while the gallery is curated." : "Contact the restaurant directly for table requests."} />
          <ImmersiveGalleryEmptySignal icon={MapPin} title="Visit details" copy="Address, hours, phone, email, and map details stay one step away." />
        </div>
      </div>
    </div>
  );
}

function ImmersiveGalleryEmptySignal({
  icon: Icon,
  title,
  copy,
}: {
  icon: LucideIcon;
  title: string;
  copy: string;
}) {
  return (
    <p className="grid grid-cols-[auto_1fr] gap-4 rounded-[1.25rem] border border-white/10 bg-white/[.05] p-4">
      <Icon size={19} className="mt-0.5 opacity-70" />
      <span>
        <b className="block text-white">{title}</b>
        <span className="mt-1 block leading-6">{copy}</span>
      </span>
    </p>
  );
}

function ContactPage(props: ImmersiveRestaurantExperienceProps & { visual: string }) {
  const { restaurant, themeIdentity, visual, hours } = props;
  const phoneHref = restaurant.phone ? `tel:${restaurant.phone.replace(/[^\d+]/g, "")}` : "";
  const emailHref = restaurant.email ? `mailto:${restaurant.email}` : "";

  return (
    <>
      <PageHero restaurant={restaurant} themeIdentity={themeIdentity} visual={visual} eyebrow="Contact" title="Plan the visit. Reach the team directly." copy="Address, opening hours, direct phone, email, map, and social links live here without reservation clutter." />
      <section className="cinematic-chapter px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <div className="cinematic-host-panel rounded-[2rem] border border-white/10 p-6 sm:p-8">
            <MapPin size={22} style={{ color: themeIdentity.primary }} />
            <p className="mt-5 text-2xl font-semibold">{restaurant.address}</p>
            <p className="mt-2 text-white/58">{restaurant.postal_code} {restaurant.city}</p>
            <p className="mt-6 text-sm leading-7 text-white/58">
              Use these details for arrival questions, same-day timing, private dining context, or anything the team should know before you arrive.
            </p>
            <div className="mt-6 grid gap-3 text-white/70">
              <p className="flex gap-3">
                <Phone size={17} className="mt-1 shrink-0" />
                {restaurant.phone ? (
                  <a href={phoneHref} className="font-semibold underline decoration-white/20 underline-offset-4 transition hover:text-white">
                    {restaurant.phone}
                  </a>
                ) : (
                  <span>Phone coming soon</span>
                )}
              </p>
              <p className="flex gap-3">
                <Mail size={17} className="mt-1 shrink-0" />
                {restaurant.email ? (
                  <a href={emailHref} className="font-semibold underline decoration-white/20 underline-offset-4 transition hover:text-white">
                    {restaurant.email}
                  </a>
                ) : (
                  <span>Email coming soon</span>
                )}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
              {restaurant.google_maps_url && <a href={restaurant.google_maps_url} target="_blank" className="min-h-11 rounded-full border border-white/10 px-4 py-3">Open map</a>}
              {restaurant.instagram_url && <a href={restaurant.instagram_url} target="_blank" className="min-h-11 rounded-full border border-white/10 px-4 py-3">Instagram</a>}
              {restaurant.facebook_url && <a href={restaurant.facebook_url} target="_blank" className="min-h-11 rounded-full border border-white/10 px-4 py-3">Facebook</a>}
              {restaurant.tiktok_url && <a href={restaurant.tiktok_url} target="_blank" className="min-h-11 rounded-full border border-white/10 px-4 py-3">TikTok</a>}
            </div>
          </div>
          <div className="cinematic-host-panel rounded-[2rem] border border-white/10 p-6 sm:p-8">
            <p className="luxury-kicker text-[10px] font-bold" style={{ color: themeIdentity.primary }}>Opening hours</p>
            <div className="mt-5 divide-y divide-white/10">
              {Object.entries(hours).map(([day, value]) => (
                <p key={day} className="flex justify-between gap-6 py-3">
                  <span className="capitalize text-white/42">{day}</span>
                  <span className="font-semibold text-white/72">{value}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function EventsPage(props: ImmersiveRestaurantExperienceProps & { visual: string }) {
  const { restaurant, themeIdentity, visual } = props;
  return (
    <>
      <PageHero restaurant={restaurant} themeIdentity={themeIdentity} visual={visual} eyebrow="Private dining" title="Special tables deserve a slower conversation." copy="For private dining, client dinners, celebrations, and tasting evenings, contact the restaurant directly." />
      <section className="cinematic-chapter px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          {["Private table", "Tasting evening", "Client dinner"].map((title) => (
            <article key={title} className="cinematic-host-panel rounded-[2rem] border border-white/10 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: themeIdentity.primary }}>{title}</p>
              <p className="mt-5 text-sm leading-7 text-white/58">Share your date, guest count, timing, allergies, and service expectations with {restaurant.name}. The team can confirm what is possible.</p>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-7xl">
          <a href={`/restaurants/${restaurant.slug}/contact`} className={`${themeIdentity.buttonClass} inline-flex min-h-12 items-center justify-center px-6 py-3 text-sm font-bold text-white`} style={{ backgroundColor: themeIdentity.primary }}>Contact the restaurant</a>
        </div>
      </section>
    </>
  );
}

function PageHero({
  restaurant,
  themeIdentity,
  visual,
  eyebrow,
  title,
  copy,
}: {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  visual: string;
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <section className="cinematic-opening relative flex min-h-[72svh] items-end overflow-hidden">
      <SceneImage src={visual} alt={restaurant.name} treatment={themeIdentity.imageTreatmentClass} priority />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,1,8,.98),rgba(2,1,8,.75)_48%,rgba(2,1,8,.42)),radial-gradient(circle_at_78%_18%,rgba(183,140,255,.18),transparent_26rem)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#020108] to-transparent" />
      <div className="cinematic-grain" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-32 sm:px-6 lg:pb-16">
        <p className="luxury-kicker text-[10px] font-bold" style={{ color: themeIdentity.primary }}>{eyebrow}</p>
        <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold leading-[0.9] sm:text-7xl lg:text-8xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-white/62 sm:text-base">{copy}</p>
      </div>
    </section>
  );
}

function ReservationForm({
  restaurant,
  themeIdentity,
  reservationStatus,
  onReserve,
}: {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  reservationStatus: string;
  onReserve: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form id="reserve" onSubmit={onReserve} className="cinematic-reservation-panel rounded-[2rem] border border-white/10 p-5 shadow-2xl sm:p-7">
      <p className="luxury-kicker text-[10px] font-bold" style={{ color: themeIdentity.primary }}>Reservations</p>
      <h2 className="mt-3 text-3xl font-semibold sm:text-5xl">Request a table</h2>
      <p className="mt-3 text-sm leading-6 text-white/56">
        {restaurant.name} confirms every request directly. Share allergies, timing, or an occasion so the team can prepare properly.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <input name="name" required aria-label="Your name" placeholder="Your name" autoComplete="name" className="cinematic-input" />
        <input name="email" type="email" required aria-label="Email" placeholder="Email" autoComplete="email" inputMode="email" className="cinematic-input" />
        <input name="phone" type="tel" aria-label="Phone" placeholder="Phone" autoComplete="tel" inputMode="tel" className="cinematic-input" />
        <input name="party_size" type="number" min="1" aria-label="Guests" inputMode="numeric" placeholder="Guests" className="cinematic-input" />
        <input name="requested_at" type="datetime-local" aria-label="Requested date and time" className="cinematic-input sm:col-span-2" />
        <textarea name="message" aria-label="Reservation message" placeholder="Allergies, occasion, preferred table, or notes" className="cinematic-input min-h-28 sm:col-span-2" />
      </div>
      <button className={`${themeIdentity.buttonClass} mt-4 min-h-12 w-full py-3.5 font-semibold text-white shadow-lg`} style={{ backgroundColor: themeIdentity.primary }}>
        Send reservation request
      </button>
      {reservationStatus && (
        <p className="mt-3 rounded-2xl border border-white/10 bg-white/[.06] p-3 text-center text-sm font-semibold text-white/76">
          {reservationStatus}
        </p>
      )}
    </form>
  );
}

function SceneImage({ src, alt, treatment, priority = false }: { src: string; alt: string; treatment: string; priority?: boolean }) {
  if (!src) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(183,140,255,.24),transparent_24rem),radial-gradient(circle_at_18%_80%,rgba(32,214,210,.12),transparent_20rem),linear-gradient(135deg,#020108,#120727_52%,#05030b)]" />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`cinematic-image-zoom absolute inset-0 h-full w-full object-cover ${treatment}`}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

function MinimalFooter({ restaurant, themeIdentity }: { restaurant: Restaurant; themeIdentity: RestaurantThemeIdentity }) {
  return (
    <footer className="border-t border-white/10 px-4 py-10 text-center text-xs uppercase tracking-[0.24em] text-white/38 sm:px-6">
      <p className="font-semibold" style={{ color: themeIdentity.primary }}>{restaurant.name}</p>
      <p className="mt-3">{restaurant.city || restaurant.address}</p>
    </footer>
  );
}
