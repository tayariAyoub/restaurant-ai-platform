import Link from "next/link";

import type { Restaurant } from "@/lib/types";

export default function Footer({ restaurant }: { restaurant: Restaurant }) {
  return (
    <footer className="bg-ink px-6 py-12 text-stone-300">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl text-white">{restaurant.name}</p>
          <p className="mt-3 max-w-xs text-sm leading-6">{restaurant.tagline}</p>
        </div>
        <div className="text-sm leading-7">
          <p className="mb-2 font-semibold uppercase tracking-[0.2em] text-white">Visit</p>
          <p>{restaurant.address}</p>
          <p>
            {restaurant.postal_code} {restaurant.city}
          </p>
          <p>{restaurant.phone}</p>
        </div>
        <div className="text-sm leading-7">
          <p className="mb-2 font-semibold uppercase tracking-[0.2em] text-white">Explore</p>
          <Link href="/menu" className="block hover:text-white">Menu</Link>
          <Link href="/contact" className="block hover:text-white">Reservations</Link>
          <Link href="/admin/login" className="block text-stone-500 hover:text-white">Owner login</Link>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-xs text-stone-500">
        &copy; {new Date().getFullYear()} {restaurant.name}. Menu, reservations, directions, and ordering.
      </div>
    </footer>
  );
}
