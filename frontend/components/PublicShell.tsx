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
        <div>
          <h1 className="text-4xl">The kitchen is not connected yet.</h1>
          <p className="mt-3 text-stone-600">{error}</p>
        </div>
      </main>
    );
  }
  if (!restaurant) {
    return <main className="grid min-h-screen place-items-center text-stone-500">Preparing the table…</main>;
  }
  return (
    <>
      <Header name={restaurant.name} />
      {children(restaurant)}
      <Footer restaurant={restaurant} />
      <ChatWidget />
    </>
  );
}

