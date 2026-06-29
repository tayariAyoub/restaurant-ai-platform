"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Header({ name = "Bella Napoli" }: { name?: string }) {
  const [open, setOpen] = useState(false);
  const restaurantBasePath = "/restaurants/bella-napoli";
  const links = [
    ["Home", restaurantBasePath],
    ["Menu", `${restaurantBasePath}/menu`],
    ["Gallery", `${restaurantBasePath}/gallery`],
    ["Visit", `${restaurantBasePath}/contact`],
  ];
  return (
    <header className="absolute inset-x-0 top-0 z-30 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href={restaurantBasePath} className="font-display text-2xl font-semibold tracking-wide">
          {name}
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-orange-200">
              {label}
            </Link>
          ))}
          <Link
            href={`${restaurantBasePath}/reservations`}
            className="rounded-full border border-white/50 bg-white px-5 py-2.5 font-medium text-ink transition hover:bg-orange-50"
          >
            Book a table
          </Link>
        </nav>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="mx-4 flex flex-col gap-4 rounded-2xl bg-ink/95 p-6 md:hidden">
          {links.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
