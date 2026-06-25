"use client";

import { useEffect, useState } from "react";

import { getRestaurant } from "@/lib/api";
import type { Restaurant } from "@/lib/types";
import ChatWidget from "./ChatWidget";
import Footer from "./Footer";
import Header from "./Header";

export default function PublicShell({
  children,
}: {
  children: (restaurant: Restaurant) => React.ReactNode;
}) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getRestaurant().then(setRestaurant).catch((reason) => setError(reason.message));
  }, []);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center p-8 text-center">
        <div className="max-w-lg rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-semibold">The kitchen is not connected yet.</h1>
          <p className="mt-3 text-stone-600">{error}</p>
        </div>
      </main>
    );
  }

  if (!restaurant) {
    return <main className="grid min-h-screen place-items-center text-stone-500">Preparing the table...</main>;
  }

  const primary = restaurant.primary_color || restaurant.theme?.primary_color || "#c84b31";

  return (
    <>
      <Header name={restaurant.name} />
      {children(restaurant)}
      <Footer restaurant={restaurant} />
      <ChatWidget slug={restaurant.slug} restaurantName={restaurant.name} primaryColor={primary} />
    </>
  );
}
