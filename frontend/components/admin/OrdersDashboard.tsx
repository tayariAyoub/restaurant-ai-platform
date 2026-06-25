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
  Timer,
  Truck,
  type LucideIcon,
  Utensils,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { adminRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { DeliveryDriver, Restaurant, RestaurantOrder } from "@/lib/types";
import AdminShell from "./AdminShell";
import RestaurantNav from "./RestaurantNav";

const liveStatuses = ["NEW", "ACCEPTED", "PREPARING", "READY"];
const doneStatuses = ["COMPLETED", "REJECTED", "DELIVERED", "PICKED_UP"];

const statusLabels: Record<string, string> = {
  NEW: "Pending",
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
  NEW: "bg-orange-100 text-orange-800 ring-orange-200",
  ACCEPTED: "bg-blue-100 text-blue-800 ring-blue-200",
  PREPARING: "bg-violet-100 text-violet-800 ring-violet-200",
  READY: "bg-green-100 text-green-800 ring-green-200",
  DELIVERING: "bg-cyan-100 text-cyan-800 ring-cyan-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  COMPLETED: "bg-slate-100 text-slate-700 ring-slate-200",
  REJECTED: "bg-red-100 text-red-800 ring-red-200",
  PICKED_UP: "bg-emerald-100 text-emerald-800 ring-emerald-200",
};

const orderTypeLabels: Record<RestaurantOrder["order_type"], { label: string; icon: LucideIcon; className: string }> = {
  PICKUP: { label: "Pickup", icon: ShoppingBag, className: "bg-indigo-50 text-indigo-700" },
  EAT_IN: { label: "Dine-in", icon: Utensils, className: "bg-amber-50 text-amber-700" },
  DELIVERY: { label: "Delivery", icon: Truck, className: "bg-cyan-50 text-cyan-700" },
};

export default function OrdersDashboard({ id }: { id: number }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [view, setView] = useState<"board" | "kitchen" | "delivery" | "history" | "drivers">("board");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError("");
    try {
      const token = getToken();
      const [restaurantData, orderData, driverData] = await Promise.all([
        adminRequest<Restaurant>(`/admin/restaurants/${id}`, token),
        adminRequest<RestaurantOrder[]>(`/admin/restaurants/${id}/orders`, token),
        adminRequest<DeliveryDriver[]>(`/admin/restaurants/${id}/drivers`, token),
      ]);
      setRestaurant(restaurantData);
      setOrders(orderData);
      setDrivers(driverData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 10000);
    return () => window.clearInterval(timer);
  }, [load]);

  const liveOrders = useMemo(
    () => orders.filter((order) => !doneStatuses.includes(order.status)),
    [orders],
  );

  const filtered = useMemo(() => {
    if (view === "delivery") return orders.filter((order) => order.order_type === "DELIVERY" && !["COMPLETED", "REJECTED"].includes(order.status));
    if (view === "history") return orders.filter((order) => doneStatuses.includes(order.status));
    if (view === "drivers") return [];
    return liveOrders;
  }, [orders, view, liveOrders]);

  async function updateOrder(order: RestaurantOrder, nextStatus: string, estimatedMinutes?: number) {
    let rejectionReason = "";
    if (nextStatus === "REJECTED") {
      if (!confirm("Reject this order? The customer will see that the restaurant cannot fulfill it.")) return;
      rejectionReason = "Restaurant cannot fulfill this order";
    }
    await adminRequest(`/admin/restaurants/${id}/orders/${order.id}`, getToken(), {
      method: "PATCH",
      body: JSON.stringify({
        status: nextStatus,
        estimated_minutes: estimatedMinutes ?? order.estimated_minutes,
        rejection_reason: rejectionReason,
      }),
    });
    setStatus(`Order #${order.id} moved to ${statusLabels[nextStatus] || nextStatus}.`);
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
    setStatus(`Delivery updated to ${nextStatus.replaceAll("_", " ").toLowerCase()}.`);
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
      setStatus("Driver removed.");
      load();
    } catch (removeError) {
      setStatus(removeError instanceof Error ? removeError.message : "Could not remove driver.");
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-white/80" />)}
        </div>
      </AdminShell>
    );
  }

  if (!restaurant) {
    return (
      <AdminShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">{error || "Restaurant not found."}</div>
      </AdminShell>
    );
  }

  const newCount = orders.filter((order) => order.status === "NEW").length;
  const preparingCount = orders.filter((order) => order.status === "PREPARING").length;
  const readyCount = orders.filter((order) => order.status === "READY").length;
  const tabs = [
    ["board", `Live board (${liveOrders.length})`, ShoppingBag],
    ["kitchen", "Kitchen mode", ChefHat],
    ["delivery", "Delivery", Truck],
    ["history", "History", PackageCheck],
    ["drivers", "Drivers", Bike],
  ] as const;

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-orange-600">Restaurant operations</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">{restaurant.name} orders</h1>
          <p className="mt-2 text-slate-500">Auto-refreshes every 10 seconds. Built for front counter, kitchen, and delivery handoff.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold shadow-sm">
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <RestaurantNav id={id} active="orders" />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <OpsMetric label="Pending" value={newCount} tone="orange" />
        <OpsMetric label="Preparing" value={preparingCount} tone="violet" />
        <OpsMetric label="Ready" value={readyCount} tone="green" />
      </div>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {status && <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{status}</div>}

      <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-black/5 bg-white p-2 shadow-sm">
        {tabs.map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${view === key ? "bg-slate-900 text-white shadow-lg" : "hover:bg-slate-100"}`}
          >
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      {view === "drivers" && (
        <DriversPanel drivers={drivers} onAddDriver={addDriver} onRemoveDriver={removeDriver} />
      )}

      {view === "kitchen" && (
        <KitchenBoard orders={liveOrders} onUpdateOrder={updateOrder} />
      )}

      {view !== "drivers" && view !== "kitchen" && (
        <div className="space-y-5">
          {filtered.length === 0 ? (
            <EmptyState title="No orders in this view" description="New online orders will appear here automatically." />
          ) : (
            filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                restaurant={restaurant}
                drivers={drivers}
                onUpdateOrder={updateOrder}
                onAssignDriver={assignDriver}
                onDeliveryStatus={deliveryStatus}
                compact={view === "history"}
              />
            ))
          )}
        </div>
      )}
    </AdminShell>
  );
}

function OpsMetric({ label, value, tone }: { label: string; value: number; tone: "orange" | "violet" | "green" }) {
  const colors = {
    orange: "bg-orange-50 text-orange-800",
    violet: "bg-violet-50 text-violet-800",
    green: "bg-green-50 text-green-800",
  };
  return (
    <div className={`rounded-2xl border border-black/5 p-5 shadow-sm ${colors[tone]}`}>
      <p className="text-sm font-semibold opacity-75">{label}</p>
      <p className="mt-2 text-4xl font-bold">{value}</p>
    </div>
  );
}

function OrderCard({
  order,
  restaurant,
  drivers,
  onUpdateOrder,
  onAssignDriver,
  onDeliveryStatus,
  compact = false,
}: {
  order: RestaurantOrder;
  restaurant: Restaurant;
  drivers: DeliveryDriver[];
  onUpdateOrder: (order: RestaurantOrder, nextStatus: string, estimatedMinutes?: number) => void;
  onAssignDriver: (orderId: number, driverId: number) => void;
  onDeliveryStatus: (orderId: number, nextStatus: string) => void;
  compact?: boolean;
}) {
  const address = order.delivery_address;
  const destination = address ? `${address.street}, ${address.postal_code} ${address.city}` : "";
  const origin = `${restaurant.address}, ${restaurant.postal_code} ${restaurant.city}`;
  const mapUrl = `https://www.openstreetmap.org/directions?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}`;
  const type = orderTypeLabels[order.order_type];
  const TypeIcon = type.icon;

  return (
    <article className={`rounded-2xl border bg-white p-5 shadow-sm ${order.status === "NEW" ? "border-orange-300 ring-2 ring-orange-100" : "border-black/5"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold">Order #{order.id}</h2>
            <StatusPill status={order.status} />
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${type.className}`}><TypeIcon size={13} /> {type.label}</span>
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Clock3 size={15} /> {new Date(order.created_at).toLocaleString()}
            {order.estimated_minutes !== null && <span className="inline-flex items-center gap-1"><Timer size={14} /> ETA {order.estimated_minutes} min</span>}
          </p>
        </div>
        <p className="text-2xl font-bold">EUR {Number(order.total).toFixed(2)}</p>
      </div>

      <div className={`mt-5 grid gap-5 ${compact ? "" : "lg:grid-cols-[1fr_.85fr]"}`}>
        <div>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span><b>{item.quantity}x</b> {item.item_name}{item.notes && <small className="block text-slate-500">{item.notes}</small>}</span>
                <span className="font-semibold">EUR {Number(item.line_total).toFixed(2)}</span>
              </div>
            ))}
          </div>
          {order.notes && <p className="mt-3 rounded-xl bg-yellow-50 p-3 text-sm"><b>Customer note:</b> {order.notes}</p>}
        </div>

        {!compact && (
          <div className="rounded-2xl border p-4 text-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer</p>
            <p className="mt-2 font-semibold">{order.customer_name}</p>
            <a href={`tel:${order.customer_phone}`} className="mt-2 flex items-center gap-2 text-blue-700"><Phone size={15} />{order.customer_phone}</a>
            {order.customer_email && <p className="mt-1 text-slate-500">{order.customer_email}</p>}
            {address && (
              <>
                <p className="mt-4 flex items-start gap-2"><MapPin size={16} className="mt-0.5" />{destination}</p>
                {address.instructions && <p className="mt-1 text-slate-500">{address.instructions}</p>}
                {address.approximate_distance_km && <p className="mt-2 text-slate-500">Approx. {address.approximate_distance_km} km</p>}
                <a href={mapUrl} target="_blank" className="mt-3 inline-block font-semibold text-blue-700 underline">Open route map</a>
              </>
            )}
          </div>
        )}
      </div>

      {order.order_type === "DELIVERY" && !compact && (
        <DeliveryControls order={order} drivers={drivers} onAssignDriver={onAssignDriver} onDeliveryStatus={onDeliveryStatus} />
      )}

      {order.status_history.length > 0 && (
        <details className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Status timeline</summary>
          <div className="mt-3 space-y-2">
            {order.status_history.map((entry) => (
              <div key={entry.id} className="flex justify-between gap-4">
                <span>{statusLabels[entry.status] || entry.status}{entry.note ? ` - ${entry.note}` : ""}</span>
                <span className="shrink-0 text-xs text-slate-400">{new Date(entry.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {!compact && <OrderActions order={order} onUpdateOrder={onUpdateOrder} />}
    </article>
  );
}

function StatusPill({ status }: { status: string }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusColors[status] || "bg-slate-100 text-slate-700 ring-slate-200"}`}>{statusLabels[status] || status}</span>;
}

function OrderActions({
  order,
  onUpdateOrder,
  large = false,
}: {
  order: RestaurantOrder;
  onUpdateOrder: (order: RestaurantOrder, nextStatus: string, estimatedMinutes?: number) => void;
  large?: boolean;
}) {
  const base = large ? "rounded-2xl px-5 py-5 text-lg" : "rounded-xl px-4 py-3 text-sm";

  return (
    <div className={`mt-5 flex flex-wrap gap-2 ${large ? "grid grid-cols-2" : ""}`}>
      {order.status === "NEW" && (
        <>
          {[15, 25, 35].map((minutes) => (
            <button key={minutes} onClick={() => onUpdateOrder(order, "ACCEPTED", minutes)} className={`${base} flex items-center justify-center gap-2 bg-green-700 font-bold text-white`}>
              <Check size={large ? 22 : 16} /> Accept {minutes}m
            </button>
          ))}
          <button onClick={() => onUpdateOrder(order, "REJECTED")} className={`${base} flex items-center justify-center gap-2 bg-red-50 font-bold text-red-700`}>
            <X size={large ? 22 : 16} /> Reject
          </button>
        </>
      )}
      {order.status === "ACCEPTED" && (
        <button onClick={() => onUpdateOrder(order, "PREPARING")} className={`${base} flex items-center justify-center gap-2 bg-violet-700 font-bold text-white`}>
          <ChefHat size={large ? 22 : 16} /> Start preparing
        </button>
      )}
      {order.status === "PREPARING" && (
        <button onClick={() => onUpdateOrder(order, "READY")} className={`${base} bg-green-700 font-bold text-white`}>Mark ready</button>
      )}
      {order.status === "READY" && order.order_type !== "DELIVERY" && (
        <button onClick={() => onUpdateOrder(order, "PICKED_UP")} className={`${base} bg-slate-900 font-bold text-white`}>
          {order.order_type === "EAT_IN" ? "Mark served" : "Mark picked up"}
        </button>
      )}
      {["PICKED_UP", "DELIVERED"].includes(order.status) && (
        <button onClick={() => onUpdateOrder(order, "COMPLETED")} className={`${base} bg-slate-900 font-bold text-white`}>Complete order</button>
      )}
    </div>
  );
}

function DeliveryControls({
  order,
  drivers,
  onAssignDriver,
  onDeliveryStatus,
}: {
  order: RestaurantOrder;
  drivers: DeliveryDriver[];
  onAssignDriver: (orderId: number, driverId: number) => void;
  onDeliveryStatus: (orderId: number, nextStatus: string) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-cyan-50 p-3">
      <select value={order.delivery_assignment?.driver_id || ""} onChange={(event) => onAssignDriver(order.id, Number(event.target.value))} className="rounded-lg border px-3 py-2 text-sm">
        <option value="">Assign driver</option>
        {drivers.filter((driver) => driver.is_active).map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
      </select>
      {order.delivery_assignment ? (
        <>
          <span className="text-sm font-semibold">{order.delivery_assignment.driver.name} - {order.delivery_assignment.status.replaceAll("_", " ")}</span>
          {order.delivery_assignment.status === "ASSIGNED" && <button onClick={() => onDeliveryStatus(order.id, "ON_THE_WAY")} className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-bold text-white">Mark on the way</button>}
          {order.delivery_assignment.status === "ON_THE_WAY" && <button onClick={() => onDeliveryStatus(order.id, "DELIVERED")} className="rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white">Mark delivered</button>}
        </>
      ) : (
        <span className="text-sm text-cyan-900">Assign a driver when this delivery is ready.</span>
      )}
    </div>
  );
}

function KitchenBoard({
  orders,
  onUpdateOrder,
}: {
  orders: RestaurantOrder[];
  onUpdateOrder: (order: RestaurantOrder, nextStatus: string, estimatedMinutes?: number) => void;
}) {
  const lanes = [
    ["NEW", "Pending", "Accept quickly so the customer knows the kitchen saw it."],
    ["ACCEPTED", "Accepted", "Orders waiting to be started."],
    ["PREPARING", "Preparing", "Cooking now. Mark ready when plated or packed."],
    ["READY", "Ready", "Waiting for pickup, table service, or delivery handoff."],
  ] as const;

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {lanes.map(([status, title, helper]) => {
        const laneOrders = orders.filter((order) => order.status === status);
        return (
          <section key={status} className="min-h-72 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">{title}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">{laneOrders.length}</span>
            </div>
            <div className="mt-4 space-y-4">
              {laneOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-400">Nothing here</div>
              ) : (
                laneOrders.map((order) => (
                  <article key={order.id} className={`rounded-2xl border p-4 ${order.status === "NEW" ? "border-orange-300 bg-orange-50" : "bg-slate-50"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-bold">#{order.id}</h3>
                        <OrderTypeBadge orderType={order.order_type} />
                      </div>
                      <p className="text-sm font-bold">{new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div className="mt-4 space-y-2 text-lg">
                      {order.items.map((item) => (
                        <p key={item.id} className="rounded-xl bg-white px-3 py-2"><b>{item.quantity}x</b> {item.item_name}</p>
                      ))}
                    </div>
                    {order.notes && <p className="mt-3 rounded-xl bg-yellow-100 p-3 text-sm"><b>Note:</b> {order.notes}</p>}
                    <OrderActions order={order} onUpdateOrder={onUpdateOrder} large />
                  </article>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function OrderTypeBadge({ orderType }: { orderType: RestaurantOrder["order_type"] }) {
  const type = orderTypeLabels[orderType];
  const Icon = type.icon;
  return <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${type.className}`}><Icon size={13} /> {type.label}</span>;
}

function DriversPanel({
  drivers,
  onAddDriver,
  onRemoveDriver,
}: {
  drivers: DeliveryDriver[];
  onAddDriver: (event: FormEvent<HTMLFormElement>) => void;
  onRemoveDriver: (driverId: number) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
      <form onSubmit={onAddDriver} className="h-fit space-y-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Add delivery driver</h2>
        <p className="text-sm leading-6 text-slate-500">Drivers can be assigned to delivery orders once the food is ready.</p>
        <input name="name" required placeholder="Driver name" className="w-full rounded-xl border px-4 py-3" />
        <input name="phone" required placeholder="Phone number" className="w-full rounded-xl border px-4 py-3" />
        <button className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white">Add driver</button>
      </form>
      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Delivery team</h2>
        <div className="mt-4 divide-y">
          {drivers.length === 0 ? (
            <EmptyState title="No drivers yet" description="Add drivers before assigning delivery orders." />
          ) : (
            drivers.map((driver) => (
              <div key={driver.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-semibold">{driver.name}</p>
                  <p className="text-sm text-slate-500">{driver.phone}</p>
                </div>
                <button onClick={() => onRemoveDriver(driver.id)} className="text-sm font-semibold text-red-600">Remove</button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
