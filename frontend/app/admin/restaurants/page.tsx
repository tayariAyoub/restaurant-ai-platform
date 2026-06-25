"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/admin/AdminShell";
import RestaurantOverviewCard from "@/components/admin/RestaurantOverviewCard";
import { adminRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { RestaurantOverview, User } from "@/lib/types";

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantOverview[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [owner, setOwner] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    const data = await adminRequest<RestaurantOverview[]>("/admin/restaurants-overview", getToken());
    setRestaurants(data);
    setLoading(false);
  };

  useEffect(() => {
    const requestedStatus = new URLSearchParams(window.location.search).get("status");
    if (requestedStatus) setStatus(requestedStatus);
    load();
    adminRequest<User>("/auth/me", getToken()).then(setMe);
  }, []);

  const owners = useMemo(
    () => Array.from(new Set(restaurants.map((restaurant) => restaurant.owner_name || restaurant.owner_email).filter(Boolean))),
    [restaurants],
  );

  const filtered = useMemo(() => restaurants.filter((restaurant) => {
    const haystack = `${restaurant.name} ${restaurant.city} ${restaurant.slug} ${restaurant.owner_name} ${restaurant.owner_email}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesStatus =
      status === "all" ||
      (status === "live" && restaurant.is_published) ||
      (status === "draft" && !restaurant.is_published) ||
      (status === "ready" && restaurant.setup_percent >= 90 && restaurant.is_published) ||
      (status === "incomplete" && restaurant.setup_percent < 90) ||
      (status === "missing-owner" && !restaurant.owner_name && !restaurant.owner_email) ||
      (status === "needs-help" && (restaurant.unanswered_count > 0 || restaurant.new_orders > 0 || restaurant.new_reservations > 0));
    const restaurantOwner = restaurant.owner_name || restaurant.owner_email;
    return matchesQuery && matchesStatus && (owner === "all" || restaurantOwner === owner);
  }), [restaurants, query, status, owner]);

  async function remove(id: number, name: string) {
    if (!confirm(`Delete ${name} and all its data?`)) return;
    await adminRequest(`/admin/restaurants/${id}`, getToken(), { method: "DELETE" });
    setMessage(`${name} deleted.`);
    load();
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-orange-600">Customer websites</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">Restaurants</h1>
          <p className="mt-2 text-slate-500">{loading ? "Loading restaurants..." : `${filtered.length} of ${restaurants.length} restaurants shown`}</p>
        </div>
        {me?.role === "SUPER_ADMIN" && (
          <Link href="/admin/restaurants/new" className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg">
            <Plus size={17} /> New restaurant
          </Link>
        )}
      </div>

      {message && <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</div>}

      <div className="mt-7 grid gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto]">
        <label className="relative">
          <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-xl border py-3 pl-10 pr-4 text-sm" placeholder="Search restaurant, city, owner, or slug..." />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border px-4 py-3 text-sm">
          <option value="all">All statuses</option>
          <option value="ready">Ready and live</option>
          <option value="live">Active/live</option>
          <option value="draft">Inactive/draft</option>
          <option value="incomplete">Setup incomplete</option>
          <option value="missing-owner">Missing owner</option>
          <option value="needs-help">Needs help</option>
        </select>
        {me?.role === "SUPER_ADMIN" && (
          <select value={owner} onChange={(event) => setOwner(event.target.value)} className="rounded-xl border px-4 py-3 text-sm">
            <option value="all">All owners</option>
            {owners.map((name) => <option key={name}>{name}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-96 animate-pulse rounded-2xl bg-white/80" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed bg-white p-10 text-center text-slate-500">
          No restaurants match these filters. Clear the search or create a new restaurant demo.
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((restaurant) => (
            <RestaurantOverviewCard key={restaurant.id} restaurant={restaurant} canDelete={me?.role === "SUPER_ADMIN"} onDelete={() => remove(restaurant.id, restaurant.name)} />
          ))}
        </div>
      )}
    </AdminShell>
  );
}
