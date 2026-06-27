"use client";

import { ArrowRight, MapPin, Phone, ShieldCheck, Sparkles, Star, Utensils, Wine } from "lucide-react";
import Link from "next/link";

import PublicShell from "@/components/PublicShell";

export default function Home() {
  return (
    <PublicShell>
      {(restaurant) => {
        const gallery = restaurant.images.filter((image) => ["gallery", "food"].includes(image.image_type));
        const heroImage = restaurant.hero_image || gallery[0]?.url || "";
        const menuCount = restaurant.categories.reduce((total, category) => total + category.items.length, 0);
        const allItems = restaurant.categories.flatMap((category) => category.items);
        const featuredItems = allItems.filter((item) => item.is_available).slice(0, 3);
        const cuisineLine = restaurant.theme?.name || restaurant.categories[0]?.name || "Fresh from the kitchen";

        return (
          <main className="luxury-shell">
            <section
              className="noise relative flex min-h-[100svh] items-end overflow-hidden bg-cover bg-center text-white"
              style={{
                backgroundImage: heroImage
                  ? `linear-gradient(90deg, rgba(10,8,5,.92), rgba(10,8,5,.58) 44%, rgba(10,8,5,.14)), url(${heroImage})`
                  : "linear-gradient(135deg, #171511, #3b251f 48%, #171511)",
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(255,255,255,.16),transparent_18rem)]" />
              <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-4 pb-12 pt-36 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:pb-20">
                <div className="fade-up">
                  <p className="luxury-kicker inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-bold backdrop-blur">
                    <Sparkles size={14} /> {restaurant.city || "Local dining"} / {cuisineLine}
                  </p>
                  <h1 className="mt-6 max-w-5xl text-balance text-5xl font-semibold leading-[.88] sm:text-7xl lg:text-8xl">
                    {restaurant.tagline || `${restaurant.name}, ready for your next table.`}
                  </h1>
                  <p className="mt-7 max-w-2xl text-base leading-8 text-white/82 sm:text-lg">
                    {restaurant.description || `Explore the menu, reserve a table, and order directly from ${restaurant.name}.`}
                  </p>
                  <div className="mt-9 flex flex-wrap gap-3">
                    <Link href={`/restaurants/${restaurant.slug}#menu`} className="luxury-button flex items-center gap-2 rounded-full bg-white px-7 py-4 font-semibold text-slate-950 shadow-2xl">
                      View the menu <ArrowRight size={18} />
                    </Link>
                    <Link href={`/restaurants/${restaurant.slug}#reserve`} className="luxury-button rounded-full border border-white/40 bg-white/10 px-7 py-4 font-semibold backdrop-blur">
                      Reserve a table
                    </Link>
                  </div>
                  <div className="mt-8 grid max-w-2xl grid-cols-3 divide-x divide-white/15 rounded-3xl border border-white/15 bg-black/25 text-center text-sm backdrop-blur-xl">
                    <div className="p-4"><b className="block text-2xl">{restaurant.categories.length}</b><span className="text-white/65">Menu sections</span></div>
                    <div className="p-4"><b className="block text-2xl">{menuCount}</b><span className="text-white/65">Dishes online</span></div>
                    <div className="p-4"><b className="block text-2xl">Direct</b><span className="text-white/65">Reservations</span></div>
                  </div>
                </div>

                <div className="hidden lg:block">
                  <div className="luxury-hero-shadow rounded-[2rem] border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
                    <div className="grid grid-cols-2 gap-3">
                      {(gallery.length > 0 ? gallery.slice(0, 4) : [{ url: heroImage, id: 0, alt_text: restaurant.name }]).map((image, index) => (
                        <img
                          key={image.id || image.url}
                          src={image.url}
                          alt={image.alt_text || restaurant.name}
                          className={`w-full rounded-2xl object-cover ${index === 0 ? "col-span-2 h-72" : "h-40"}`}
                        />
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs font-semibold text-white/75">
                      <span className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3"><Utensils className="mx-auto mb-2" size={16} />Menu</span>
                      <span className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3"><Wine className="mx-auto mb-2" size={16} />Pairings</span>
                      <span className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3"><Star className="mx-auto mb-2" size={16} />Service</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="border-b border-black/10 bg-white/90 shadow-sm backdrop-blur">
              <div className="mx-auto grid max-w-7xl divide-y px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
                <div className="flex gap-4 py-7 md:pr-8">
                  <MapPin className="shrink-0 text-tomato" />
                  <div>
                    <p className="font-semibold">{restaurant.address || "Address coming soon"}</p>
                    <p className="text-sm text-stone-500">{restaurant.postal_code} {restaurant.city}</p>
                  </div>
                </div>
                <div className="flex gap-4 py-7 md:px-8">
                  <Phone className="shrink-0 text-tomato" />
                  <div>
                    <p className="font-semibold">{restaurant.phone || "Call for details"}</p>
                    <p className="text-sm text-stone-500">Reservations and questions</p>
                  </div>
                </div>
                <div className="flex gap-4 py-7 md:pl-8">
                  <ShieldCheck className="shrink-0 text-tomato" />
                  <div>
                    <p className="font-semibold">Order from the restaurant</p>
                    <p className="text-sm text-stone-500">Menu, allergies, and pickup in one place</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="story" className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:py-28">
              <div>
                <p className="luxury-kicker text-xs font-bold text-tomato">Restaurant story</p>
                <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">
                  Food, atmosphere, and hospitality before you arrive.
                </h2>
              </div>
              <div className="premium-card rounded-[2rem] p-6 sm:p-8">
                <p className="text-lg leading-8 text-stone-600">{restaurant.story || restaurant.description}</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {featuredItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/restaurants/${restaurant.slug}#menu`}
                      className="luxury-button rounded-2xl border border-black/10 bg-white p-4 shadow-sm hover:border-black/20"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Signature</p>
                      <p className="mt-2 font-semibold">{item.name}</p>
                      <p className="mt-1 text-sm text-stone-500">EUR {Number(item.price).toFixed(2)}</p>
                    </Link>
                  ))}
                </div>
                <Link href={`/restaurants/${restaurant.slug}`} className="mt-8 inline-flex items-center gap-2 font-semibold text-tomato">
                  See menu, reservations, and ordering <ArrowRight size={18} />
                </Link>
              </div>
            </section>

            {gallery.length > 0 && (
              <section id="gallery" className="grid gap-3 px-3 pb-3 md:grid-cols-3">
                {gallery.slice(0, 3).map((image, index) => (
                  <img
                    key={image.id}
                    src={image.url}
                    alt={image.alt_text || `${restaurant.name} food and atmosphere`}
                    className={`art-frame w-full rounded-[1.5rem] object-cover transition duration-500 hover:scale-[1.01] ${index === 0 ? "h-[460px] md:col-span-2" : "h-[360px]"}`}
                  />
                ))}
              </section>
            )}
          </main>
        );
      }}
    </PublicShell>
  );
}
