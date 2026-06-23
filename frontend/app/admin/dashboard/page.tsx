"use client";

import {
  Bot,
  Building2,
  CalendarDays,
  CircleHelp,
  Clock3,
  Image as ImageIcon,
  Menu,
  Paintbrush,
  Plus,
  ShoppingBag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import AdminShell from "@/components/admin/AdminShell";
import RestaurantOverviewCard from "@/components/admin/RestaurantOverviewCard";
import SetupProgress from "@/components/admin/SetupProgress";
import { adminRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { DashboardStats, RestaurantOverview, User } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantOverview[]>([]);
  const [me, setMe] = useState<User | null>(null);

  useEffect(() => {
    const token = getToken();
    Promise.all([
      adminRequest<DashboardStats>("/admin/dashboard", token),
      adminRequest<RestaurantOverview[]>("/admin/restaurants-overview", token),
      adminRequest<User>("/auth/me", token),
    ]).then(([statsData, restaurantData, userData]) => {
      setStats(statsData);
      setRestaurants(restaurantData);
      setMe(userData);
    });
  }, []);

  if (me?.role === "RESTAURANT_OWNER") {
    const restaurant = restaurants[0];
    const ownerCards = restaurant
      ? [
          ["New reservations", restaurant.new_reservations, CalendarDays, "bg-emerald-50 text-emerald-700"],
          ["New orders", stats?.new_orders ?? 0, ShoppingBag, "bg-pink-50 text-pink-700"],
          ["Needs an answer", restaurant.unanswered_count, CircleHelp, "bg-red-50 text-red-700"],
          ["AI conversations", restaurant.conversation_count, Bot, "bg-orange-50 text-orange-700"],
          ["Menu items", restaurant.menu_items, Menu, "bg-blue-50 text-blue-700"],
        ] as const
      : [];
    const quickActions = [
      ["Manage live orders", "orders", ShoppingBag],
      ["Update opening hours", "edit", Clock3],
      ["Edit menu", "menu", Menu],
      ["Upload a photo", "images", ImageIcon],
      ["Change website design", "design", Paintbrush],
      ["Review AI questions", "chatbot", Bot],
      ["Manage reservations", "reservations", CalendarDays],
    ] as const;
    return (
      <AdminShell>
        <div>
          <p className="text-sm font-semibold text-orange-600">Good to see you</p>
          <h1 className="mt-1 text-4xl font-semibold">{restaurant ? restaurant.name : "Your restaurant"}</h1>
          <p className="mt-2 text-slate-500">The important things for today, without the SaaS machinery.</p>
        </div>
        {!restaurant ? (
          <div className="mt-8 rounded-2xl border bg-white p-8 text-center text-slate-500">No restaurant has been assigned to your account yet.</div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {ownerCards.map(([label, value, Icon, color]) => (
                <div key={String(label)} className="rounded-2xl border bg-white p-5">
                  <span className={`inline-flex rounded-xl p-2.5 ${color}`}><Icon size={20} /></span>
                  <p className="mt-4 text-3xl font-bold">{value}</p><p className="mt-1 text-sm text-slate-500">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
              <section className="rounded-2xl border bg-white p-6">
                <div className="flex items-center justify-between"><h2 className="text-2xl font-semibold">Finish your website</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${restaurant.is_published ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{restaurant.is_published ? "Website live" : "Draft"}</span></div>
                <div className="mt-5"><SetupProgress checklist={restaurant.checklist} percent={restaurant.setup_percent} /></div>
              </section>
              <section className="rounded-2xl border bg-white p-6">
                <h2 className="text-2xl font-semibold">Quick actions</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {quickActions.map(([label, path, Icon]) => (
                    <Link key={String(path)} href={`/admin/restaurants/${restaurant.id}/${path}`} className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold hover:border-slate-400 hover:bg-slate-50"><Icon size={17} className="text-orange-600" />{label}</Link>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </AdminShell>
    );
  }

  const cards = [
    ["Restaurants", stats?.restaurants ?? "–", Building2, "bg-blue-50 text-blue-700"],
    ["Owners", stats?.owners ?? "–", Users, "bg-violet-50 text-violet-700"],
    ["Reservations", stats?.reservations ?? "–", CalendarDays, "bg-emerald-50 text-emerald-700"],
    ["AI conversations", stats?.conversations ?? "–", Bot, "bg-orange-50 text-orange-700"],
      ["Needs an answer", stats?.unanswered ?? "–", CircleHelp, "bg-red-50 text-red-700"],
      ["New orders", stats?.new_orders ?? "–", ShoppingBag, "bg-pink-50 text-pink-700"],
  ] as const;

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-orange-600">Business overview</p><h1 className="mt-1 text-4xl font-semibold">RestaurantAI control center</h1><p className="mt-2 text-slate-500">See which customer websites need attention and act quickly.</p></div>
        <Link href="/admin/restaurants/new" className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"><Plus size={17} /> Create restaurant</Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(([label, value, Icon, color]) => (
          <div key={label} className="rounded-2xl border bg-white p-5">
            <span className={`inline-flex rounded-xl p-2.5 ${color}`}><Icon size={20} /></span>
            <p className="mt-5 text-3xl font-bold">{value}</p><p className="mt-1 text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-between"><div><h2 className="text-2xl font-semibold">Restaurants needing attention</h2><p className="mt-1 text-sm text-slate-500">Lowest setup completion appears first.</p></div><Link href="/admin/restaurants" className="text-sm font-semibold text-orange-600">View and filter all</Link></div>
      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[...restaurants].sort((a, b) => a.setup_percent - b.setup_percent).slice(0, 3).map((restaurant) => <RestaurantOverviewCard key={restaurant.id} restaurant={restaurant} />)}
      </div>
    </AdminShell>
  );
}
