import {
  CalendarDays,
  ExternalLink,
  type LucideIcon,
  MessageCircle,
  Pencil,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
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
  const needsAttention = restaurant.unanswered_count > 0 || restaurant.new_orders > 0 || restaurant.new_reservations > 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div
        className="relative h-48 bg-slate-200 bg-cover bg-center"
        style={{ backgroundImage: restaurant.hero_image ? `linear-gradient(180deg, transparent, rgba(0,0,0,.5)), url(${restaurant.hero_image})` : undefined }}
      >
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <span className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-bold shadow-sm ${restaurant.is_published ? "bg-green-100 text-green-800" : "bg-white text-slate-600"}`}>
            {restaurant.is_published ? "Live website" : "Draft"}
          </span>
          <h2 className="text-2xl font-semibold leading-tight">{restaurant.name}</h2>
        </div>
        {needsAttention && <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">Needs attention</span>}
      </div>

      <div className="p-5">
        <p className="text-sm text-slate-500">{restaurant.city || "Location missing"} · {restaurant.theme_name || "No template"}</p>
        <p className="mt-1 truncate text-xs text-slate-400">{restaurant.owner_name || restaurant.owner_email || "No owner assigned"}</p>

        <div className="mt-5">
          <SetupProgress checklist={restaurant.checklist} percent={restaurant.setup_percent} compact />
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 text-center">
          <Metric icon={UtensilsCrossed} label="Items" value={restaurant.menu_items} />
          <Metric icon={ShoppingBag} label="Orders" value={restaurant.new_orders} active={restaurant.new_orders > 0} />
          <Metric icon={CalendarDays} label="Bookings" value={restaurant.new_reservations} active={restaurant.new_reservations > 0} />
          <Metric icon={MessageCircle} label="AI gaps" value={restaurant.unanswered_count} active={restaurant.unanswered_count > 0} />
        </div>

        <div className="mt-5 flex gap-2">
          <Link href={`/admin/restaurants/${restaurant.id}/edit`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-sm font-semibold text-white">
            <Pencil size={15} /> Manage
          </Link>
          <Link href={`/restaurants/${restaurant.slug}`} target="_blank" className="rounded-xl border bg-white p-3 shadow-sm" aria-label={`Preview ${restaurant.name}`}>
            <ExternalLink size={17} />
          </Link>
          {canDelete && onDelete && (
            <button onClick={onDelete} className="rounded-xl border bg-white p-3 text-red-600 shadow-sm" aria-label={`Delete ${restaurant.name}`}>
              <Trash2 size={17} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  active = false,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <div className={`rounded-xl p-2 ${active ? "bg-orange-50 text-orange-700" : "bg-slate-50 text-slate-600"}`}>
      <Icon size={15} className="mx-auto" />
      <p className="mt-1 text-sm font-bold">{value}</p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  );
}
