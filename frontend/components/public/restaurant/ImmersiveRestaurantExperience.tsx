import {
  ArrowRight,
  Bot,
  CalendarDays,
  ChefHat,
  MapPin,
  Phone,
} from "lucide-react";
import type { FormEvent } from "react";

import type { RestaurantThemeIdentity } from "@/lib/restaurantTheme";
import type { MenuItem, Restaurant, RestaurantImage } from "@/lib/types";
import MenuShowcase from "./MenuShowcase";
import { formatPrice } from "./experience";

type ImmersiveRestaurantExperienceProps = {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  heroVisual: string;
  gallery: RestaurantImage[];
  menuItems: MenuItem[];
  featuredItems: MenuItem[];
  quantities: Record<number, number>;
  hours: Record<string, string>;
  reservationsEnabled: boolean;
  orderingEnabled: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  dineInEnabled: boolean;
  chatbotEnabled: boolean;
  reservationStatus: string;
  onReserve: (event: FormEvent<HTMLFormElement>) => void;
  onAdd: (item: MenuItem) => void;
};

export default function ImmersiveRestaurantExperience({
  restaurant,
  themeIdentity,
  heroVisual,
  gallery,
  menuItems,
  featuredItems,
  quantities,
  hours,
  reservationsEnabled,
  orderingEnabled,
  deliveryEnabled,
  pickupEnabled,
  dineInEnabled,
  chatbotEnabled,
  reservationStatus,
  onReserve,
  onAdd,
}: ImmersiveRestaurantExperienceProps) {
  const visuals = [heroVisual, ...gallery.map((image) => image.url)].filter(Boolean);
  const primaryVisual = visuals[0] || "";
  const secondaryVisual = visuals[1] || primaryVisual;
  const atmosphereVisual = visuals[2] || secondaryVisual;
  const finalVisual = visuals[3] || primaryVisual;
  const firstDish = featuredItems[0];
  const secondDish = featuredItems[1];
  const thirdDish = featuredItems[2];
  const experience = themeIdentity.experience;
  const primary = themeIdentity.primary;
  const buttonClass = themeIdentity.buttonClass;

  return (
    <div className="cinematic-experience min-h-screen bg-[#020108] text-white">
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:py-8">
          <a href="#top" className="group flex min-w-0 items-center gap-3">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt="" className="h-10 w-10 rounded-full border border-white/30 object-cover" loading="eager" decoding="async" />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10">
                <ChefHat size={18} />
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold uppercase tracking-[0.24em] text-white/78">{restaurant.name}</span>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.28em] text-white/40 sm:block">{restaurant.city || "Private table"}</span>
            </span>
          </a>
          <nav className="hidden items-center gap-6 text-[11px] font-bold uppercase tracking-[0.24em] text-white/58 md:flex">
            <a href="#experience" className="transition hover:text-white">Experience</a>
            <a href="#ritual" className="transition hover:text-white">Ritual</a>
            <a href="#menu" className="transition hover:text-white">Menu</a>
            <a href={reservationsEnabled ? "#reserve" : "#contact"} className="transition hover:text-white">
              {reservationsEnabled ? "Reserve" : "Contact"}
            </a>
          </nav>
        </div>
      </header>

      <section id="top" className="cinematic-opening relative flex min-h-[100svh] items-end overflow-hidden">
        <SceneImage src={primaryVisual} alt={restaurant.name} treatment={themeIdentity.imageTreatmentClass} priority />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_24%,rgba(183,140,255,.22),transparent_25rem),linear-gradient(90deg,rgba(2,1,8,.98),rgba(3,2,10,.78)_42%,rgba(2,1,8,.35))]" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#020108] via-[#020108]/76 to-transparent" />
        <div className="cinematic-grain" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 pt-32 sm:px-6 sm:pb-14 lg:pb-20">
          <div className="max-w-5xl">
            <p className="luxury-kicker text-[10px] font-bold text-white/54">
              {restaurant.city || "Tonight"} / {themeIdentity.personality.guestKicker}
            </p>
            <h1 className="mt-5 text-balance text-[clamp(4.4rem,18vw,10.5rem)] font-semibold leading-[0.78] text-white">
              {restaurant.name}
            </h1>
            <p className="mt-7 max-w-2xl font-display text-2xl leading-tight text-white/78 sm:text-4xl">
              {restaurant.tagline || restaurant.description || themeIdentity.personality.momentTitle}
            </p>
            <div className="mt-9 flex max-w-xl flex-col gap-3 sm:flex-row">
              <a href="#experience" className={`luxury-button ${buttonClass} inline-flex min-h-12 items-center justify-center gap-2 border border-white/18 bg-white px-6 py-3 text-sm font-bold text-[#070411]`}>
                Enter the experience <ArrowRight size={17} />
              </a>
              {reservationsEnabled && (
                <a href="#reserve" className={`luxury-button ${buttonClass} inline-flex min-h-12 items-center justify-center border border-white/22 bg-white/[.08] px-6 py-3 text-sm font-bold text-white backdrop-blur`}>
                  Reserve
                </a>
              )}
            </div>
          </div>
          <div className="mt-12 grid max-w-3xl gap-3 border-y border-white/10 py-5 text-xs text-white/58 sm:grid-cols-3">
            <OpeningSignal label="Cuisine mood" value={themeIdentity.personality.name} />
            <OpeningSignal label="Menu" value={`${menuItems.filter((item) => item.is_available).length} available choices`} />
            <OpeningSignal label="Service" value={serviceModeLabel({ orderingEnabled, deliveryEnabled, pickupEnabled, dineInEnabled })} />
          </div>
        </div>
      </section>

      <section id="experience" className="cinematic-chapter relative grid min-h-[92svh] items-center overflow-hidden px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div className="max-w-xl">
            <p className="luxury-kicker text-[10px] font-bold" style={{ color: primary }}>{experience?.kicker || "The room"}</p>
            <h2 className="mt-5 text-balance text-5xl font-semibold leading-[0.92] sm:text-7xl">
              {experience?.title || themeIdentity.personality.momentTitle}
            </h2>
          </div>
          <div className="relative min-h-[70svh] overflow-hidden rounded-[2rem] border border-white/10">
            <SceneImage src={secondaryVisual} alt={restaurant.name} treatment={themeIdentity.imageTreatmentClass} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/68 via-black/22 to-transparent" />
            <div className="absolute bottom-6 left-6 max-w-md sm:bottom-10 sm:left-10">
              <p className="text-sm leading-7 text-white/72">
                {experience?.copy || themeIdentity.personality.momentCopy}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="ritual" className="cinematic-chapter px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
            <div>
              <p className="luxury-kicker text-[10px] font-bold" style={{ color: primary }}>Kitchen ritual</p>
              <h2 className="mt-5 max-w-4xl text-balance text-5xl font-semibold leading-[0.95] sm:text-7xl">
                Fire, timing, texture, and the quiet confidence of craft.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/58 lg:justify-self-end">
              {restaurant.story || themeIdentity.personality.description}
            </p>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
            <DishRitual item={firstDish} fallbackTitle="The first plate" visual={primaryVisual} themeIdentity={themeIdentity} large />
            <div className="grid gap-4">
              <DishRitual item={secondDish} fallbackTitle="The second note" visual={secondaryVisual} themeIdentity={themeIdentity} />
              <DishRitual item={thirdDish} fallbackTitle="The final texture" visual={atmosphereVisual} themeIdentity={themeIdentity} />
            </div>
          </div>
        </div>
      </section>

      {gallery.length > 0 && (
        <section id="atmosphere" className="cinematic-chapter px-3 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 max-w-3xl">
              <p className="luxury-kicker text-[10px] font-bold" style={{ color: primary }}>Atmosphere</p>
              <h2 className="mt-5 text-balance text-5xl font-semibold leading-[0.94] sm:text-7xl">
                A night told through shadow, glass, heat, and silence.
              </h2>
            </div>
            <div className="cinematic-gallery grid gap-3 md:grid-cols-4">
              {gallery.slice(0, 6).map((image, index) => (
                <figure key={image.id} className={`group relative overflow-hidden rounded-[1.5rem] border border-white/10 ${index === 0 ? "md:col-span-2 md:row-span-2" : ""}`}>
                  <img
                    src={image.url}
                    alt={image.alt_text || restaurant.name}
                    className={`h-80 w-full object-cover transition duration-1000 group-hover:scale-[1.04] ${index === 0 ? "md:h-full" : ""} ${themeIdentity.imageTreatmentClass}`}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent opacity-70" />
                  <figcaption className="sr-only">{image.alt_text || `${restaurant.name} atmosphere`}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="cinematic-chapter px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="luxury-kicker text-[10px] font-bold" style={{ color: primary }}>Menu as a sequence</p>
            <h2 className="mt-5 text-balance text-5xl font-semibold leading-[0.94] sm:text-7xl">
              Not a list. A path through appetite.
            </h2>
          </div>
          <div className="space-y-4">
            {featuredItems.length > 0 ? (
              featuredItems.slice(0, 4).map((item, index) => (
                <a key={item.id} href={`#category-${item.category_id}`} className="cinematic-menu-line group grid gap-3 border-b border-white/10 py-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <span className="text-xs font-bold uppercase tracking-[0.28em] text-white/34">Course {String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block text-2xl font-semibold leading-tight text-white group-hover:text-white/84">{item.name}</span>
                    <span className="mt-1 line-clamp-2 block text-sm leading-6 text-white/48">{item.description || "Prepared by the kitchen tonight."}</span>
                  </span>
                  <span className="text-sm font-bold" style={{ color: primary }}>{formatPrice(item.price)}</span>
                </a>
              ))
            ) : (
              <div className="border-y border-white/10 py-8 text-sm leading-7 text-white/54">
                The kitchen has not published online courses yet. Guests can still reserve or contact the restaurant directly.
              </div>
            )}
          </div>
        </div>
      </section>

      <MenuShowcase
        restaurant={restaurant}
        themeIdentity={themeIdentity}
        menuItems={menuItems}
        featuredItems={featuredItems}
        quantities={quantities}
        orderingEnabled={orderingEnabled}
        onAdd={onAdd}
      />

      <section id="host" className="cinematic-chapter px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <div>
            <p className="luxury-kicker text-[10px] font-bold" style={{ color: primary }}>AI Maitre d'</p>
            <h2 className="mt-5 text-balance text-5xl font-semibold leading-[0.94] sm:text-7xl">
              A quiet digital host for the questions before the table.
            </h2>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/58">
              {chatbotEnabled
                ? "Ask about allergies, pairings, opening hours, reservations, pickup, delivery, or the dishes that match the evening."
                : "The digital host can be enabled when the restaurant is ready to guide guests through menu and reservation questions."}
            </p>
          </div>
          <div className="cinematic-host-panel rounded-[2rem] border border-white/10 p-5 sm:p-7">
            <Bot size={25} style={{ color: primary }} />
            <p className="mt-6 text-2xl font-semibold">{restaurant.ai_name || "AI Maitre d'"}</p>
            <p className="mt-4 text-sm leading-7 text-white/58">
              {restaurant.ai_welcome_message || "Tell me your mood, timing, allergies, or occasion, and I will guide you through the menu."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/62">
              {["Menu", "Allergies", "Pairing", "Hours", "Reservations"].map((chip) => (
                <span key={chip} className="rounded-full border border-white/10 bg-white/[.05] px-3 py-2">{chip}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ReservationFinale
        restaurant={restaurant}
        themeIdentity={themeIdentity}
        visual={finalVisual}
        hours={hours}
        reservationsEnabled={reservationsEnabled}
        reservationStatus={reservationStatus}
        onReserve={onReserve}
      />
    </div>
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

function OpeningSignal({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/34">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white/78">{value}</p>
    </div>
  );
}

function DishRitual({
  item,
  fallbackTitle,
  visual,
  themeIdentity,
  large = false,
}: {
  item?: MenuItem;
  fallbackTitle: string;
  visual: string;
  themeIdentity: RestaurantThemeIdentity;
  large?: boolean;
}) {
  return (
    <article className={`group relative overflow-hidden rounded-[2rem] border border-white/10 ${large ? "min-h-[32rem]" : "min-h-[15rem]"}`}>
      <SceneImage src={item?.image_url || visual} alt={item?.name || fallbackTitle} treatment={themeIdentity.imageTreatmentClass} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/42 to-transparent" />
      <div className="absolute inset-x-5 bottom-5 sm:inset-x-7 sm:bottom-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/38">{large ? "Ritual one" : "Kitchen note"}</p>
        <h3 className={`${large ? "text-4xl sm:text-6xl" : "text-2xl sm:text-3xl"} mt-3 font-semibold leading-[0.96]`}>
          {item?.name || fallbackTitle}
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/62">
          {item?.description || "A signature moment from the kitchen can appear here when the menu is ready."}
        </p>
      </div>
    </article>
  );
}

function ReservationFinale({
  restaurant,
  themeIdentity,
  visual,
  hours,
  reservationsEnabled,
  reservationStatus,
  onReserve,
}: {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  visual: string;
  hours: Record<string, string>;
  reservationsEnabled: boolean;
  reservationStatus: string;
  onReserve: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section id="contact" className="cinematic-finale relative overflow-hidden px-4 py-20 sm:px-6 lg:py-28">
      <SceneImage src={visual} alt={`${restaurant.name} dining room`} treatment={themeIdentity.imageTreatmentClass} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,1,8,.98),rgba(2,1,8,.76)_50%,rgba(2,1,8,.42)),radial-gradient(circle_at_78%_18%,rgba(183,140,255,.18),transparent_26rem)]" />
      <div className="relative z-10 mx-auto grid min-h-[82svh] max-w-7xl items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className="luxury-kicker text-[10px] font-bold" style={{ color: themeIdentity.primary }}>
            The final gesture
          </p>
          <h2 className="mt-5 max-w-4xl text-balance text-5xl font-semibold leading-[0.9] sm:text-7xl">
            Reserve the table. Let the evening do the rest.
          </h2>
          <div className="mt-8 space-y-4 text-sm leading-7 text-white/62">
            <p className="flex gap-3"><MapPin className="mt-1 shrink-0" size={17} style={{ color: themeIdentity.primary }} /> {restaurant.address}, {restaurant.postal_code} {restaurant.city}</p>
            <p className="flex gap-3"><Phone className="mt-1 shrink-0" size={17} style={{ color: themeIdentity.primary }} /> {restaurant.phone || "Phone coming soon"} / {restaurant.email}</p>
            <div className="grid max-w-md gap-2 border-t border-white/10 pt-4">
              {Object.entries(hours).slice(0, 4).map(([day, value]) => (
                <p key={day} className="flex justify-between gap-6">
                  <span className="capitalize text-white/42">{day}</span>
                  <span className="font-semibold text-white/72">{value}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
        {reservationsEnabled ? (
          <form id="reserve" onSubmit={onReserve} className="cinematic-reservation-panel rounded-[2rem] border border-white/10 p-5 shadow-2xl sm:p-7">
            <p className="luxury-kicker text-[10px] font-bold" style={{ color: themeIdentity.primary }}>Reservations</p>
            <h3 className="mt-3 text-3xl font-semibold sm:text-5xl">Request a table</h3>
            <p className="mt-3 text-sm leading-6 text-white/56">
              The restaurant confirms every request directly. Share allergies, timing, or an occasion so the team can prepare properly.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <input name="name" required aria-label="Your name" placeholder="Your name" autoComplete="name" className="cinematic-input" />
              <input name="email" type="email" required aria-label="Email" placeholder="Email" autoComplete="email" inputMode="email" className="cinematic-input" />
              <input name="phone" type="tel" aria-label="Phone" placeholder="Phone" autoComplete="tel" inputMode="tel" className="cinematic-input" />
              <input name="party_size" type="number" min="1" aria-label="Guests" inputMode="numeric" placeholder="Guests" className="cinematic-input" />
              <input name="requested_at" type="datetime-local" aria-label="Requested date and time" className="cinematic-input sm:col-span-2" />
              <textarea name="message" aria-label="Reservation message" placeholder="Allergies, occasion, preferred table, or notes" className="cinematic-input min-h-28 sm:col-span-2" />
            </div>
            <button className={`luxury-button mt-4 min-h-12 w-full ${themeIdentity.buttonClass} py-3.5 font-semibold text-white shadow-lg`} style={{ backgroundColor: themeIdentity.primary }}>
              Send reservation request
            </button>
            {reservationStatus && (
              <p className="mt-3 rounded-2xl border border-white/10 bg-white/[.06] p-3 text-center text-sm font-semibold text-white/76">
                {reservationStatus}
              </p>
            )}
          </form>
        ) : (
          <div className="cinematic-reservation-panel rounded-[2rem] border border-white/10 p-7">
            <CalendarDays size={24} style={{ color: themeIdentity.primary }} />
            <h3 className="mt-5 text-3xl font-semibold">Contact the restaurant</h3>
            <p className="mt-3 text-sm leading-7 text-white/58">Reservations are not currently open online. Call or email the restaurant directly for the evening.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function serviceModeLabel({
  orderingEnabled,
  deliveryEnabled,
  pickupEnabled,
  dineInEnabled,
}: {
  orderingEnabled: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  dineInEnabled: boolean;
}) {
  if (!orderingEnabled) return "Reservations and menu browsing";
  const modes = [
    pickupEnabled && "pickup",
    dineInEnabled && "dine-in",
    deliveryEnabled && "delivery",
  ].filter(Boolean);
  return modes.length > 0 ? modes.join(", ") : "direct ordering";
}
