"use client";

import { Leaf } from "lucide-react";

import PublicShell from "@/components/PublicShell";

export default function MenuPage() {
  return (
    <PublicShell>
      {(restaurant) => (
        <main>
          <section className="bg-ink px-6 pb-20 pt-36 text-center text-white">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-orange-300">Eat well</p>
            <h1 className="mt-4 text-5xl font-semibold sm:text-6xl">Our menu</h1>
            <p className="mx-auto mt-5 max-w-xl text-stone-400">
              Browse the live menu, including dietary labels and allergen notes from the restaurant.
            </p>
          </section>
          <section className="mx-auto max-w-5xl px-6 py-20">
            {restaurant.categories.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-stone-500">
                This restaurant has not published menu categories yet.
              </div>
            ) : (
              restaurant.categories.map((category) => (
                <div key={category.id} className="mb-20">
                  <div className="mb-8 border-b border-black/15 pb-5">
                    <h2 className="text-4xl font-semibold">{category.name}</h2>
                    <p className="mt-2 text-stone-500">{category.description}</p>
                  </div>
                  <div className="grid gap-x-14 gap-y-10 md:grid-cols-2">
                    {category.items.filter((item) => item.is_available).map((item) => (
                      <article key={item.id} className="group rounded-2xl bg-white p-5 shadow-sm">
                        {item.image_url && <img src={item.image_url} alt={item.name} className="mb-4 h-44 w-full rounded-xl object-cover" />}
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-2xl font-semibold">{item.name}</h3>
                          <span className="mt-1 shrink-0 font-semibold text-tomato">EUR {Number(item.price).toFixed(2)}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-stone-600">{item.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider">
                          {item.is_vegan && <span className="flex items-center gap-1 text-olive"><Leaf size={13} /> Vegan</span>}
                          {!item.is_vegan && item.is_vegetarian && <span className="flex items-center gap-1 text-olive"><Leaf size={13} /> Vegetarian</span>}
                          {item.is_halal && <span className="text-olive">Halal</span>}
                        </div>
                        {item.allergens && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Allergens: {item.allergens}</p>}
                      </article>
                    ))}
                  </div>
                </div>
              ))
            )}
            <p className="rounded-2xl bg-white p-5 text-center text-sm text-stone-500 shadow-sm">
              Please tell our team about allergies before ordering. Our kitchen handles common allergens and cannot guarantee zero cross-contact.
            </p>
          </section>
        </main>
      )}
    </PublicShell>
  );
}
