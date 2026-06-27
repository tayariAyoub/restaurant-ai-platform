"use client";

import { useEffect, useState } from "react";

import RestaurantSite from "@/components/RestaurantSite";
import { getRestaurantBySlug } from "@/lib/api";
import type { Restaurant } from "@/lib/types";

export default function RestaurantWebsiteClient({
  slug,
  initialRestaurant = null,
}: {
  slug: string;
  initialRestaurant?: Restaurant | null;
}) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(initialRestaurant);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialRestaurant) return;
    getRestaurantBySlug(slug).then(setRestaurant).catch((reason) => setError(reason.message));
  }, [initialRestaurant, slug]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center p-8 text-center">
        <div className="max-w-lg rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-semibold">Restaurant not found</h1>
          <p className="mt-3 text-slate-500">{error}</p>
        </div>
      </main>
    );
  }

  if (!restaurant) {
    return <main className="grid min-h-screen place-items-center text-slate-500">Preparing the restaurant...</main>;
  }

  return <RestaurantSite restaurant={restaurant} />;
}
