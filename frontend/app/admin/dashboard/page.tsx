"use client";

import {
  Bot,
  Building2,
  CalendarDays,
  CircleHelp,
  Clock3,
  Image as ImageIcon,
  type LucideIcon,
  Menu,
  Paintbrush,
  Plus,
  ShoppingBag,
  TrendingUp,
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
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    Promise.all([
      adminRequest<DashboardStats>("/admin/dashboard", token),
      adminRequest<RestaurantOverview[]>("/admin/restaurants-overview", token),
      adminRequest<User>("/auth/me", token),
    ])
      .then(([statsData, restaurantData, userData]) => {
        setStats(statsData);
        setRestaurants(restaurantData);
        setMe(userData);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load dashboard."));
  }, []);

  if (error) {
    return (
      <AdminShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">{error}</div>
      </AdminShell>
    );
  }

  if (!me || !stats) {
    return (
      <AdminShell>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-white/75" />)}
        </div>
      </AdminShell>
    );
  }

  if (me.role === "RESTAURANT_OWNER") {
    const restaurant = restaurants[0];
    const ownerCards = restaurant
      ? [
          ["New reservations", restaurant.new_reservations, CalendarDays, "bg-emerald-50 text-emerald-700"],
          ["New orders", stats.new_orders, ShoppingBag, "bg-pink-50 text-pink-700"],
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
        <DashboardHero
          eyebrow="Owner workspace"
          title={restaurant ? restaurant.name : "Your restaurant"}
          description="The important work for today: keep the website polished, answer customers, and move orders forward."
        />

        {!restaurant ? (
          <EmptyState title="No restaurant assigned" description="A platform admin needs to assign a restaurant to this owner account before the dashboard can show operations." />
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {ownerCards.map(([label, value, Icon, color]) => <StatCard key={label} label={label} value={value} icon={Icon} color={color} />)}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
              <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold">Website readiness</h2>
                    <p className="mt-1 text-sm text-slate-500">Complete these items before showing customers the site.</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${restaurant.is_published ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {restaurant.is_published ? "Website live" : "Draft"}
                  </span>
                </div>
                <div className="mt-5"><SetupProgress checklist={restaurant.checklist} percent={restaurant.setup_percent} /></div>
              </section>

              <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold">Quick actions</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {quickActions.map(([label, path, Icon]) => (
                    <Link key={path} href={`/admin/restaurants/${restaurant.id}/${path}`} className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition hover:border-slate-400 hover:bg-slate-50">
                      <span className="flex items-center gap-3"><Icon size={17} className="text-orange-600" />{label}</span>
                      <span className="text-slate-300">→</span>
                    </Link>
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
    ["Restaurants", stats.restaurants, Building2, "bg-blue-50 text-blue-700"],
    ["Owners", stats.owners, Users, "bg-violet-50 text-violet-700"],
    ["Reservations", stats.reservations, CalendarDays, "bg-emerald-50 text-emerald-700"],
    ["AI conversations", stats.conversations, Bot, "bg-orange-50 text-orange-700"],
    ["Needs an answer", stats.unanswered, CircleHelp, "bg-red-50 text-red-700"],
    ["New orders", stats.new_orders, ShoppingBag, "bg-pink-50 text-pink-700"],
  ] as const;

  const attention = [...restaurants].sort((a, b) => {
    const aScore = a.setup_percent - a.new_orders * 10 - a.unanswered_count * 8 - a.new_reservations * 4;
    const bScore = b.setup_percent - b.new_orders * 10 - b.unanswered_count * 8 - b.new_reservations * 4;
    return aScore - bScore;
  });

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <DashboardHero
          eyebrow="Business overview"
          title="RestaurantAI control center"
          description="A clean operating view for launching restaurants, spotting support gaps, and keeping demos presentation-ready."
        />
        <Link href="/admin/restaurants/new" className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          <Plus size={17} /> Create restaurant
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(([label, value, Icon, color]) => <StatCard key={label} label={label} value={value} icon={Icon} color={color} />)}
      </div>

      <section className="mt-8 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Restaurants needing attention</h2>
            <p className="mt-1 text-sm text-slate-500">Prioritized by setup progress, new orders, reservations, and unanswered AI questions.</p>
          </div>
          <Link href="/admin/restaurants" className="text-sm font-semibold text-orange-600">View all restaurants</Link>
        </div>

        {attention.length === 0 ? (
          <EmptyState title="No restaurants yet" description="Create the first restaurant to start building a sellable demo." />
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {attention.slice(0, 3).map((restaurant) => <RestaurantOverviewCard key={restaurant.id} restaurant={restaurant} />)}
          </div>
        )}
      </section>
    </AdminShell>
  );
}

function DashboardHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-orange-600">{eyebrow}</p>
      <h1 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-slate-500">{description}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex rounded-xl p-2.5 ${color}`}><Icon size={20} /></span>
        <TrendingUp size={16} className="text-slate-300" />
      </div>
      <p className="mt-5 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed bg-white/70 p-8 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
