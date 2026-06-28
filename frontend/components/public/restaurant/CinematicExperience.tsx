import { CalendarDays, MessageCircle, Moon, Sparkles, Wine } from "lucide-react";

import type { RestaurantThemeIdentity } from "@/lib/restaurantTheme";
import type { MenuItem, Restaurant, RestaurantImage } from "@/lib/types";
import { formatPrice } from "./experience";

type CinematicExperienceProps = {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  featuredItems: MenuItem[];
  gallery: RestaurantImage[];
  reservationsEnabled: boolean;
  orderingEnabled: boolean;
  chatbotEnabled: boolean;
};

export default function CinematicExperience({
  restaurant,
  themeIdentity,
  featuredItems,
  gallery,
  reservationsEnabled,
  orderingEnabled,
  chatbotEnabled,
}: CinematicExperienceProps) {
  const experience = themeIdentity.experience;
  if (!experience) return null;

  const primary = themeIdentity.primary;
  const heroImage = gallery[0]?.url || restaurant.hero_image;
  const firstDish = featuredItems[0];
  const secondDish = featuredItems[1];

  return (
    <section className="ultraviolet-experience sensory-section overflow-hidden px-4 py-16 text-white sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
        <div className="ultraviolet-reveal">
          <p className="luxury-kicker text-xs font-bold" style={{ color: primary }}>
            {experience.kicker}
          </p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-[0.98] sm:text-6xl">
            {experience.title}
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/68">
            {experience.copy}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <ExperienceCard
              icon={Moon}
              title={experience.sensoryTitle}
              copy={experience.sensoryCopy}
              color={primary}
            />
            <ExperienceCard
              icon={MessageCircle}
              title={experience.aiTitle}
              copy={chatbotEnabled ? experience.aiCopy : "The restaurant can keep this guidance paused and still present the menu, ordering, and reservations beautifully."}
              color={primary}
            />
          </div>
        </div>

        <div className="ultraviolet-panel grid gap-4 rounded-[2rem] p-4 shadow-2xl sm:p-5">
          <div className="relative min-h-[28rem] overflow-hidden rounded-[1.5rem] bg-[#0b0614]">
            {heroImage ? (
              <img
                src={heroImage}
                alt={restaurant.name}
                className={`absolute inset-0 h-full w-full object-cover ${themeIdentity.imageTreatmentClass}`}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(183,140,255,.25),transparent_18rem),linear-gradient(135deg,#05030b,#130821)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
            <div className="absolute inset-x-5 bottom-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/48">Tonight's preview</p>
              <h3 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
                {firstDish ? firstDish.name : restaurant.name}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
                {firstDish?.description || restaurant.story || restaurant.description || "A darker, slower first impression for a premium dining room."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MenuPreview item={firstDish} label="Signature" />
            <MenuPreview item={secondDish} label={orderingEnabled ? "Order-ready" : "Chef's note"} />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-7xl gap-4 lg:grid-cols-[1fr_1fr_.9fr]">
        <article className="ultraviolet-panel rounded-[1.75rem] p-6">
          <Wine size={21} style={{ color: primary }} />
          <h3 className="mt-5 text-2xl font-semibold">{experience.eventsTitle}</h3>
          <p className="mt-3 text-sm leading-7 text-white/64">{experience.eventsCopy}</p>
          <a href="#contact" className="mt-5 inline-flex min-h-11 items-center rounded-full border border-white/18 px-5 py-3 text-sm font-bold text-white transition hover:border-white/40">
            Contact the restaurant
          </a>
        </article>

        <article className="ultraviolet-panel rounded-[1.75rem] p-6">
          <Sparkles size={21} style={{ color: primary }} />
          <h3 className="mt-5 text-2xl font-semibold">{experience.ctaTitle}</h3>
          <p className="mt-3 text-sm leading-7 text-white/64">{experience.ctaCopy}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {reservationsEnabled && (
              <a href="#reserve" className={`luxury-button ${themeIdentity.buttonClass} inline-flex min-h-11 items-center justify-center px-5 py-3 text-sm font-bold text-white`} style={{ backgroundColor: primary }}>
                Reserve
              </a>
            )}
            <a href="#menu" className={`luxury-button ${themeIdentity.buttonClass} inline-flex min-h-11 items-center justify-center border border-white/18 px-5 py-3 text-sm font-bold text-white`}>
              {orderingEnabled ? "View menu / order" : "View menu"}
            </a>
          </div>
        </article>

        <article className="ultraviolet-panel rounded-[1.75rem] p-6">
          <CalendarDays size={21} style={{ color: primary }} />
          <h3 className="mt-5 text-2xl font-semibold">Plan with confidence</h3>
          <p className="mt-3 text-sm leading-7 text-white/64">
            {restaurant.address ? `${restaurant.address}, ${restaurant.city}. ` : ""}
            Browse the menu, check contact details, and send the request that fits the evening.
          </p>
        </article>
      </div>
    </section>
  );
}

function ExperienceCard({
  icon: Icon,
  title,
  copy,
  color,
}: {
  icon: typeof Moon;
  title: string;
  copy: string;
  color: string;
}) {
  return (
    <article className="ultraviolet-panel rounded-[1.5rem] p-5">
      <Icon size={20} style={{ color }} />
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/62">{copy}</p>
    </article>
  );
}

function MenuPreview({ item, label }: { item?: MenuItem; label: string }) {
  if (!item) {
    return (
      <div className="rounded-[1.25rem] border border-white/10 bg-white/[.04] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">{label}</p>
        <p className="mt-2 text-sm text-white/64">Add menu highlights to make this theme feel even more cinematic.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[.04] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">{label}</p>
      <div className="mt-2 flex items-start justify-between gap-4">
        <p className="font-semibold leading-snug">{item.name}</p>
        <p className="shrink-0 text-sm font-bold text-white/70">{formatPrice(item.price)}</p>
      </div>
    </div>
  );
}
