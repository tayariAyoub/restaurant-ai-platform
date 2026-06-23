"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import RestaurantSite from "@/components/RestaurantSite";
import { getRestaurantBySlug } from "@/lib/api";
import type { Restaurant } from "@/lib/types";

export default function RestaurantWebsite() {
  const params = useParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { getRestaurantBySlug(params.slug).then(setRestaurant).catch((reason) => setError(reason.message)); }, [params.slug]);
  if (error) return <main className="grid min-h-screen place-items-center p-8 text-center"><div><h1 className="text-4xl">Restaurant not found</h1><p className="mt-3 text-slate-500">{error}</p></div></main>;
  if (!restaurant) return <main className="grid min-h-screen place-items-center text-slate-500">Preparing the restaurant…</main>;
  return <RestaurantSite restaurant={restaurant} />;
}
