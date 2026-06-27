import { Clock3, Instagram, MapPin, Phone, ShieldCheck } from "lucide-react";
import type { FormEvent } from "react";

import type { RestaurantThemeIdentity } from "@/lib/restaurantTheme";
import type { Restaurant } from "@/lib/types";

type ReservationPanelProps = {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  hours: Record<string, string>;
  reservationStatus: string;
  onReserve: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ReservationPanel({
  restaurant,
  themeIdentity,
  hours,
  reservationStatus,
  onReserve,
}: ReservationPanelProps) {
  const primary = themeIdentity.primary;
  const buttonClass = themeIdentity.buttonClass;

  return (
    <section id="contact" className="sensory-section mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:py-28">
      <div>
        <p className="luxury-kicker text-xs font-bold" style={{ color: primary }}>Visit us</p>
        <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">Your table, prepared with care.</h2>
        <div className="mt-8 space-y-5 leading-7 opacity-75">
          <div className="flex gap-3">
            <MapPin className="mt-1 shrink-0" size={18} style={{ color: primary }} />
            <p>{restaurant.address}<br />{restaurant.postal_code} {restaurant.city}</p>
          </div>
          <div className="flex gap-3">
            <Phone className="mt-1 shrink-0" size={18} style={{ color: primary }} />
            <p>{restaurant.phone || "Phone coming soon"}<br />{restaurant.email}</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
            <p className="mb-2 flex items-center gap-2 font-semibold"><Clock3 size={17} style={{ color: primary }} /> Opening hours</p>
            {Object.entries(hours).map(([day, value]) => (
              <p key={day} className="flex justify-between gap-6 border-b border-black/5 py-2 last:border-0">
                <span className="capitalize">{day}</span>
                <span className="font-semibold">{value}</span>
              </p>
            ))}
          </div>
          {restaurant.google_maps_url && <a href={restaurant.google_maps_url} target="_blank" className="inline-flex min-h-11 items-center font-semibold underline">Open Google Maps</a>}
          {restaurant.instagram_url && <a href={restaurant.instagram_url} target="_blank" className="flex min-h-11 items-center gap-2"><Instagram size={17} /> Instagram</a>}
        </div>
      </div>
      <form id="reserve" onSubmit={onReserve} className="premium-card rounded-[2rem] p-6 text-slate-900 sm:p-8">
        <p className="luxury-kicker text-xs font-bold" style={{ color: primary }}>Reservations</p>
        <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Request a table</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your reservation request will be confirmed by the restaurant. Add dietary notes, allergies, or a special occasion below.
        </p>
        <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm leading-6 text-green-900">
          <p className="flex gap-2 font-semibold"><ShieldCheck size={17} /> The team confirms every table request directly.</p>
          <p className="mt-1 opacity-75">For urgent same-day changes, call the restaurant after sending your request.</p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <input name="name" required placeholder="Your name" autoComplete="name" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:text-sm" />
          <input name="email" type="email" required placeholder="Email" autoComplete="email" inputMode="email" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:text-sm" />
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Phone" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:text-sm" />
          <input name="party_size" type="number" min="1" inputMode="numeric" placeholder="Guests" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:text-sm" />
          <input name="requested_at" type="datetime-local" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:col-span-2 sm:text-sm" />
          <textarea name="message" placeholder="Message, allergies, occasion, or preferred table" className="min-h-28 rounded-xl border px-4 py-3 text-base sm:col-span-2 sm:text-sm" />
        </div>
        <button className={`luxury-button mt-4 min-h-12 w-full ${buttonClass} py-3.5 font-semibold text-white shadow-lg`} style={{ backgroundColor: primary }}>
          Send reservation request
        </button>
        {reservationStatus && (
          <p className="mt-3 rounded-xl border border-green-100 bg-green-50 p-3 text-center text-sm font-semibold text-green-800">
            {reservationStatus}
          </p>
        )}
      </form>
    </section>
  );
}
