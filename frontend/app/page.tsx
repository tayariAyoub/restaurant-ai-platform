"use client";

import { ArrowRight, Clock3, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";

import PublicShell from "@/components/PublicShell";

const gallery = [
  "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=900&q=80",
];

export default function Home() {
  return (
    <PublicShell>
      {(restaurant) => (
        <main>
          <section
            className="noise relative flex min-h-[92vh] items-end overflow-hidden bg-cover bg-center text-white"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(20,18,14,.78), rgba(20,18,14,.15)), url(${restaurant.hero_image})`,
            }}
          >
            <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20 pt-40 lg:px-10 lg:pb-28">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.35em] text-orange-200">
                Neighborhood restaurant - {restaurant.city || "Your city"}
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.92] sm:text-7xl lg:text-8xl">
                {restaurant.tagline || "A restaurant website that feels alive."}
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-stone-200">{restaurant.description}</p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link href="/menu" className="flex items-center gap-2 rounded-full bg-tomato px-7 py-4 font-semibold transition hover:bg-red-700">
                  Explore our menu <ArrowRight size={18} />
                </Link>
                <Link href="/contact#reservation" className="rounded-full border border-white/50 bg-white/10 px-7 py-4 font-semibold backdrop-blur transition hover:bg-white hover:text-ink">
                  Reserve a table
                </Link>
              </div>
            </div>
          </section>

          <section className="border-b border-black/10 bg-white">
            <div className="mx-auto grid max-w-7xl divide-y px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-10">
              <div className="flex gap-4 py-7 md:pr-8">
                <MapPin className="text-tomato" />
                <div>
                  <p className="font-semibold">{restaurant.address || "Address coming soon"}</p>
                  <p className="text-sm text-stone-500">{restaurant.postal_code} {restaurant.city}</p>
                </div>
              </div>
              <div className="flex gap-4 py-7 md:px-8">
                <Clock3 className="text-tomato" />
                <div>
                  <p className="font-semibold">Open hours</p>
                  <p className="text-sm text-stone-500">See current opening hours</p>
                </div>
              </div>
              <div className="flex gap-4 py-7 md:pl-8">
                <Sparkles className="text-tomato" />
                <div>
                  <p className="font-semibold">Need a quick answer?</p>
                  <p className="text-sm text-stone-500">Ask the restaurant AI assistant anytime</p>
                </div>
              </div>
            </div>
          </section>

          <section id="story" className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-2 lg:px-10 lg:py-32">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-tomato">Our story</p>
              <h2 className="mt-5 text-5xl font-semibold leading-tight sm:text-6xl">
                Built around hospitality.
              </h2>
            </div>
            <div className="max-w-xl text-lg leading-8 text-stone-600">
              <p>{restaurant.story || restaurant.description}</p>
              <Link href="/menu" className="mt-8 inline-flex items-center gap-2 font-semibold text-tomato">
                See what's cooking <ArrowRight size={18} />
              </Link>
            </div>
          </section>

          <section id="gallery" className="grid gap-2 px-2 pb-2 md:grid-cols-3">
            {gallery.map((image) => (
              <div key={image} className="overflow-hidden rounded-2xl">
                <img src={image} alt={`${restaurant.name} food and atmosphere`} className="h-[420px] w-full object-cover transition duration-700 hover:scale-105" />
              </div>
            ))}
          </section>
        </main>
      )}
    </PublicShell>
  );
}
