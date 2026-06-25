import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  type LucideIcon,
  MessageCircle,
  Pencil,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UserPlus,
  Users,
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
  const warnings = readinessWarnings(restaurant);
  const readiness = readinessLabel(restaurant.setup_percent);
  const ReadinessIcon = readiness.icon;

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
        <p className="text-sm text-slate-500">{restaurant.city || "Location missing"} / {restaurant.theme_name || "No template"}</p>
        <p className={`mt-1 flex items-center gap-1 truncate text-xs ${restaurant.owner_name || restaurant.owner_email ? "text-slate-400" : "font-semibold text-red-600"}`}>
          <Users size={13} /> {restaurant.owner_name || restaurant.owner_email || "No owner assigned"}
        </p>

        <div className="mt-5">
          <SetupProgress checklist={restaurant.checklist} percent={restaurant.setup_percent} compact />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${readiness.className}`}>
            <ReadinessIcon size={14} /> {readiness.label}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${restaurant.is_published ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>
            {restaurant.is_published ? "Active" : "Inactive"}
          </span>
        </div>

        {warnings.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-900"><AlertTriangle size={14} /> Missing</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {warnings.slice(0, 4).map((warning) => <span key={warning} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-900">{warning}</span>)}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-green-100 bg-green-50 p-3 text-sm font-semibold text-green-800">
            Ready for a confident owner demo.
          </div>
        )}

        <div className="mt-5 grid grid-cols-4 gap-2 text-center">
          <Metric icon={UtensilsCrossed} label="Items" value={restaurant.menu_items} />
          <Metric icon={ShoppingBag} label="Orders" value={restaurant.new_orders} active={restaurant.new_orders > 0} />
          <Metric icon={CalendarDays} label="Bookings" value={restaurant.new_reservations} active={restaurant.new_reservations > 0} />
          <Metric icon={MessageCircle} label="AI gaps" value={restaurant.unanswered_count} active={restaurant.unanswered_count > 0} />
        </div>

        <div className="mt-5 flex gap-2">
          <Link href={`/admin/restaurants/${restaurant.id}/edit`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-sm font-semibold text-white">
            <Pencil size={15} /> Edit
          </Link>
          <Link href={`/admin/restaurants/${restaurant.id}/orders`} className="rounded-xl border bg-white p-3 shadow-sm" aria-label={`Open ${restaurant.name} operations`}>
            <ShoppingBag size={17} />
          </Link>
          <Link href={`/restaurants/${restaurant.slug}`} target="_blank" className="rounded-xl border bg-white p-3 shadow-sm" aria-label={`Preview ${restaurant.name}`}>
            <ExternalLink size={17} />
          </Link>
          {canDelete && !restaurant.owner_name && !restaurant.owner_email && (
            <Link href="/admin/users" className="rounded-xl border bg-white p-3 text-orange-600 shadow-sm" aria-label={`Create owner for ${restaurant.name}`}>
              <UserPlus size={17} />
            </Link>
          )}
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

function readinessWarnings(restaurant: RestaurantOverview) {
  const warnings = [];
  if (!restaurant.owner_name && !restaurant.owner_email) warnings.push("Owner");
  if (!restaurant.hero_image && restaurant.image_count === 0) warnings.push("Photos");
  if (restaurant.menu_items === 0 || !restaurant.checklist.menu) warnings.push("Menu");
  if (!restaurant.checklist.opening_hours) warnings.push("Hours");
  if (!restaurant.checklist.branding) warnings.push("Branding");
  if (!restaurant.checklist.chatbot) warnings.push("AI knowledge");
  return warnings;
}

function readinessLabel(percent: number): { label: string; className: string; icon: LucideIcon } {
  if (percent >= 90) return { label: "Ready", className: "bg-green-50 text-green-700", icon: ShieldCheck };
  if (percent >= 65) return { label: "Almost ready", className: "bg-blue-50 text-blue-700", icon: CheckCircle2 };
  return { label: "Needs setup", className: "bg-amber-50 text-amber-800", icon: AlertTriangle };
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
