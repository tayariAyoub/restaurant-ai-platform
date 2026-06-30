import { CalendarDays, Camera, MapPin, Utensils, type LucideIcon } from "lucide-react";

import type { RestaurantThemeIdentity } from "@/lib/restaurantTheme";
import type { Restaurant, RestaurantImage } from "@/lib/types";

type GalleryShowcaseProps = {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  gallery: RestaurantImage[];
};

export default function GalleryShowcase({
  restaurant,
  themeIdentity,
  gallery,
}: GalleryShowcaseProps) {
  const immersive = themeIdentity.homepageStyle === "immersive";

  return (
    <section id="gallery" className={`sensory-section px-3 py-16 sm:px-6 lg:py-24 ${immersive ? "bg-[#070411]/88 text-white" : ""}`}>
      <div className="mx-auto mb-10 grid max-w-7xl gap-6 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
        <div>
          <p className="luxury-kicker text-xs font-bold" style={{ color: themeIdentity.primary }}>Atmosphere</p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-6xl">A glimpse before you arrive.</h2>
        </div>
        <p className="max-w-xl text-sm leading-7 opacity-60 lg:justify-self-end">
          Food, room, light, and service should feel connected before you ever open the door.
        </p>
      </div>
      {gallery.length > 0 ? (
        <div className={`mx-auto grid max-w-7xl gap-3 ${themeIdentity.galleryClass}`}>
          {gallery.map((image, index) => (
            <figure
              key={image.id}
              className={`group art-frame overflow-hidden rounded-[1.5rem] shadow-sm ${immersive ? "border border-white/10 bg-white/[.04]" : ""} ${index === 0 ? "md:col-span-2" : ""}`}
            >
              <img
                src={image.url}
                alt={image.alt_text || restaurant.name}
                className={`h-80 w-full object-cover transition duration-700 group-hover:scale-[1.025] ${index === 0 ? "sm:h-96" : ""} ${themeIdentity.imageTreatmentClass}`}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="sr-only">{image.alt_text || `${restaurant.name} atmosphere`}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <EmptyGalleryState restaurant={restaurant} themeIdentity={themeIdentity} immersive={immersive} />
      )}
    </section>
  );
}

function EmptyGalleryState({
  restaurant,
  themeIdentity,
  immersive,
}: {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  immersive: boolean;
}) {
  const basePath = `/restaurants/${restaurant.slug}`;
  const reservationsEnabled = restaurant.reservations_enabled !== false;
  const actions = [
    { label: "View menu", href: `${basePath}/menu`, primary: true },
    reservationsEnabled ? { label: "Reserve a table", href: `${basePath}/reservations`, primary: false } : null,
    { label: "Plan a visit", href: `${basePath}/contact`, primary: false },
  ].filter(Boolean) as Array<{ label: string; href: string; primary: boolean }>;

  return (
    <div
      className={`mx-auto max-w-7xl overflow-hidden rounded-[2rem] border p-6 shadow-[0_30px_90px_rgba(23,21,17,.12)] sm:p-8 lg:p-10 ${
        immersive
          ? "border-white/10 bg-white/[.05] text-white"
          : "border-[#2d1b13]/10 bg-white/80 text-[#21160f]"
      }`}
    >
      <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
        <div>
          <span
            className={`inline-grid h-14 w-14 place-items-center rounded-2xl ${immersive ? "bg-white/10" : "bg-[#21160f]/[.06]"}`}
            style={{ color: themeIdentity.primary }}
          >
            <Camera size={24} />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.26em]" style={{ color: themeIdentity.primary }}>
            Gallery being curated
          </p>
          <h3 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.02] sm:text-6xl">
            The visual story is still being prepared.
          </h3>
          <p className={`mt-5 max-w-2xl text-base leading-8 ${immersive ? "text-white/62" : "text-[#6f5144]"}`}>
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
                    : immersive
                      ? "border border-white/12 bg-white/[.08] text-white"
                      : "border border-[#2d1b13]/15 bg-white text-[#21160f]"
                }`}
                style={action.primary ? { backgroundColor: themeIdentity.primary } : undefined}
              >
                {action.label}
              </a>
            ))}
          </div>
        </div>
        <div className={`grid gap-3 text-sm ${immersive ? "text-white/62" : "text-[#6f5144]"}`}>
          <GalleryEmptySignal icon={Utensils} title="Menu first" copy="Guests can still inspect dishes, prices, dietary notes, and ordering options." immersive={immersive} />
          <GalleryEmptySignal icon={CalendarDays} title="Table ready" copy={reservationsEnabled ? "Reservation requests remain available while the gallery is curated." : "Contact the restaurant directly for table requests."} immersive={immersive} />
          <GalleryEmptySignal icon={MapPin} title="Visit details" copy="Address, hours, phone, email, and map details stay one step away." immersive={immersive} />
        </div>
      </div>
    </div>
  );
}

function GalleryEmptySignal({
  icon: Icon,
  title,
  copy,
  immersive,
}: {
  icon: LucideIcon;
  title: string;
  copy: string;
  immersive: boolean;
}) {
  return (
    <p className={`grid grid-cols-[auto_1fr] gap-4 rounded-[1.25rem] border p-4 ${immersive ? "border-white/10 bg-white/[.05]" : "border-[#2d1b13]/10 bg-[#fbf6ee]"}`}>
      <Icon size={19} className="mt-0.5 opacity-70" />
      <span>
        <b className={immersive ? "block text-white" : "block text-[#21160f]"}>{title}</b>
        <span className="mt-1 block leading-6">{copy}</span>
      </span>
    </p>
  );
}
