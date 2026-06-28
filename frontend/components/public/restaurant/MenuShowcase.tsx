import { ChefHat, Leaf, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import type { RestaurantThemeIdentity } from "@/lib/restaurantTheme";
import type { MenuItem, Restaurant } from "@/lib/types";
import {
  dishExperienceLabel,
  formatPrice,
  matchesMenuFilters,
  pairingSuggestion,
} from "./experience";

type MenuShowcaseProps = {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  menuItems: MenuItem[];
  featuredItems: MenuItem[];
  quantities: Record<number, number>;
  orderingEnabled: boolean;
  onAdd: (item: MenuItem) => void;
};

export default function MenuShowcase({
  restaurant,
  themeIdentity,
  menuItems,
  featuredItems,
  quantities,
  orderingEnabled,
  onAdd,
}: MenuShowcaseProps) {
  const [menuQuery, setMenuQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<"all" | "vegan" | "vegetarian" | "halal">("all");
  const primary = themeIdentity.primary;
  const secondary = themeIdentity.secondary;
  const buttonClass = themeIdentity.buttonClass;
  const personality = themeIdentity.personality;
  const immersive = themeIdentity.homepageStyle === "immersive";

  const filteredCategories = useMemo(
    () =>
      restaurant.categories.map((category) => ({
        ...category,
        items: category.items.filter((item) => matchesMenuFilters(item, menuQuery, dietaryFilter)),
      })),
    [dietaryFilter, menuQuery, restaurant.categories],
  );
  const visibleMenuItems = filteredCategories.reduce((total, category) => total + category.items.length, 0);

  return (
    <section
      id="menu"
      className={`sensory-section px-4 py-16 sm:px-6 lg:py-28 ${
        immersive ? "bg-[#05030b]/90 text-white" : "bg-white/75"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <p className="luxury-kicker text-xs font-bold" style={{ color: primary }}>Fresh from the kitchen</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">A menu that feels curated, not listed.</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-7 opacity-65">
            Browse dishes by craving, ingredients, and dietary needs, then reserve or order without losing your place in the menu.
          </p>
        </div>
        {restaurant.categories.length === 0 || menuItems.length === 0 ? (
          <div className={`mt-12 rounded-3xl border border-dashed p-10 text-center shadow-sm ${immersive ? "border-white/15 bg-white/[.05]" : "bg-white"}`}>
            <ChefHat className="mx-auto opacity-35" size={42} />
            <h3 className="mt-4 text-2xl font-semibold">Menu coming soon</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 opacity-60">
              The restaurant is still preparing its online menu. Call the restaurant or request a table for help.
            </p>
          </div>
        ) : (
          <>
            <div
              className={`sticky top-0 z-20 -mx-4 mt-10 border-y px-4 py-3 shadow-sm backdrop-blur sm:top-2 sm:mx-0 sm:rounded-[1.5rem] sm:border ${
                immersive ? "border-white/10 bg-[#070411]/95" : "border-black/10 bg-white/95"
              }`}
            >
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <label className="relative block">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-45" size={18} />
                  <input
                    value={menuQuery}
                    onChange={(event) => setMenuQuery(event.target.value)}
                    className={`min-h-12 w-full rounded-full border py-3 pl-11 pr-4 text-base shadow-sm sm:text-sm ${
                      immersive ? "border-white/10 bg-white/[.08] text-white placeholder:text-white/42" : "border-black/10 bg-white"
                    }`}
                    placeholder="Search dishes, ingredients, allergens..."
                    autoComplete="off"
                  />
                </label>
                <div className="flex snap-x gap-2 overflow-x-auto [-webkit-overflow-scrolling:touch]">
                  {(["all", "vegan", "vegetarian", "halal"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setDietaryFilter(filter)}
                      className={`luxury-button min-h-11 shrink-0 snap-start rounded-full border px-4 py-3 text-xs font-bold uppercase tracking-wider ${
                        dietaryFilter === filter
                          ? "text-white shadow-md"
                          : immersive
                            ? "border-white/10 bg-white/[.06] text-white/76"
                            : "bg-white"
                      }`}
                      style={dietaryFilter === filter ? { backgroundColor: primary, borderColor: primary } : undefined}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:justify-center">
                {restaurant.categories.map((category) => (
                  <a
                    key={category.id}
                    href={`#category-${category.id}`}
                    className={`luxury-button flex min-h-11 shrink-0 snap-start items-center rounded-full border px-4 py-2.5 text-sm font-bold shadow-sm ${
                      immersive ? "border-white/10 bg-white/[.06] text-white/80 hover:border-white/30" : "border-black/10 bg-white hover:border-black/20"
                    }`}
                  >
                    {category.name}
                  </a>
                ))}
              </div>
              {(menuQuery || dietaryFilter !== "all") && (
                <p className="mt-3 text-center text-xs font-semibold opacity-60">{visibleMenuItems} dishes match your selection</p>
              )}
            </div>

            {featuredItems.length > 0 && (
              <div className={`ambient-glow mt-10 rounded-[2rem] border border-black/10 p-4 shadow-2xl sm:p-5 ${themeIdentity.signaturePanelClass}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.22em]" style={{ color: primary }}>Signature dishes</p>
                    <h3 className="mt-1 text-2xl font-semibold">A few plates to begin with.</h3>
                    <p className="mt-1 text-sm opacity-55">{personality.signatureCopy}</p>
                  </div>
                  <Sparkles className="hidden opacity-40 sm:block" />
                </div>
                <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                  {featuredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (orderingEnabled) onAdd(item);
                      }}
                      disabled={!orderingEnabled}
                      className={`premium-lift w-60 shrink-0 overflow-hidden rounded-2xl border text-left shadow-sm disabled:cursor-not-allowed disabled:opacity-70 ${
                        immersive ? "border-white/10 bg-white/[.08] text-white" : "border-white/10 bg-white text-slate-950"
                      }`}
                    >
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className={`h-28 w-full object-cover ${themeIdentity.imageTreatmentClass}`} loading="lazy" decoding="async" />
                      ) : (
                        <FoodFallback name={item.name} compact />
                      )}
                      <span className="block p-3">
                        <span className="block truncate font-semibold">{item.name}</span>
                        <span className="mt-1 flex items-center justify-between text-sm opacity-65">
                          <span>{formatPrice(item.price)}</span>
                          {orderingEnabled ? <Plus size={16} style={{ color: primary }} /> : <span className="text-xs">Browse</span>}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-14 space-y-16">
              {filteredCategories.map((category) => (
                <section id={`category-${category.id}`} key={category.id} className="scroll-mt-32">
                  <div className={`flex flex-wrap items-end justify-between gap-4 border-b pb-5 ${immersive ? "border-white/12" : "border-black/15"}`}>
                    <div>
                      <p className="luxury-kicker text-[10px] font-bold opacity-40">Course {String(category.sort_order || category.id).padStart(2, "0")}</p>
                      <h3 className="mt-1 text-3xl font-semibold sm:text-4xl">{category.name}</h3>
                      <p className="mt-2 max-w-2xl leading-7 opacity-60">{category.description || "Prepared fresh by the kitchen."}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm ${immersive ? "border-white/10 bg-white/[.06]" : "border-black/10 bg-white/70"}`}>
                      {category.items.filter((item) => item.is_available).length} available
                    </span>
                  </div>
                  {category.items.length === 0 ? (
                    <div className={`mt-6 rounded-2xl border border-dashed p-8 text-center text-sm opacity-60 ${immersive ? "border-white/12 bg-white/[.05]" : "bg-white"}`}>
                      No dishes match the current search or filter.
                    </div>
                  ) : (
                    <div className={`mt-7 grid gap-5 ${themeIdentity.menuStyle === "cards" || themeIdentity.menuStyle === "refined" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                      {category.items.map((item, index) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          index={index}
                          quantity={quantities[item.id] || 0}
                          primary={primary}
                          secondary={secondary}
                          buttonClass={buttonClass}
                          themeIdentity={themeIdentity}
                          immersive={immersive}
                          orderingEnabled={orderingEnabled}
                          onAdd={() => onAdd(item)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function FoodFallback({ name, compact = false }: { name: string; compact?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-[#1d1a16] text-white ${compact ? "h-28" : "h-44 sm:h-48"}`}>
      <div
        className="absolute inset-0 opacity-70"
        style={{ background: "radial-gradient(circle at 20% 20%, rgba(255,255,255,.16), transparent 9rem), linear-gradient(135deg, rgba(200,75,49,.28), rgba(107,112,72,.18))" }}
      />
      <div className="absolute inset-x-4 bottom-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">Chef selection</p>
        <p className="mt-1 line-clamp-2 font-display text-xl font-semibold leading-tight">{name}</p>
      </div>
    </div>
  );
}

function MenuItemCard({
  item,
  index,
  quantity,
  primary,
  secondary,
  buttonClass,
  themeIdentity,
  immersive,
  orderingEnabled,
  onAdd,
}: {
  item: MenuItem;
  index: number;
  quantity: number;
  primary: string;
  secondary: string;
  buttonClass: string;
  themeIdentity: RestaurantThemeIdentity;
  immersive: boolean;
  orderingEnabled: boolean;
  onAdd: () => void;
}) {
  const label = dishExperienceLabel(item, index);
  const pairing = pairingSuggestion(item);

  return (
    <article className={`premium-lift ${themeIdentity.menuCardClass} group grid overflow-hidden rounded-[1.5rem] border shadow-sm sm:block ${immersive ? "border-white/10" : "border-black/10"} ${themeIdentity.menuStyle === "minimal" ? "rounded-none shadow-none" : ""} ${!item.is_available ? "opacity-70 grayscale-[.25]" : ""}`}>
      <div className="relative">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className={`h-48 w-full object-cover transition duration-700 group-hover:scale-105 sm:h-56 ${themeIdentity.imageTreatmentClass}`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <FoodFallback name={item.name} />
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full border border-white/25 bg-black/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
          {label}
        </span>
        {quantity > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold shadow-lg" style={{ color: primary }}>
            {quantity} in order
          </span>
        )}
        {!item.is_available && (
          <span className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-red-700 shadow-xl">
            Sold out tonight
          </span>
        )}
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-40">Plate {String(index + 1).padStart(2, "0")}</p>
            <h4 className="mt-1 text-2xl font-semibold leading-snug">{item.name}</h4>
          </div>
          <div className="shrink-0 text-right">
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] opacity-35">Price</span>
            <b className="block text-xl font-semibold" style={{ color: primary }}>{formatPrice(item.price)}</b>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 opacity-65">{item.description || "Ask the restaurant what pairs well with this dish."}</p>
        <p className={`mt-4 rounded-2xl border px-3 py-3 text-xs leading-5 opacity-75 ${immersive ? "border-white/10 bg-white/[.06]" : "border-black/5 bg-white/70"}`}>
          {pairing}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: secondary }}>
          {item.is_vegan && <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${immersive ? "bg-white/10" : "bg-black/[.04]"}`}><Leaf size={13} /> Vegan</span>}
          {!item.is_vegan && item.is_vegetarian && <span className={`rounded-full px-2.5 py-1 ${immersive ? "bg-white/10" : "bg-black/[.04]"}`}>Vegetarian</span>}
          {item.is_halal && <span className={`rounded-full px-2.5 py-1 ${immersive ? "bg-white/10" : "bg-black/[.04]"}`}>Halal</span>}
          {!item.is_available && <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">Unavailable</span>}
        </div>
        {item.allergens ? (
          <p className={`mt-3 rounded-xl px-3 py-2 text-xs ${immersive ? "bg-amber-400/10 text-amber-100" : "bg-amber-50 text-amber-900"}`}>Allergens: {item.allergens}</p>
        ) : (
          <p className={`mt-3 rounded-xl px-3 py-2 text-xs ${immersive ? "bg-white/[.06] text-white/50" : "bg-slate-50 text-slate-500"}`}>Ask staff about allergens before ordering.</p>
        )}
        <button
          disabled={!orderingEnabled || !item.is_available}
          onClick={onAdd}
          className={`luxury-button mt-5 flex w-full items-center justify-center gap-2 ${buttonClass} py-3.5 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none`}
          style={orderingEnabled && item.is_available ? { backgroundColor: primary } : undefined}
        >
          <Plus size={16} /> {orderButtonLabel({ orderingEnabled, itemAvailable: item.is_available })}
        </button>
      </div>
    </article>
  );
}

function orderButtonLabel({
  orderingEnabled,
  itemAvailable,
}: {
  orderingEnabled: boolean;
  itemAvailable: boolean;
}) {
  if (!orderingEnabled) return "Ordering paused";
  return itemAvailable ? "Add to order" : "Unavailable today";
}
