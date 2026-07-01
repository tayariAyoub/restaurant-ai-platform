"use client";

import { ArrowLeft, CheckCircle2, Clock3, MapPin, Phone, ReceiptText, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import request, { getRestaurantBySlug } from "@/lib/api";
import type { Restaurant, RestaurantOrder } from "@/lib/types";

export default function OrderTrackingPage() {
  const params = useParams<{ slug: string; publicId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [order, setOrder] = useState<RestaurantOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    Promise.all([
      getRestaurantBySlug(params.slug),
      request<RestaurantOrder>(`/restaurants/${params.slug}/orders/${params.publicId}`),
    ])
      .then(([restaurantData, orderData]) => {
        setRestaurant(restaurantData);
        setOrder(orderData);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Diese Bestellung konnte nicht geladen werden."));
  }, [params.slug, params.publicId]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 p-5 text-center">
        <section className="max-w-lg rounded-3xl border bg-white p-8 shadow-sm">
          <ReceiptText className="mx-auto text-red-600" size={42} />
          <h1 className="mt-4 text-3xl font-semibold">Bestellung nicht gefunden</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">{error}</p>
          <Link href={`/restaurants/${params.slug}`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white">
            <ArrowLeft size={17} /> Zurück zur Speisekarte
          </Link>
        </section>
      </main>
    );
  }

  if (!restaurant || !order) {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 p-5">
        <div className="rounded-3xl border bg-white p-8 text-center text-slate-500 shadow-sm">
          <Clock3 className="mx-auto animate-pulse" size={36} />
          <p className="mt-3 font-semibold">Bestellung wird geladen...</p>
        </div>
      </main>
    );
  }

  const primary = restaurant.primary_color || restaurant.theme?.primary_color || "#c84b31";
  const timeline = orderSteps(order.order_type);
  const currentIndex = Math.max(0, timeline.findIndex((step) => step.statuses.includes(order.status)));
  const displayNumber = shortOrderNumber(order.public_id);

  return (
    <main className="min-h-screen bg-stone-50 text-slate-950">
      <section className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href={`/restaurants/${restaurant.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
            <ArrowLeft size={17} /> Speisekarte
          </Link>
          <p className="truncate text-sm font-semibold">{restaurant.name}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:py-12">
        <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="p-6 sm:p-8" style={{ background: `linear-gradient(135deg, ${primary}, #111827)` }}>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/75">Bestellung verfolgen</p>
            <h1 className="mt-3 text-4xl font-bold text-white">#{displayNumber}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">
              {statusCopy(order.status, order.order_type)} Geschätzte Zeit: {estimateText(order)}.
            </p>
          </div>

          <div className="grid gap-3 border-b p-4 sm:grid-cols-3">
            <Metric label="Status" value={humanStatus(order.status)} />
            <Metric label="Art" value={orderTypeLabel(order.order_type)} />
            <Metric label="Gesamt" value={`EUR ${Number(order.total).toFixed(2)}`} />
          </div>

          <div className="p-5 sm:p-8">
            <h2 className="text-2xl font-semibold">Fortschritt</h2>
            <div className="mt-5 space-y-4">
              {timeline.map((step, index) => {
                const done = index <= currentIndex;
                return (
                  <div key={step.label} className="flex gap-4">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${done ? "text-white" : "bg-slate-100 text-slate-400"}`} style={done ? { backgroundColor: primary } : undefined}>
                      {done ? <CheckCircle2 size={19} /> : index + 1}
                    </span>
                    <div className="pb-2">
                      <p className={`font-bold ${done ? "text-slate-950" : "text-slate-400"}`}>{step.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {order.status_history.length > 0 && (
              <div className="mt-7 rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold">Neueste Updates</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  {order.status_history.slice(-3).reverse().map((item) => (
                    <p key={item.id} className="flex justify-between gap-3 rounded-xl bg-white p-3">
                      <span>{humanStatus(item.status)}{item.note ? ` - ${item.note}` : ""}</span>
                      <span className="shrink-0 text-slate-400">{formatTime(item.created_at)}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShoppingBag style={{ color: primary }} />
              <h2 className="text-2xl font-semibold">Bestelldetails</h2>
            </div>
            <div className="mt-5 space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 rounded-2xl bg-slate-50 p-4 text-sm">
                  <span><b>{item.quantity}x</b> {item.item_name}</span>
                  <span className="font-semibold">EUR {Number(item.line_total).toFixed(2)}</span>
                </div>
              ))}
            </div>
            {order.notes && <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">Hinweis: {order.notes}</p>}
          </section>

          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Hilfe benötigt?</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              {restaurant.phone && <a href={`tel:${restaurant.phone}`} className="flex items-center gap-3 rounded-2xl border p-4 font-semibold text-slate-900"><Phone size={18} style={{ color: primary }} /> {restaurant.phone}</a>}
              <p className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><MapPin size={18} className="mt-1 shrink-0" style={{ color: primary }} /> {restaurant.address}, {restaurant.city}</p>
              <p>Zeigen Sie dem Restaurantteam die Bestellung #{displayNumber} bei Abholung oder Vor-Ort-Bestellungen.</p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}

function orderSteps(orderType: RestaurantOrder["order_type"]) {
  if (orderType === "DELIVERY") {
    return [
      { label: "Erhalten", description: "Das Restaurant hat Ihre Bestellung.", statuses: ["NEW"] },
      { label: "In Vorbereitung", description: "Die Küche bereitet Ihre Bestellung vor.", statuses: ["ACCEPTED", "PREPARING"] },
      { label: "Unterwegs", description: "Ihre Bestellung verlässt das Restaurant.", statuses: ["READY", "DELIVERING"] },
      { label: "Geliefert", description: "Ihre Bestellung ist abgeschlossen.", statuses: ["DELIVERED", "COMPLETED"] },
    ];
  }
  return [
    { label: "Erhalten", description: "Das Restaurant hat Ihre Bestellung.", statuses: ["NEW"] },
    { label: "In Vorbereitung", description: "Die Küche bereitet Ihre Bestellung vor.", statuses: ["ACCEPTED", "PREPARING"] },
    { label: orderType === "EAT_IN" ? "Bereit für Ihren Tisch" : "Bereit zur Abholung", description: "Das Team stellt Ihre Bestellung gleich bereit.", statuses: ["READY"] },
    { label: "Abgeschlossen", description: "Vielen Dank für Ihre Bestellung.", statuses: ["PICKED_UP", "COMPLETED"] },
  ];
}

function statusCopy(status: string, orderType: RestaurantOrder["order_type"]) {
  if (status === "NEW") return "Das Restaurant hat Ihre Bestellung erhalten und bestätigt sie in Kürze.";
  if (status === "PREPARING" || status === "ACCEPTED") return "Die Küche arbeitet an Ihrer Bestellung.";
  if (status === "READY") return orderType === "EAT_IN" ? "Ihre Bestellung ist für Ihren Tisch bereit." : "Ihre Bestellung ist bereit.";
  if (status === "DELIVERING") return "Ihre Bestellung ist unterwegs.";
  if (status === "REJECTED") return "Das Restaurant konnte diese Bestellung nicht annehmen.";
  return "Ihre Bestellung ist abgeschlossen.";
}

function estimateText(order: RestaurantOrder) {
  if (order.estimated_minutes) return `${order.estimated_minutes} min`;
  if (order.order_type === "DELIVERY") return "35-50 min";
  if (order.order_type === "EAT_IN") return "15-25 min";
  return "20-30 min";
}

function orderTypeLabel(orderType: RestaurantOrder["order_type"]) {
  if (orderType === "EAT_IN") return "Vor Ort essen";
  if (orderType === "DELIVERY") return "Lieferung";
  return "Abholung";
}

function humanStatus(status: string) {
  const labels: Record<string, string> = {
    NEW: "Neu",
    ACCEPTED: "Angenommen",
    PREPARING: "In Vorbereitung",
    READY: "Bereit",
    DELIVERING: "Unterwegs",
    DELIVERED: "Geliefert",
    PICKED_UP: "Abgeholt",
    COMPLETED: "Abgeschlossen",
    REJECTED: "Abgelehnt",
  };
  return labels[status] || status.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function shortOrderNumber(publicId: string) {
  return publicId.split("-")[0].toUpperCase();
}
