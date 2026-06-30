import {
  CalendarDays,
  ChefHat,
  Flame,
  Leaf,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Wheat,
  Wine,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { RestaurantThemeIdentity } from "@/lib/restaurantTheme";
import type { MenuItem, Restaurant } from "@/lib/types";
import {
  dishExperienceLabel,
  formatPrice,
  matchesMenuFilters,
  pairingSuggestion,
} from "./experience";
import PremiumNavigation, { getRestaurantNavigationLinks } from "./PremiumNavigation";

type MenuShowcaseProps = {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  menuItems: MenuItem[];
  featuredItems: MenuItem[];
  quantities: Record<number, number>;
  orderingEnabled: boolean;
  reservationsEnabled?: boolean;
  onAdd: (item: MenuItem) => void;
  showHeroNavigation?: boolean;
  mobileOpen?: boolean;
  onToggleMobile?: () => void;
  onCloseMobile?: () => void;
};

type ItalianPalette = {
  ivory: string;
  cream: string;
  parchment: string;
  terracotta: string;
  olive: string;
  charcoal: string;
  espresso: string;
  gold: string;
};

type MenuShowcaseCopy = {
  heroKicker: string;
  defaultSubheadline: string;
  heroDescriptionFallback: string;
  craftNoteTitle: string;
  craftNoteCopy: string;
  flowNoteTitle: string;
  flowNoteOrderingCopy: string;
  flowNoteBrowseCopy: string;
  introKicker: string;
  searchPlaceholder: string;
  signatureHeading: string;
  imageFallbackKicker: string;
};

const italianPalette: ItalianPalette = {
  ivory: "#fff8ef",
  cream: "#f7ead5",
  parchment: "#f1dcc0",
  terracotta: "#b9482d",
  olive: "#5f6f3d",
  charcoal: "#19120e",
  espresso: "#2d1b13",
  gold: "#c79a49",
};

export default function MenuShowcase({
  restaurant,
  themeIdentity,
  menuItems,
  featuredItems,
  quantities,
  orderingEnabled,
  reservationsEnabled = true,
  onAdd,
  showHeroNavigation = true,
  mobileOpen = false,
  onToggleMobile = () => undefined,
  onCloseMobile = () => undefined,
}: MenuShowcaseProps) {
  const [menuQuery, setMenuQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<"all" | "vegan" | "vegetarian" | "halal">("all");
  const italianMood = isItalianPizzeria(restaurant, themeIdentity, menuItems);
  const palette = italianMood ? italianPalette : {
    ...italianPalette,
    terracotta: themeIdentity.primary,
    olive: themeIdentity.secondary,
  };
  const copy = menuCopyForMood(italianMood);
  const heroVisual = getMenuHeroVisual(restaurant, featuredItems);

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
    <>
      <MenuHero
        restaurant={restaurant}
        palette={palette}
        copy={copy}
        themeIdentity={themeIdentity}
        heroVisual={heroVisual}
        orderingEnabled={orderingEnabled}
        reservationsEnabled={reservationsEnabled}
        showNavigation={showHeroNavigation}
        mobileOpen={mobileOpen}
        onToggleMobile={onToggleMobile}
        onCloseMobile={onCloseMobile}
      />
      <section
        id="menu"
        className="relative overflow-hidden px-4 py-14 text-[#2d1b13] sm:px-6 lg:py-24"
        style={{
          background:
            "radial-gradient(circle at 10% 0%, rgba(185,72,45,.13), transparent 24rem), radial-gradient(circle at 90% 8%, rgba(95,111,61,.12), transparent 22rem), linear-gradient(180deg, #fff8ef 0%, #f8ecd9 48%, #fffaf2 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[.18] [background-image:linear-gradient(90deg,rgba(45,27,19,.08)_1px,transparent_1px),linear-gradient(rgba(45,27,19,.07)_1px,transparent_1px)] [background-size:52px_52px]" />
        <div className="relative mx-auto max-w-7xl">
          <MenuIntro restaurant={restaurant} palette={palette} copy={copy} menuItems={menuItems} />
          {restaurant.categories.length === 0 || menuItems.length === 0 ? (
            <EmptyMenuState palette={palette} />
          ) : (
            <>
              <MenuToolbar
                restaurant={restaurant}
                palette={palette}
                copy={copy}
                menuQuery={menuQuery}
                dietaryFilter={dietaryFilter}
                visibleMenuItems={visibleMenuItems}
                onQueryChange={setMenuQuery}
                onFilterChange={setDietaryFilter}
              />

              {featuredItems.length > 0 && (
                <SignatureDishes
                  featuredItems={featuredItems}
                  palette={palette}
                  copy={copy}
                  themeIdentity={themeIdentity}
                  orderingEnabled={orderingEnabled}
                  onAdd={onAdd}
                />
              )}

              <div className="mt-16 space-y-20">
                {filteredCategories.map((category) => (
                  <section id={`category-${category.id}`} key={category.id} className="scroll-mt-32">
                    <CategoryHeading
                      name={category.name}
                      description={category.description}
                      sortOrder={category.sort_order || category.id}
                      availableCount={category.items.filter((item) => item.is_available).length}
                      palette={palette}
                    />
                    {category.items.length === 0 ? (
                      <div className="mt-6 rounded-[1.75rem] border border-dashed border-[#b9482d]/30 bg-white/[.55] p-8 text-center text-sm text-[#6f5144]">
                        No dishes match the current search or filter.
                      </div>
                    ) : (
                      <div className="mt-8 grid gap-7 lg:grid-cols-2">
                        {category.items.map((item, index) => (
                          <MenuItemCard
                            key={item.id}
                            item={item}
                            index={index}
                            quantity={quantities[item.id] || 0}
                            palette={palette}
                            copy={copy}
                            themeIdentity={themeIdentity}
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
    </>
  );
}

function MenuHero({
  restaurant,
  palette,
  copy,
  themeIdentity,
  heroVisual,
  orderingEnabled,
  reservationsEnabled,
  showNavigation,
  mobileOpen,
  onToggleMobile,
  onCloseMobile,
}: {
  restaurant: Restaurant;
  palette: ItalianPalette;
  copy: MenuShowcaseCopy;
  themeIdentity: RestaurantThemeIdentity;
  heroVisual: string;
  orderingEnabled: boolean;
  reservationsEnabled: boolean;
  showNavigation: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
}) {
  const basePath = `/restaurants/${restaurant.slug}`;
  const headline = isPizzaRestaurant(restaurant)
    ? "Authentic Neapolitan Pizza"
    : `${restaurant.name} Menu`;
  const subheadline = restaurant.tagline || copy.defaultSubheadline;

  return (
    <section className="relative flex min-h-[92svh] items-end overflow-hidden bg-[#19120e] text-white sm:min-h-[86svh]">
      <MenuHeroImage src={heroVisual} alt={`${restaurant.name} menu`} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(25,18,14,.98),rgba(45,27,19,.78)_43%,rgba(45,27,19,.24)),radial-gradient(circle_at_78%_20%,rgba(199,154,73,.22),transparent_24rem)]" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#19120e] via-[#19120e]/[.72] to-transparent" />
      <div className="absolute inset-0 opacity-[.13] [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:30px_30px]" />
      {showNavigation && (
        <PremiumNavigation
          restaurantName={restaurant.name}
          locationLabel={restaurant.city || "Restaurant experience"}
          logoUrl={restaurant.logo_url}
          homeHref={basePath}
          links={getRestaurantNavigationLinks(restaurant.slug)}
          cta={{
            label: reservationsEnabled ? "Reserve Table" : "Contact",
            href: reservationsEnabled ? `${basePath}/reservations` : `${basePath}/contact`,
          }}
          activePage="menu"
          buttonClass={themeIdentity.buttonClass}
          mobileOpen={mobileOpen}
          onToggleMobile={onToggleMobile}
          onCloseMobile={onCloseMobile}
        />
      )}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-4 pb-10 pt-32 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:pb-16">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/[.16] bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/[.72] backdrop-blur">
            <Flame size={15} style={{ color: palette.gold }} /> {copy.heroKicker}
          </p>
          <h1 className="mt-6 max-w-5xl text-balance text-[clamp(3.7rem,13vw,8.8rem)] font-semibold leading-[.82]">
            {headline}
          </h1>
          <p className="mt-6 max-w-2xl font-display text-2xl leading-tight text-white/[.84] sm:text-4xl">
            {subheadline}
          </p>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/[.62]">
            {restaurant.description || copy.heroDescriptionFallback}
          </p>
          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <a href="#menu" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#2d1b13] shadow-2xl">
              View Menu <Plus size={16} />
            </a>
            <a href={`${basePath}/reservations`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/[.22] bg-white/[.08] px-7 py-3.5 text-sm font-bold text-white backdrop-blur">
              Reserve a Table <CalendarDays size={16} />
            </a>
          </div>
        </div>
        <aside className="rounded-[2rem] border border-white/12 bg-white/[.08] p-5 shadow-2xl backdrop-blur-xl">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Wheat size={18} style={{ color: palette.gold }} />
            Handcrafted menu
          </p>
          <div className="mt-5 grid gap-4 text-sm leading-6 text-white/[.62]">
            <HeroNote icon={Flame} title={copy.craftNoteTitle} copy={copy.craftNoteCopy} />
            <HeroNote icon={Wine} title={copy.flowNoteTitle} copy={orderingEnabled ? copy.flowNoteOrderingCopy : copy.flowNoteBrowseCopy} />
            <HeroNote icon={MapPin} title="At the restaurant" copy={`${restaurant.address}, ${restaurant.city}`} />
          </div>
        </aside>
      </div>
    </section>
  );
}

function MenuIntro({
  restaurant,
  palette,
  copy,
  menuItems,
}: {
  restaurant: Restaurant;
  palette: ItalianPalette;
  copy: MenuShowcaseCopy;
  menuItems: MenuItem[];
}) {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.26em]" style={{ color: palette.terracotta }}>
        {copy.introKicker}
      </p>
      <h2 className="mt-4 text-balance text-5xl font-semibold leading-[.95] text-[#2d1b13] sm:text-7xl">
        A menu built around appetite, not interface.
      </h2>
      <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#6f5144]">
        Browse {restaurant.name}'s dishes with the warmth of a real menu: generous photography, clear ingredients, dietary notes, and direct ordering when available.
      </p>
      <p className="mt-5 text-sm font-semibold text-[#8a6a44]">
        {menuItems.filter((item) => item.is_available).length} dishes available tonight
      </p>
    </div>
  );
}

function MenuToolbar({
  restaurant,
  palette,
  copy,
  menuQuery,
  dietaryFilter,
  visibleMenuItems,
  onQueryChange,
  onFilterChange,
}: {
  restaurant: Restaurant;
  palette: ItalianPalette;
  copy: MenuShowcaseCopy;
  menuQuery: string;
  dietaryFilter: "all" | "vegan" | "vegetarian" | "halal";
  visibleMenuItems: number;
  onQueryChange: (value: string) => void;
  onFilterChange: (value: "all" | "vegan" | "vegetarian" | "halal") => void;
}) {
  return (
    <div className="sticky top-0 z-20 -mx-4 mt-12 border-y border-[#8a5a35]/[.18] bg-[#fff8ef]/95 px-4 py-3 shadow-[0_18px_60px_rgba(45,27,19,.12)] backdrop-blur-xl sm:top-2 sm:mx-0 sm:rounded-[1.5rem] sm:border">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a6a44]" size={18} />
          <input
            value={menuQuery}
            onChange={(event) => onQueryChange(event.target.value)}
            className="min-h-12 w-full rounded-full border border-[#d8b889]/70 bg-white/[.86] py-3 pl-11 pr-4 text-base text-[#2d1b13] shadow-inner placeholder:text-[#8a6a44]/70 sm:text-sm"
            placeholder={copy.searchPlaceholder}
            autoComplete="off"
          />
        </label>
        <div className="flex snap-x gap-2 overflow-x-auto [-webkit-overflow-scrolling:touch]">
          {(["all", "vegan", "vegetarian", "halal"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`min-h-11 shrink-0 snap-start rounded-full border px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
                dietaryFilter === filter
                  ? "text-white shadow-md"
                  : "border-[#d8b889]/70 bg-white/80 text-[#5c3d2d] hover:border-[#b9482d]/50"
              }`}
              style={dietaryFilter === filter ? { backgroundColor: palette.terracotta, borderColor: palette.terracotta } : undefined}
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
            className="flex min-h-11 shrink-0 snap-start items-center rounded-full border border-[#d8b889]/70 bg-white/80 px-4 py-2.5 text-sm font-bold text-[#4a2f22] shadow-sm transition hover:-translate-y-0.5 hover:border-[#b9482d]/50"
          >
            {category.name}
          </a>
        ))}
      </div>
      {(menuQuery || dietaryFilter !== "all") && (
        <p className="mt-3 text-center text-xs font-semibold text-[#8a6a44]">{visibleMenuItems} dishes match your selection</p>
      )}
    </div>
  );
}

function SignatureDishes({
  featuredItems,
  palette,
  copy,
  themeIdentity,
  orderingEnabled,
  onAdd,
}: {
  featuredItems: MenuItem[];
  palette: ItalianPalette;
  copy: MenuShowcaseCopy;
  themeIdentity: RestaurantThemeIdentity;
  orderingEnabled: boolean;
  onAdd: (item: MenuItem) => void;
}) {
  return (
    <div className="mt-12 overflow-hidden rounded-[2rem] border border-[#6d3a25]/[.16] bg-[#19120e] p-4 text-white shadow-[0_35px_100px_rgba(45,27,19,.24)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.24em]" style={{ color: palette.gold }}>Signature dishes</p>
          <h3 className="mt-2 text-3xl font-semibold leading-tight sm:text-5xl">{copy.signatureHeading}</h3>
        </div>
        <Sparkles className="hidden text-white/[.35] sm:block" />
      </div>
      <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
        {featuredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (orderingEnabled) onAdd(item);
            }}
            disabled={!orderingEnabled}
            className="group w-80 shrink-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[.07] text-left shadow-2xl transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className={`h-48 w-full object-cover transition duration-700 group-hover:scale-105 ${themeIdentity.imageTreatmentClass}`} loading="lazy" decoding="async" />
            ) : (
              <FoodFallback name={item.name} kicker={copy.imageFallbackKicker} compact />
            )}
            <span className="block p-4">
              <span className="block text-2xl font-semibold leading-tight">{item.name}</span>
              <span className="mt-2 block line-clamp-2 text-sm leading-6 text-white/[.58]">{item.description || "Prepared by the kitchen tonight."}</span>
              <span className="mt-4 flex items-center justify-between text-sm font-bold">
                <span style={{ color: palette.gold }}>{formatPrice(item.price)}</span>
                {orderingEnabled ? <Plus size={16} /> : <span>Browse</span>}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CategoryHeading({
  name,
  description,
  sortOrder,
  availableCount,
  palette,
}: {
  name: string;
  description: string;
  sortOrder: number;
  availableCount: number;
  palette: ItalianPalette;
}) {
  return (
    <div className="grid gap-5 border-b border-[#8a5a35]/[.18] pb-6 md:grid-cols-[auto_1fr_auto] md:items-end">
      <span className="font-display text-6xl leading-none text-[#2d1b13]/[.18]">{String(sortOrder).padStart(2, "0")}</span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: palette.terracotta }}>Menu section</p>
        <h3 className="mt-2 text-4xl font-semibold leading-tight text-[#2d1b13] sm:text-6xl">{name}</h3>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[#6f5144]">{description || "Prepared fresh by the kitchen."}</p>
      </div>
      <span className="w-fit rounded-full border border-[#d8b889]/80 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#5f6f3d] shadow-sm">
        {availableCount} available
      </span>
    </div>
  );
}

function MenuItemCard({
  item,
  index,
  quantity,
  palette,
  copy,
  themeIdentity,
  orderingEnabled,
  onAdd,
}: {
  item: MenuItem;
  index: number;
  quantity: number;
  palette: ItalianPalette;
  copy: MenuShowcaseCopy;
  themeIdentity: RestaurantThemeIdentity;
  orderingEnabled: boolean;
  onAdd: () => void;
}) {
  const label = dishExperienceLabel(item, index);
  const pairing = pairingSuggestion(item);

  return (
    <article className={`group overflow-hidden rounded-[2rem] border border-[#d6b98e]/60 bg-white/[.82] shadow-[0_24px_70px_rgba(45,27,19,.12)] transition hover:-translate-y-1 hover:shadow-[0_36px_95px_rgba(45,27,19,.18)] ${!item.is_available ? "opacity-70 grayscale-[.18]" : ""}`}>
      <div className="grid min-h-full md:grid-cols-[.92fr_1.08fr]">
        <div className="relative min-h-72 overflow-hidden bg-[#2d1b13]">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className={`h-full min-h-72 w-full object-cover transition duration-700 group-hover:scale-105 ${themeIdentity.imageTreatmentClass}`}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <FoodFallback name={item.name} kicker={copy.imageFallbackKicker} />
          )}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/[.64] to-transparent" />
          <span className="absolute left-4 top-4 rounded-full border border-white/25 bg-black/[.38] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
            {label}
          </span>
          {quantity > 0 && (
            <span className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-bold shadow-lg" style={{ color: palette.terracotta }}>
              {quantity} in order
            </span>
          )}
          {!item.is_available && (
            <span className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-red-700 shadow-xl">
              Sold out tonight
            </span>
          )}
        </div>
        <div className="flex flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a6a44]">Plate {String(index + 1).padStart(2, "0")}</p>
              <h4 className="mt-2 text-3xl font-semibold leading-tight text-[#2d1b13]">{item.name}</h4>
            </div>
            <div className="shrink-0 text-right">
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a6a44]">Price</span>
              <b className="block text-2xl font-semibold" style={{ color: palette.terracotta }}>{formatPrice(item.price)}</b>
            </div>
          </div>
          <p className="mt-4 text-base leading-7 text-[#6f5144]">{item.description || "Ask the restaurant what pairs well with this dish."}</p>
          <p className="mt-5 rounded-2xl border border-[#d8b889]/60 bg-[#fff8ef] px-4 py-3 text-sm leading-6 text-[#6f5144]">
            {pairing}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: palette.olive }}>
            {item.is_vegan && <span className="flex items-center gap-1 rounded-full bg-[#eef1e5] px-2.5 py-1"><Leaf size={13} /> Vegan</span>}
            {!item.is_vegan && item.is_vegetarian && <span className="rounded-full bg-[#eef1e5] px-2.5 py-1">Vegetarian</span>}
            {item.is_halal && <span className="rounded-full bg-[#eef1e5] px-2.5 py-1">Halal</span>}
            {!item.is_available && <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">Unavailable</span>}
          </div>
          {item.allergens ? (
            <p className="mt-3 rounded-xl bg-[#f8ead1] px-3 py-2 text-xs text-[#704a2b]">Allergens: {item.allergens}</p>
          ) : (
            <p className="mt-3 rounded-xl bg-[#fff8ef] px-3 py-2 text-xs text-[#8a6a44]">Ask staff about allergens before ordering.</p>
          )}
          <button
            disabled={!orderingEnabled || !item.is_available}
            onClick={onAdd}
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none"
            style={orderingEnabled && item.is_available ? { backgroundColor: palette.terracotta } : undefined}
          >
            <Plus size={16} /> {orderButtonLabel({ orderingEnabled, itemAvailable: item.is_available })}
          </button>
        </div>
      </div>
    </article>
  );
}

function FoodFallback({ name, kicker, compact = false }: { name: string; kicker: string; compact?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-[#2d1b13] text-white ${compact ? "h-48" : "h-full min-h-72"}`}>
      <div
        className="absolute inset-0 opacity-85"
        style={{
          background:
            "radial-gradient(circle at 24% 20%, rgba(255,248,220,.18), transparent 9rem), radial-gradient(circle at 75% 80%, rgba(185,72,45,.42), transparent 13rem), linear-gradient(135deg, #2d1b13, #5d281b 54%, #19120e)",
        }}
      />
      <div className="absolute inset-x-5 bottom-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/[.45]">{kicker}</p>
        <p className="mt-2 line-clamp-2 font-display text-2xl font-semibold leading-tight">{name}</p>
      </div>
    </div>
  );
}

function MenuHeroImage({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 74% 22%, rgba(199,154,73,.24), transparent 22rem), radial-gradient(circle at 24% 74%, rgba(185,72,45,.38), transparent 25rem), linear-gradient(135deg, #19120e, #5d281b 48%, #1b130f)",
        }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover saturate-[1.18] contrast-[1.04] brightness-[.78]"
      loading="eager"
      decoding="async"
    />
  );
}

function HeroNote({ icon: Icon, title, copy }: { icon: LucideIcon; title: string; copy: string }) {
  return (
    <p className="grid grid-cols-[auto_1fr] gap-3">
      <Icon size={18} className="mt-0.5 text-white/[.72]" />
      <span>
        <b className="block text-white">{title}</b>
        {copy}
      </span>
    </p>
  );
}

function EmptyMenuState({ palette }: { palette: ItalianPalette }) {
  return (
    <div className="mt-12 rounded-[2rem] border border-dashed border-[#b9482d]/30 bg-white/[.72] p-10 text-center shadow-sm">
      <ChefHat className="mx-auto opacity-35" size={42} style={{ color: palette.terracotta }} />
      <h3 className="mt-4 text-3xl font-semibold text-[#2d1b13]">Menu coming soon</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6f5144]">
        The restaurant is still preparing its online menu. Call the restaurant or request a table for help.
      </p>
    </div>
  );
}

function getMenuHeroVisual(restaurant: Restaurant, featuredItems: MenuItem[]) {
  return (
    featuredItems.find((item) => item.image_url)?.image_url ||
    restaurant.images.find((image) => image.image_type === "food")?.url ||
    restaurant.hero_image ||
    restaurant.images.find((image) => image.image_type === "gallery")?.url ||
    ""
  );
}

function isItalianPizzeria(restaurant: Restaurant, themeIdentity: RestaurantThemeIdentity, menuItems: MenuItem[]) {
  const searchable = [
    restaurant.name,
    restaurant.tagline,
    restaurant.description,
    restaurant.story,
    themeIdentity.key,
    themeIdentity.name,
    ...restaurant.categories.map((category) => category.name),
    ...menuItems.map((item) => `${item.name} ${item.description}`),
  ].join(" ").toLowerCase();

  return ["italian", "pizza", "pizzeria", "napoli", "neapolitan", "pasta", "burrata"].some((term) => searchable.includes(term));
}

function isPizzaRestaurant(restaurant: Restaurant) {
  const searchable = [
    restaurant.name,
    restaurant.tagline,
    restaurant.description,
    ...restaurant.categories.map((category) => category.name),
  ].join(" ").toLowerCase();

  return ["pizza", "pizzeria", "napoli", "neapolitan"].some((term) => searchable.includes(term));
}

function menuCopyForMood(italianMood: boolean): MenuShowcaseCopy {
  if (italianMood) {
    return {
      heroKicker: "Wood-fired warmth",
      defaultSubheadline: "Baked with patience, fire, and Italian warmth.",
      heroDescriptionFallback: "A handcrafted menu of slow dough, bright tomato, fresh herbs, and the kind of heat only a proper oven can give.",
      craftNoteTitle: "Wood-fired character",
      craftNoteCopy: "Crisp edges, soft centers, and a little smoke in the crust.",
      flowNoteTitle: "Italian rhythm",
      flowNoteOrderingCopy: "Browse, order, or reserve without leaving the mood.",
      flowNoteBrowseCopy: "Browse dishes and reserve without leaving the mood.",
      introKicker: "Fresh from the oven",
      searchPlaceholder: "Search pizza, burrata, allergens...",
      signatureHeading: "Begin with the plates that smell of the oven.",
      imageFallbackKicker: "From the oven",
    };
  }

  return {
    heroKicker: "Chef-led menu",
    defaultSubheadline: "Seasonal dishes, polished service, and a clear path from appetite to table.",
    heroDescriptionFallback: "A carefully edited menu with clear ingredients, dietary notes, and direct next steps for ordering or booking.",
    craftNoteTitle: "Kitchen signature",
    craftNoteCopy: "Thoughtful ingredients, confident pacing, and dishes prepared with care tonight.",
    flowNoteTitle: "Guest rhythm",
    flowNoteOrderingCopy: "Browse, order, or reserve without leaving the experience.",
    flowNoteBrowseCopy: "Browse dishes and reserve without leaving the experience.",
    introKicker: "From the kitchen",
    searchPlaceholder: "Search dishes, ingredients, allergens...",
    signatureHeading: "Begin with the plates guests come back for.",
    imageFallbackKicker: "From the kitchen",
  };
}

function serviceModeLabel({
  deliveryEnabled,
  pickupEnabled,
  dineInEnabled,
}: {
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  dineInEnabled: boolean;
}) {
  const modes = [
    dineInEnabled && "dine-in",
    pickupEnabled && "pickup",
    deliveryEnabled && "delivery",
  ].filter(Boolean);
  return modes.length > 0 ? `Available for ${modes.join(", ")}` : "Service details available from the restaurant";
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
