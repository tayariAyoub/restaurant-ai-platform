import {
  ArrowRight,
  Award,
  ChefHat,
  Clock3,
  MapPin,
  Menu as MenuIcon,
  Phone,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
  X,
} from "lucide-react";

import type { RestaurantThemeIdentity } from "@/lib/restaurantTheme";
import type { Restaurant, RestaurantImage } from "@/lib/types";

type RestaurantHeroProps = {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  heroVisual: string;
  heroGallery: RestaurantImage[];
  availableItems: number;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
};

export default function RestaurantHero({
  restaurant,
  themeIdentity,
  heroVisual,
  heroGallery,
  availableItems,
  mobileOpen,
  onToggleMobile,
  onCloseMobile,
}: RestaurantHeroProps) {
  const primary = themeIdentity.primary;
  const buttonClass = themeIdentity.buttonClass;
  const personality = themeIdentity.personality;
  const heroTitle = restaurant.name;
  const heroSubtitle =
    restaurant.tagline || restaurant.description || "A restaurant experience prepared with care.";

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-30 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:py-7">
          <a href="#top" className="flex min-w-0 items-center gap-3 text-lg font-bold sm:text-xl">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt=""
                className="h-12 w-12 rounded-full border border-white/35 object-cover shadow-lg"
                loading="eager"
                decoding="async"
              />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-full border border-white/35 bg-white/15">
                <ChefHat size={21} />
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate leading-tight">{restaurant.name}</span>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 sm:block">
                Reserve, order, and explore
              </span>
            </span>
          </a>
          <nav className="hidden items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-2 text-sm font-semibold shadow-2xl backdrop-blur-xl md:flex">
            <a className="inline-flex min-h-11 items-center rounded-full px-3" href="#story">Story</a>
            <a className="inline-flex min-h-11 items-center rounded-full px-3" href="#menu">Menu</a>
            <a className="inline-flex min-h-11 items-center rounded-full px-3" href="#gallery">Gallery</a>
            <a className="inline-flex min-h-11 items-center rounded-full px-3" href="#contact">Contact</a>
            <a
              href="#reserve"
              className={`luxury-button ${buttonClass} inline-flex min-h-11 items-center px-5 py-2.5 text-white shadow-lg`}
              style={{ backgroundColor: primary }}
            >
              Reserve
            </a>
          </nav>
          <button
            className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/20 backdrop-blur md:hidden"
            onClick={onToggleMobile}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X /> : <MenuIcon />}
          </button>
        </div>
        {mobileOpen && (
          <nav className="fixed inset-x-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 grid grid-cols-2 gap-2 rounded-[1.5rem] border border-white/10 bg-black/90 p-3 text-sm font-bold text-white shadow-2xl backdrop-blur md:hidden">
            <a className="rounded-2xl bg-white/10 px-4 py-3 text-center" href="#story" onClick={onCloseMobile}>Story</a>
            <a className="rounded-2xl bg-white/10 px-4 py-3 text-center" href="#menu" onClick={onCloseMobile}>Menu</a>
            <a className="rounded-2xl bg-white/10 px-4 py-3 text-center" href="#gallery" onClick={onCloseMobile}>Gallery</a>
            <a className="rounded-2xl bg-white px-4 py-3 text-center text-slate-950" href="#reserve" onClick={onCloseMobile}>Reserve</a>
          </nav>
        )}
      </header>

      <section
        className="noise relative flex min-h-[92svh] items-end overflow-hidden bg-cover bg-center sm:min-h-[100svh]"
        style={{
          backgroundImage: heroVisual
            ? `${themeIdentity.heroOverlay}, url(${heroVisual})`
            : themeIdentity.heroFallback,
        }}
      >
        <div className="absolute inset-0 slow-drift bg-[radial-gradient(circle_at_75%_18%,rgba(255,255,255,.16),transparent_18rem)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-4 pb-8 pt-28 text-white sm:gap-10 sm:px-6 sm:pb-10 sm:pt-36 lg:grid-cols-[1.02fr_.98fr] lg:items-end lg:pb-16">
          <div className="fade-up">
            <p className="luxury-kicker inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-bold text-white backdrop-blur">
              <Sparkles size={14} /> {restaurant.city || "A table is waiting"} / {personality.guestKicker}
            </p>
            <h1 className="mt-5 max-w-5xl text-balance text-[clamp(3rem,14vw,5.2rem)] font-semibold leading-[.88] sm:mt-6 sm:text-7xl lg:text-8xl">
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl font-display text-2xl leading-tight text-white/95 sm:text-4xl">
              {heroSubtitle}
            </p>
            {restaurant.description && restaurant.description !== heroSubtitle && (
              <p className="mt-5 max-w-2xl text-[15px] leading-7 text-white/80 sm:text-lg sm:leading-8">
                {restaurant.description}
              </p>
            )}
            <div className="mt-7 grid gap-3 sm:mt-9 sm:flex sm:flex-wrap">
              <a
                href="#reserve"
                className={`luxury-button ${buttonClass} inline-flex min-h-12 items-center justify-center gap-2 px-7 py-3.5 font-semibold text-white shadow-2xl sm:py-4`}
                style={{ backgroundColor: primary }}
              >
                Reserve a table <ArrowRight size={18} />
              </a>
              <a
                href="#menu"
                className={`luxury-button ${buttonClass} inline-flex min-h-12 items-center justify-center border border-white/40 bg-white/10 px-7 py-3.5 font-semibold backdrop-blur sm:py-4`}
              >
                View menu / order
              </a>
            </div>
            <div className="mt-6 grid max-w-2xl grid-cols-3 divide-x divide-white/15 rounded-3xl border border-white/15 bg-black/25 text-center text-xs backdrop-blur-xl sm:mt-8 sm:text-sm">
              <HeroMetric value={personality.name.replace("Michelin ", "")} label="Style" />
              <HeroMetric value={availableItems} label="Menu choices" />
              <HeroMetric value="Direct" label="Ordering" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-white/75">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">Reservation request confirmed by the restaurant</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">Pickup, dine-in, and delivery options</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">AI Maître d' menu guidance</span>
            </div>
          </div>
          <div className="art-frame luxury-hero-shadow hidden rounded-[2rem] border border-white/15 bg-white/10 p-4 backdrop-blur-xl lg:block">
            <div className="grid grid-cols-3 gap-3">
              {heroGallery.length > 0 ? (
                heroGallery.map((image, index) => (
                  <img
                    key={image.id}
                    src={image.url}
                    alt={image.alt_text || restaurant.name}
                    className={`${index === 0 ? "col-span-2 h-64" : "h-44"} w-full rounded-2xl object-cover ${themeIdentity.imageTreatmentClass}`}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                ))
              ) : (
                <div className="col-span-3 rounded-2xl border border-white/10 bg-white/10 p-8 text-sm text-white/75">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">At the table</p>
                  <p className="mt-3 text-lg font-semibold">An intimate preview of the dining room will appear here.</p>
                </div>
              )}
            </div>
            <div className="mt-4 grid gap-3 rounded-2xl bg-black/30 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Award size={17} /> Chef's selection, direct ordering, and table requests in one calm flow.
              </p>
              <div className="luxury-divider opacity-40" />
              <p className="text-xs leading-5 text-white/65">
                Browse signature dishes, reserve a table, or place an order directly with {restaurant.name}.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white/85 shadow-sm backdrop-blur">
        <div className="mx-auto grid max-w-7xl divide-y px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
          <QuickFact icon={MapPin} color={primary} text={`${restaurant.address}, ${restaurant.city}`} />
          <QuickFact icon={Phone} color={primary} text={restaurant.phone || "Phone coming soon"} />
          <QuickFact icon={Clock3} color={primary} text="Reservations, pickup, and delivery below" />
        </div>
      </section>

      <section className="bg-white/65 px-4 py-5 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-3 text-sm sm:grid-cols-3">
          {[
            ["Direct with the restaurant", "Orders and requests go straight to the team."],
            ["Hospitality-first", "Clear allergy prompts, opening hours, and contact details."],
            ["No hidden friction", "Payment is handled at the restaurant or on delivery."],
          ].map(([title, copy]) => (
            <div key={title} className="flex gap-3 rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm">
              <ShieldCheck size={18} style={{ color: primary }} />
              <span>
                <b className="block">{title}</b>
                <span className="text-xs leading-5 opacity-60">{copy}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function HeroMetric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="p-3 sm:p-4">
      <b className="block truncate text-xl sm:text-2xl">{value}</b>
      <span className="text-white/65">{label}</span>
    </div>
  );
}

function QuickFact({
  icon: Icon,
  color,
  text,
}: {
  icon: LucideIcon;
  color: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 py-6 md:px-6 md:first:pl-0 md:last:pr-0">
      <Icon className="shrink-0" style={{ color }} />
      <span>{text}</span>
    </div>
  );
}
