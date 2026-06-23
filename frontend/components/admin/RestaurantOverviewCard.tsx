import { CalendarDays, ExternalLink, MessageCircle, Pencil, ShoppingBag, Trash2, UtensilsCrossed } from "lucide-react";
import Link from "next/link";

import type { RestaurantOverview } from "@/lib/types";
import SetupProgress from "./SetupProgress";

export default function RestaurantOverviewCard({
  restaurant,
  canDelete = false,
  onDelete,
}: {
  restaurant: RestaurantOverview;
  canDelete?: boolean;
  onDelete?: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-44 bg-slate-200 bg-cover bg-center" style={{ backgroundImage: restaurant.hero_image ? `url(${restaurant.hero_image})` : undefined }}>
        <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${restaurant.is_published ? "bg-green-100 text-green-800" : "bg-white text-slate-600"}`}>
          {restaurant.is_published ? "Live" : "Draft"}
        </span>
      </div>
      <div className="p-5">
        <h2 className="text-xl font-semibold">{restaurant.name}</h2>
        <p className="mt-1 text-sm text-slate-500">{restaurant.city || "Location missing"} · {restaurant.theme_name || "No template"}</p>
        <p className="mt-1 truncate text-xs text-slate-400">{restaurant.owner_name || restaurant.owner_email || "No owner assigned"}</p>
        <div className="mt-5"><SetupProgress checklist={restaurant.checklist} percent={restaurant.setup_percent} compact /></div>
        <div className="mt-5 grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl bg-slate-50 p-2"><UtensilsCrossed size={15} className="mx-auto text-slate-500" /><p className="mt-1 text-sm font-bold">{restaurant.menu_items}</p><p className="text-[10px] text-slate-400">Items</p></div>
          <div className="rounded-xl bg-slate-50 p-2"><ShoppingBag size={15} className="mx-auto text-slate-500" /><p className="mt-1 text-sm font-bold">{restaurant.new_orders}</p><p className="text-[10px] text-slate-400">Orders</p></div>
          <div className="rounded-xl bg-slate-50 p-2"><CalendarDays size={15} className="mx-auto text-slate-500" /><p className="mt-1 text-sm font-bold">{restaurant.new_reservations}</p><p className="text-[10px] text-slate-400">New</p></div>
          <div className="rounded-xl bg-slate-50 p-2"><MessageCircle size={15} className="mx-auto text-slate-500" /><p className="mt-1 text-sm font-bold">{restaurant.unanswered_count}</p><p className="text-[10px] text-slate-400">Unanswered</p></div>
        </div>
        <div className="mt-5 flex gap-2">
          <Link href={`/admin/restaurants/${restaurant.id}/edit`} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white"><Pencil size={15} /> Manage</Link>
          <Link href={`/restaurants/${restaurant.slug}`} target="_blank" className="rounded-lg border p-2.5" aria-label={`Preview ${restaurant.name}`}><ExternalLink size={17} /></Link>
          {canDelete && onDelete && <button onClick={onDelete} className="rounded-lg border p-2.5 text-red-600" aria-label={`Delete ${restaurant.name}`}><Trash2 size={17} /></button>}
        </div>
      </div>
    </article>
  );
}
