"use client";

import { useEffect, useState } from "react";

import RestaurantPageSkeleton from "@/components/RestaurantPageSkeleton";
import RestaurantSite from "@/components/RestaurantSite";
import { getRestaurantBySlug } from "@/lib/api";
import { getLocalDevelopmentRestaurantFallbackForError } from "@/lib/mockRestaurants";
import type { Restaurant } from "@/lib/types";
import type { PublicRestaurantPage } from "./restaurantPageData";

export default function RestaurantWebsiteClient({
  slug,
  initialRestaurant = null,
  page = "home",
}: {
  slug: string;
  initialRestaurant?: Restaurant | null;
  page?: PublicRestaurantPage;
}) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(initialRestaurant);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialRestaurant) return;
    getRestaurantBySlug(slug).then(setRestaurant).catch((reason) => {
      const fallback = getLocalDevelopmentRestaurantFallbackForError(slug, reason);

      if (fallback) {
        setRestaurant(fallback);
        return;
      }

      setError(reason instanceof Error ? reason.message : "Restaurant could not be loaded.");
    });
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
    return <RestaurantPageSkeleton />;
  }

  return <RestaurantSite restaurant={restaurant} page={page} />;
}
