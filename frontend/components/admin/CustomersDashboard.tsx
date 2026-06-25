"use client";

import { CalendarDays, Mail, Phone, Search, ShoppingBag, Star, StickyNote, type LucideIcon, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { adminRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ContactRequest, Restaurant, RestaurantOrder } from "@/lib/types";
import AdminShell from "./AdminShell";
import RestaurantNav from "./RestaurantNav";

type CustomerProfile = {
  key: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  reservationCount: number;
  totalSpend: number;
  lastActivity: string;
  lastOrder?: RestaurantOrder;
  lastReservation?: ContactRequest;
  favoriteItems: { name: string; quantity: number }[];
  preferences: string[];
};

export default function CustomersDashboard({ id }: { id: number }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [reservations, setReservations] = useState<ContactRequest[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "orders" | "reservations" | "preferences">("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    Promise.all([
      adminRequest<Restaurant>(`/admin/restaurants/${id}`, token),
      adminRequest<RestaurantOrder[]>(`/admin/restaurants/${id}/orders`, token),
      adminRequest<ContactRequest[]>(`/admin/restaurants/${id}/reservations`, token),
    ])
      .then(([restaurantData, orderData, reservationData]) => {
        setRestaurant(restaurantData);
        setOrders(orderData);
        setReservations(reservationData);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load customers."))
      .finally(() => setLoading(false));
  }, [id]);

  const customers = useMemo(() => buildCustomers(orders, reservations), [orders, reservations]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesSearch = !term || [customer.name, customer.email, customer.phone, customer.favoriteItems.map((item) => item.name).join(" "), customer.preferences.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(term);
      const matchesFilter =
        filter === "all" ||
        (filter === "orders" && customer.totalOrders > 0) ||
        (filter === "reservations" && customer.reservationCount > 0) ||
        (filter === "preferences" && customer.preferences.length > 0);
      return matchesSearch && matchesFilter;
    });
  }, [customers, filter, query]);

  const totalSpend = customers.reduce((sum, customer) => sum + customer.totalSpend, 0);
  const repeatCustomers = customers.filter((customer) => customer.totalOrders + customer.reservationCount > 1).length;

  if (error) {
    return (
      <AdminShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">{error}</div>
      </AdminShell>
    );
  }

  if (loading || !restaurant) {
    return (
      <AdminShell>
        <div className="rounded-2xl border bg-white p-6 text-slate-500 shadow-sm">Loading customer profiles...</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <RestaurantNav id={id} active="customers" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-orange-600">Customer CRM</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">Customers for {restaurant.name}</h1>
          <p className="mt-3 max-w-2xl text-slate-500">A light CRM built from orders and reservations, so staff can recognize regulars and understand customer value.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Known customers" value={customers.length} />
        <MetricCard icon={ShoppingBag} label="Total orders" value={orders.length} />
        <MetricCard icon={CalendarDays} label="Reservations" value={reservations.length} />
        <MetricCard icon={Star} label="Repeat customers" value={repeatCustomers} helper={`EUR ${totalSpend.toFixed(0)} tracked spend`} />
      </div>

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none focus:border-slate-500"
              placeholder="Search by name, phone, email, favorite dish, allergy, or preference..."
            />
          </label>
          <div className="flex gap-2 overflow-x-auto">
            {(["all", "orders", "reservations", "preferences"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-semibold capitalize ${filter === value ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </section>

      {customers.length === 0 ? (
        <EmptyState title="No customers yet" description="Customers will appear here automatically after the first order or reservation." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matching customers" description="Try a different search term or filter." />
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {filtered.map((customer) => <CustomerCard key={customer.key} customer={customer} />)}
        </div>
      )}
    </AdminShell>
  );
}

function CustomerCard({ customer }: { customer: CustomerProfile }) {
  return (
    <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{customer.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
            {customer.phone && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1"><Phone size={14} /> {customer.phone}</span>}
            {customer.email && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1"><Mail size={14} /> {customer.email}</span>}
          </div>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right text-emerald-800">
          <p className="text-xs font-bold uppercase tracking-[0.16em]">Spend</p>
          <p className="text-xl font-bold">EUR {customer.totalSpend.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniMetric label="Orders" value={customer.totalOrders} />
        <MiniMetric label="Reservations" value={customer.reservationCount} />
        <MiniMetric label="Last activity" value={formatDate(customer.lastActivity)} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold">Favorite items</p>
          {customer.favoriteItems.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No ordered items yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {customer.favoriteItems.map((item) => (
                <p key={item.name} className="flex justify-between rounded-xl bg-white px-3 py-2 text-sm">
                  <span>{item.name}</span>
                  <b>{item.quantity}x</b>
                </p>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-950">Allergies and preferences</p>
          {customer.preferences.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-amber-800">No allergy or preference notes found in orders or reservations.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {customer.preferences.map((preference) => <span key={preference} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900">{preference}</span>)}
            </div>
          )}
        </section>
      </div>

      <div className="mt-5 rounded-2xl border border-dashed p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-700"><StickyNote size={16} /> Owner notes</p>
        <textarea
          disabled
          placeholder="Saved notes and manual preferences will be added in the next CRM phase."
          className="mt-3 min-h-20 w-full resize-none rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-500"
        />
      </div>
    </article>
  );
}

function buildCustomers(orders: RestaurantOrder[], reservations: ContactRequest[]): CustomerProfile[] {
  const customers = new Map<string, CustomerProfile>();

  for (const order of orders) {
    const customer = getOrCreateCustomer(customers, order.customer_name, order.customer_email, order.customer_phone, order.created_at);
    customer.totalOrders += 1;
    customer.totalSpend += Number(order.total || 0);
    customer.lastOrder = chooseLatest(customer.lastOrder, order, (value) => value.created_at);
    customer.lastActivity = latestDate(customer.lastActivity, order.created_at);
    for (const item of order.items) {
      const existing = customer.favoriteItems.find((favorite) => favorite.name === item.item_name);
      if (existing) existing.quantity += item.quantity;
      else customer.favoriteItems.push({ name: item.item_name, quantity: item.quantity });
    }
    addPreferenceSnippets(customer.preferences, order.notes);
    for (const item of order.items) addPreferenceSnippets(customer.preferences, item.notes);
  }

  for (const reservation of reservations) {
    const customer = getOrCreateCustomer(customers, reservation.name, reservation.email, reservation.phone, reservation.created_at);
    customer.reservationCount += 1;
    customer.lastReservation = chooseLatest(customer.lastReservation, reservation, (value) => value.created_at);
    customer.lastActivity = latestDate(customer.lastActivity, reservation.requested_at || reservation.created_at);
    addPreferenceSnippets(customer.preferences, reservation.message);
  }

  return [...customers.values()]
    .map((customer) => ({
      ...customer,
      favoriteItems: customer.favoriteItems.sort((a, b) => b.quantity - a.quantity).slice(0, 3),
      preferences: [...new Set(customer.preferences)].slice(0, 5),
    }))
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
}

function getOrCreateCustomer(customers: Map<string, CustomerProfile>, name: string, email: string, phone: string, fallbackDate: string) {
  const key = customerKey(name, email, phone);
  const existing = customers.get(key);
  if (existing) {
    existing.name = existing.name || name || "Guest customer";
    existing.email = existing.email || email || "";
    existing.phone = existing.phone || phone || "";
    return existing;
  }
  const customer: CustomerProfile = {
    key,
    name: name || "Guest customer",
    email: email || "",
    phone: phone || "",
    totalOrders: 0,
    reservationCount: 0,
    totalSpend: 0,
    lastActivity: fallbackDate,
    favoriteItems: [],
    preferences: [],
  };
  customers.set(key, customer);
  return customer;
}

function customerKey(name: string, email: string, phone: string) {
  return (email || phone || name || "guest").trim().toLowerCase();
}

function addPreferenceSnippets(target: string[], value: string) {
  const text = value?.trim();
  if (!text) return;
  if (/(allerg|vegan|vegetarian|halal|gluten|nut|dairy|lactose|spicy|preference|prefer|birthday|anniversary)/i.test(text)) {
    target.push(text.length > 90 ? `${text.slice(0, 87)}...` : text);
  }
}

function chooseLatest<T>(current: T | undefined, next: T, getDate: (value: T) => string) {
  if (!current) return next;
  return new Date(getDate(next)).getTime() > new Date(getDate(current)).getTime() ? next : current;
}

function latestDate(current: string, next: string) {
  if (!next) return current;
  return new Date(next).getTime() > new Date(current).getTime() ? next : current;
}

function formatDate(value: string) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function MetricCard({ icon: Icon, label, value, helper }: { icon: LucideIcon; label: string; value: number; helper?: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <Icon className="text-orange-600" size={22} />
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
      {helper && <p className="mt-2 text-xs font-semibold text-slate-400">{helper}</p>}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed bg-white p-10 text-center shadow-sm">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
