"use client";

import {
  Bike,
  Check,
  ChefHat,
  Clock3,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import AdminShell from "./AdminShell";
import RestaurantNav from "./RestaurantNav";
import { adminRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { DeliveryDriver, Restaurant, RestaurantOrder } from "@/lib/types";

const statusLabels: Record<string, string> = {
  NEW: "New",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  PICKED_UP: "Picked up",
  DELIVERING: "On the way",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

const statusColors: Record<string, string> = {
  NEW: "bg-orange-100 text-orange-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-violet-100 text-violet-800",
  READY: "bg-green-100 text-green-800",
  DELIVERING: "bg-cyan-100 text-cyan-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-slate-100 text-slate-700",
  REJECTED: "bg-red-100 text-red-800",
  PICKED_UP: "bg-emerald-100 text-emerald-800",
};

export default function OrdersDashboard({ id }: { id: number }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [view, setView] = useState<"live" | "delivery" | "history" | "drivers">("live");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const token = getToken();
    const [restaurantData, orderData, driverData] = await Promise.all([
      adminRequest<Restaurant>(`/admin/restaurants/${id}`, token),
      adminRequest<RestaurantOrder[]>(`/admin/restaurants/${id}/orders`, token),
      adminRequest<DeliveryDriver[]>(`/admin/restaurants/${id}/drivers`, token),
    ]);
    setRestaurant(restaurantData);
    setOrders(orderData);
    setDrivers(driverData);
  }, [id]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 10000);
    return () => window.clearInterval(timer);
  }, [load]);

  const filtered = useMemo(() => {
    if (view === "delivery") return orders.filter((order) => order.order_type === "DELIVERY" && !["COMPLETED", "REJECTED"].includes(order.status));
    if (view === "history") return orders.filter((order) => ["COMPLETED", "REJECTED", "DELIVERED", "PICKED_UP"].includes(order.status));
    if (view === "drivers") return [];
    return orders.filter((order) => !["COMPLETED", "REJECTED", "DELIVERED", "PICKED_UP"].includes(order.status));
  }, [orders, view]);

  async function updateOrder(order: RestaurantOrder, nextStatus: string) {
    let estimated: number | null = order.estimated_minutes;
    let reason = "";
    if (nextStatus === "ACCEPTED") {
      const value = prompt("Estimated preparation time in minutes", String(order.estimated_minutes || 25));
      if (value === null) return;
      estimated = Number(value);
    }
    if (nextStatus === "REJECTED") {
      reason = prompt("Reason for rejection", "Restaurant cannot fulfill this order") || "";
    }
    await adminRequest(`/admin/restaurants/${id}/orders/${order.id}`, getToken(), {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus, estimated_minutes: estimated, rejection_reason: reason }),
    });
    setStatus(`Order #${order.id} updated to ${statusLabels[nextStatus]}.`);
    load();
  }

  async function assignDriver(orderId: number, driverId: number) {
    if (!driverId) return;
    await adminRequest(`/admin/restaurants/${id}/orders/${orderId}/assign-driver`, getToken(), {
      method: "POST",
      body: JSON.stringify({ driver_id: driverId }),
    });
    setStatus("Driver assigned.");
    load();
  }

  async function deliveryStatus(orderId: number, nextStatus: string) {
    await adminRequest(`/admin/restaurants/${id}/orders/${orderId}/delivery-status`, getToken(), {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    });
    load();
  }

  async function addDriver(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    await adminRequest(`/admin/restaurants/${id}/drivers`, getToken(), {
      method: "POST",
      body: JSON.stringify(data),
    });
    form.reset();
    setStatus("Driver added.");
    load();
  }

  async function removeDriver(driverId: number) {
    if (!confirm("Remove this driver?")) return;
    try {
      await adminRequest(`/admin/restaurants/${id}/drivers/${driverId}`, getToken(), { method: "DELETE" });
      load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not remove driver.");
    }
  }

  if (!restaurant) return <AdminShell><p>Loading orders…</p></AdminShell>;
  const newCount = orders.filter((order) => order.status === "NEW").length;
  const tabs = [
    ["live", `Live orders (${newCount})`, ShoppingBag],
    ["delivery", "Delivery", Truck],
    ["history", "Order history", PackageCheck],
    ["drivers", "Drivers", Bike],
  ] as const;

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-orange-600">Online ordering</p><h1 className="mt-1 text-4xl font-semibold">{restaurant.name} orders</h1><p className="mt-2 text-slate-500">New orders refresh automatically every 10 seconds.</p></div>
        <button onClick={load} className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"><RefreshCw size={16} /> Refresh</button>
      </div>
      <RestaurantNav id={id} active="orders" />
      {status && <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{status}</div>}
      <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border bg-white p-2">
        {tabs.map(([key, label, Icon]) => (
          <button key={String(key)} onClick={() => setView(key as typeof view)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${view === key ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}><Icon size={16} />{label}</button>
        ))}
      </div>

      {view === "drivers" ? (
        <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
          <form onSubmit={addDriver} className="h-fit space-y-4 rounded-2xl border bg-white p-6"><h2 className="text-2xl font-semibold">Add delivery driver</h2><input name="name" required placeholder="Driver name" className="w-full rounded-xl border px-4 py-3" /><input name="phone" required placeholder="Phone number" className="w-full rounded-xl border px-4 py-3" /><button className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white">Add driver</button></form>
          <section className="rounded-2xl border bg-white p-6"><h2 className="text-2xl font-semibold">Delivery team</h2><div className="mt-4 divide-y">{drivers.length === 0 && <p className="py-5 text-slate-500">No drivers yet.</p>}{drivers.map((driver) => <div key={driver.id} className="flex items-center justify-between py-4"><div><p className="font-semibold">{driver.name}</p><p className="text-sm text-slate-500">{driver.phone}</p></div><button onClick={() => removeDriver(driver.id)} className="text-sm font-semibold text-red-600">Remove</button></div>)}</div></section>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.length === 0 && <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">No orders in this view.</div>}
          {filtered.map((order) => {
            const address = order.delivery_address;
            const destination = address ? `${address.street}, ${address.postal_code} ${address.city}` : "";
            const origin = `${restaurant.address}, ${restaurant.postal_code} ${restaurant.city}`;
            const mapUrl = `https://www.openstreetmap.org/directions?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}`;
            return (
              <article key={order.id} className={`rounded-2xl border bg-white p-5 ${order.status === "NEW" ? "border-orange-300 ring-2 ring-orange-100" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><div className="flex items-center gap-3"><h2 className="text-2xl font-bold">Order #{order.id}</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[order.status] || "bg-slate-100"}`}>{statusLabels[order.status] || order.status}</span></div><p className="mt-1 text-sm text-slate-500">{new Date(order.created_at).toLocaleString()} · {order.order_type.replace("_", " ")}</p></div>
                  <p className="text-2xl font-bold">€{Number(order.total).toFixed(2)}</p>
                </div>
                <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.8fr]">
                  <div>
                    <div className="space-y-2">{order.items.map((item) => <div key={item.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span><b>{item.quantity}×</b> {item.item_name}{item.notes && <small className="block text-slate-500">{item.notes}</small>}</span><span>€{Number(item.line_total).toFixed(2)}</span></div>)}</div>
                    {order.notes && <p className="mt-3 rounded-lg bg-yellow-50 p-3 text-sm"><b>Customer note:</b> {order.notes}</p>}
                  </div>
                  <div className="rounded-xl border p-4 text-sm">
                    <p className="font-semibold">{order.customer_name}</p><a href={`tel:${order.customer_phone}`} className="mt-2 flex items-center gap-2 text-blue-700"><Phone size={15} />{order.customer_phone}</a>
                    {address && <><p className="mt-4 flex items-start gap-2"><MapPin size={16} className="mt-0.5" />{destination}</p>{address.instructions && <p className="mt-1 text-slate-500">{address.instructions}</p>}{address.approximate_distance_km && <p className="mt-2 text-slate-500">Approx. {address.approximate_distance_km} km</p>}<a href={mapUrl} target="_blank" className="mt-3 inline-block font-semibold text-blue-700 underline">Open route map</a></>}
                    {order.estimated_minutes !== null && <p className="mt-4 flex items-center gap-2"><Clock3 size={16} />Estimated: {order.estimated_minutes} min</p>}
                  </div>
                </div>
                {order.order_type === "DELIVERY" && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-cyan-50 p-3"><select value={order.delivery_assignment?.driver_id || ""} onChange={(event) => assignDriver(order.id, Number(event.target.value))} className="rounded-lg border px-3 py-2 text-sm"><option value="">Assign driver</option>{drivers.filter((driver) => driver.is_active).map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}</select>{order.delivery_assignment && <><span className="text-sm font-semibold">{order.delivery_assignment.driver.name} · {order.delivery_assignment.status.replaceAll("_", " ")}</span>{order.delivery_assignment.status === "ASSIGNED" && <button onClick={() => deliveryStatus(order.id, "ON_THE_WAY")} className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-bold text-white">Mark on the way</button>}{order.delivery_assignment.status === "ON_THE_WAY" && <button onClick={() => deliveryStatus(order.id, "DELIVERED")} className="rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white">Mark delivered</button>}</>}</div>}
                {order.status_history.length > 0 && <details className="mt-4 rounded-xl bg-slate-50 p-3 text-sm"><summary className="cursor-pointer font-semibold">Status timeline</summary><div className="mt-3 space-y-2">{order.status_history.map((entry) => <div key={entry.id} className="flex justify-between gap-4"><span>{statusLabels[entry.status] || entry.status}{entry.note ? ` · ${entry.note}` : ""}</span><span className="shrink-0 text-xs text-slate-400">{new Date(entry.created_at).toLocaleTimeString()}</span></div>)}</div></details>}
                <div className="mt-5 flex flex-wrap gap-2">
                  {order.status === "NEW" && <><button onClick={() => updateOrder(order, "ACCEPTED")} className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-bold text-white"><Check size={16} /> Accept</button><button onClick={() => updateOrder(order, "REJECTED")} className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700"><X size={16} /> Reject</button></>}
                  {order.status === "ACCEPTED" && <button onClick={() => updateOrder(order, "PREPARING")} className="flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-bold text-white"><ChefHat size={16} /> Start preparing</button>}
                  {order.status === "PREPARING" && <button onClick={() => updateOrder(order, "READY")} className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-bold text-white">Mark ready</button>}
                  {order.status === "READY" && order.order_type !== "DELIVERY" && <button onClick={() => updateOrder(order, "PICKED_UP")} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">{order.order_type === "EAT_IN" ? "Mark served" : "Mark picked up"}</button>}
                  {["PICKED_UP", "DELIVERED"].includes(order.status) && <button onClick={() => updateOrder(order, "COMPLETED")} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Complete order</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
