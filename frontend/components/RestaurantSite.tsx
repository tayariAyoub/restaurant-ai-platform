"use client";

import { CalendarDays, Clock, Mail, MapPin, Phone, ShoppingBag, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import ChatWidget from "@/components/ChatWidget";
import GalleryShowcase from "@/components/public/restaurant/GalleryShowcase";
import ImmersiveRestaurantExperience from "@/components/public/restaurant/ImmersiveRestaurantExperience";
import MenuShowcase from "@/components/public/restaurant/MenuShowcase";
import OrderCartDrawer from "@/components/public/restaurant/OrderCartDrawer";
import PremiumHomepage from "@/components/public/restaurant/PremiumHomepage";
import PremiumNavigation, { getRestaurantNavigationLinks } from "@/components/public/restaurant/PremiumNavigation";
import request from "@/lib/api";
import { clearCart, loadCart, saveCart, type StoredCart } from "@/lib/cartStorage";
import { buildRestaurantJsonLd } from "@/lib/restaurantSeo";
import { resolveRestaurantTheme, type RestaurantThemeIdentity } from "@/lib/restaurantTheme";
import type { MenuItem, Restaurant, RestaurantImage, RestaurantOrder } from "@/lib/types";
import {
  buildDietaryPrompts,
  formatPrice,
  parseOpeningHours,
} from "./public/restaurant/experience";

type CartLine = StoredCart[number];
type RestaurantSitePage = "home" | "menu" | "reservations" | "gallery" | "contact" | "events";

export default function RestaurantSite({ restaurant, page = "home" }: { restaurant: Restaurant; page?: RestaurantSitePage }) {
  const [mobile, setMobile] = useState(false);
  const [reservationStatus, setReservationStatus] = useState("");
  const [cart, setCart] = useState<Record<number, CartLine>>({});
  const [cartHydrated, setCartHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<RestaurantOrder["order_type"]>("PICKUP");
  const [orderStatus, setOrderStatus] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<RestaurantOrder | null>(null);

  const themeIdentity = resolveRestaurantTheme(restaurant);
  const primary = themeIdentity.primary;
  const background = themeIdentity.background;
  const text = themeIdentity.text;
  const font = themeIdentity.fontFamily;
  const buttonClass = themeIdentity.buttonClass;

  const hours = useMemo(() => parseOpeningHours(restaurant.opening_hours), [restaurant.opening_hours]);
  const gallery = restaurant.images.filter((image) => ["gallery", "food"].includes(image.image_type));
  const menuItems = useMemo(
    () => restaurant.categories.flatMap((category) => category.items),
    [restaurant.categories],
  );
  const availableItems = menuItems.filter((item) => item.is_available).length;
  const featuredItems = menuItems.filter((item) => item.is_available).slice(0, 4);
  const heroVisual = restaurant.hero_image || gallery[0]?.url || "";
  const dietaryPrompts = buildDietaryPrompts(menuItems);
  const cartLines = Object.values(cart);
  const cartCount = cartLines.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cartLines.reduce((total, line) => total + Number(line.item.price) * line.quantity, 0);
  const quantities = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(cart).map(([itemId, line]) => [Number(itemId), line.quantity]),
      ) as Record<number, number>,
    [cart],
  );
  const structuredData = buildRestaurantJsonLd(restaurant);
  const cartScope = restaurant.slug || restaurant.id;
  const reservationsEnabled = restaurant.reservations_enabled !== false;
  const orderingEnabled = restaurant.ordering_enabled !== false;
  const cartEnabled = page === "menu" && orderingEnabled;
  const deliveryEnabled = restaurant.delivery_enabled !== false;
  const pickupEnabled = restaurant.pickup_enabled !== false;
  const dineInEnabled = restaurant.dine_in_enabled !== false;
  const chatbotEnabled = restaurant.chatbot_enabled !== false;
  const orderModes = useMemo(
    () =>
      [
        pickupEnabled && "PICKUP",
        dineInEnabled && "EAT_IN",
        deliveryEnabled && "DELIVERY",
      ].filter(Boolean) as RestaurantOrder["order_type"][],
    [deliveryEnabled, dineInEnabled, pickupEnabled],
  );
  const footerServices = [
    "Menu",
    reservationsEnabled && "reservations",
    "directions",
    orderingEnabled && "ordering",
  ].filter(Boolean).join(", ");
  const immersiveTheme = themeIdentity.homepageStyle === "immersive";
  const footerStyle = immersiveTheme
    ? {
        background:
          "linear-gradient(180deg, rgba(5,3,11,.98), rgba(2,1,8,1))",
        color: themeIdentity.text,
      }
    : { backgroundColor: text, color: background };

  useEffect(() => {
    if (orderModes.length > 0 && !orderModes.includes(orderType)) {
      setOrderType(orderModes[0]);
    }
  }, [orderModes, orderType]);

  useEffect(() => {
    if (page !== "menu") {
      setCartHydrated(false);
      setCart({});
      return;
    }

    setCartHydrated(false);
    setCart(loadCart(cartScope, menuItems));
    setCartHydrated(true);
  }, [cartScope, menuItems, page]);

  useEffect(() => {
    if (page !== "menu") return;
    if (!cartHydrated) return;
    saveCart(cartScope, cart);
  }, [cart, cartHydrated, cartScope, page]);

  function changeCart(item: MenuItem, change: number) {
    if (!cartEnabled) return;
    setCart((current) => {
      const quantity = (current[item.id]?.quantity || 0) + change;
      if (quantity <= 0) {
        const next = { ...current };
        delete next[item.id];
        return next;
      }
      return { ...current, [item.id]: { item, quantity } };
    });
  }

  function removeCartItem(itemId: number) {
    setCart((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (orderSubmitting) return;
    setOrderStatus("Sending your order...");
    setOrderSubmitting(true);
    try {
      const order = await request<RestaurantOrder>(`/restaurants/${restaurant.slug}/orders`, {
        method: "POST",
        body: JSON.stringify({
          order_type: orderType,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          customer_email: data.customer_email || null,
          notes: data.notes || "",
          items: cartLines.map((line) => ({
            menu_item_id: line.item.id,
            quantity: line.quantity,
            notes: "",
          })),
          delivery_address:
            orderType === "DELIVERY"
              ? {
                  street: data.street,
                  postal_code: data.delivery_postal_code,
                  city: data.delivery_city,
                  instructions: data.delivery_instructions || "",
                }
              : null,
        }),
      });
      setCompletedOrder(order);
      setCart({});
      clearCart(cartScope);
      setOrderStatus("");
    } catch (error) {
      setOrderStatus(error instanceof Error ? error.message : "Could not place order.");
    } finally {
      setOrderSubmitting(false);
    }
  }

  async function reserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setReservationStatus("Sending...");
    try {
      await request(`/restaurants/${restaurant.slug}/reservations`, {
        method: "POST",
        body: JSON.stringify({
          ...data,
          party_size: data.party_size ? Number(data.party_size) : null,
        }),
      });
      form.reset();
      setReservationStatus("Your table request has been received. The restaurant will confirm the details shortly.");
    } catch (error) {
      setReservationStatus(error instanceof Error ? error.message : "Could not send request.");
    }
  }

  return (
    <div
      className="luxury-shell min-h-screen antialiased"
      style={{ background: themeIdentity.shellBackground, backgroundColor: background, color: text, fontFamily: font }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
      />
      <main id="top">
        {immersiveTheme ? (
          <ImmersiveRestaurantExperience
            page={page}
            restaurant={restaurant}
            themeIdentity={themeIdentity}
            heroVisual={heroVisual}
            gallery={gallery}
            menuItems={menuItems}
            featuredItems={featuredItems}
            quantities={quantities}
            hours={hours}
            reservationsEnabled={reservationsEnabled}
            orderingEnabled={orderingEnabled}
            deliveryEnabled={deliveryEnabled}
            pickupEnabled={pickupEnabled}
            dineInEnabled={dineInEnabled}
            chatbotEnabled={chatbotEnabled}
            availableItems={availableItems}
            mobileOpen={mobile}
            onToggleMobile={() => setMobile((current) => !current)}
            onCloseMobile={() => setMobile(false)}
            reservationStatus={reservationStatus}
            onReserve={reserve}
            onAdd={(item) => changeCart(item, 1)}
          />
        ) : (
          renderClassicPage({
            page,
            restaurant,
            themeIdentity,
            heroVisual,
            availableItems,
            reservationsEnabled,
            orderingEnabled,
            deliveryEnabled,
            pickupEnabled,
            dineInEnabled,
            mobile,
            toggleMobile: () => setMobile((current) => !current),
            closeMobile: () => setMobile(false),
            menuItems,
            featuredItems,
            quantities,
            gallery,
            chatbotEnabled,
            hours,
            reservationStatus,
            reserve,
            add: (item) => changeCart(item, 1),
          })
        )}
      </main>

      {!immersiveTheme && page !== "home" && (
        <footer
          className="px-6 py-12 text-center text-sm"
          style={footerStyle}
        >
          <p className="font-display text-3xl font-semibold">{restaurant.name}</p>
          <p className="mt-3 opacity-70">{restaurant.address}, {restaurant.city}</p>
          <p className="mt-6 text-xs uppercase tracking-[0.24em] opacity-50">{footerServices}.</p>
        </footer>
      )}

      {chatbotEnabled && (
        <ChatWidget
          slug={restaurant.slug}
          restaurantName={restaurant.name}
          aiName={restaurant.ai_name || "AI Maitre d'"}
          welcomeMessage={restaurant.ai_welcome_message}
          escalationMessage={restaurant.ai_escalation_message}
          primaryColor={primary}
          menuHighlights={featuredItems.map((item) => item.name)}
          dietaryPrompts={dietaryPrompts}
          bottomOffsetClass={cartEnabled && cartCount > 0 ? "bottom-[calc(6.75rem+env(safe-area-inset-bottom))] sm:bottom-5" : "bottom-[calc(1.25rem+env(safe-area-inset-bottom))]"}
        />
      )}

      {cartEnabled && cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="luxury-button fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-white/15 px-4 py-3 text-left text-sm font-bold text-white shadow-2xl backdrop-blur sm:left-1/2 sm:right-auto sm:w-[min(560px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:rounded-full sm:px-6 sm:py-4 sm:text-base"
          style={{ backgroundColor: primary }}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15"><ShoppingBag size={19} /></span>
            <span className="min-w-0">
              <span className="block truncate">View order</span>
              <span className="block text-xs text-white/75">{cartCount} item{cartCount === 1 ? "" : "s"}</span>
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-white/15 px-3 py-2">{formatPrice(subtotal)}</span>
        </button>
      )}

      {page === "menu" && (
        <OrderCartDrawer
          restaurant={restaurant}
          cartOpen={cartOpen}
          setCartOpen={setCartOpen}
          cartLines={cartLines}
          subtotal={subtotal}
          orderType={orderType}
          setOrderType={setOrderType}
          orderStatus={orderStatus}
          orderSubmitting={orderSubmitting}
          completedOrder={completedOrder}
          setCompletedOrder={setCompletedOrder}
          orderModes={orderModes}
          primary={primary}
          buttonClass={buttonClass}
          changeCart={changeCart}
          removeItem={removeCartItem}
          submitOrder={submitOrder}
        />
      )}
    </div>
  );
}

function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function renderClassicPage({
  page,
  restaurant,
  themeIdentity,
  heroVisual,
  availableItems,
  reservationsEnabled,
  orderingEnabled,
  deliveryEnabled,
  pickupEnabled,
  dineInEnabled,
  mobile,
  toggleMobile,
  closeMobile,
  menuItems,
  featuredItems,
  quantities,
  gallery,
  chatbotEnabled,
  hours,
  reservationStatus,
  reserve,
  add,
}: {
  page: RestaurantSitePage;
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  heroVisual: string;
  availableItems: number;
  reservationsEnabled: boolean;
  orderingEnabled: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  dineInEnabled: boolean;
  mobile: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
  menuItems: MenuItem[];
  featuredItems: MenuItem[];
  quantities: Record<number, number>;
  gallery: RestaurantImage[];
  chatbotEnabled: boolean;
  hours: Record<string, string>;
  reservationStatus: string;
  reserve: (event: FormEvent<HTMLFormElement>) => void;
  add: (item: MenuItem) => void;
}) {
  if (page === "menu") {
    return (
      <MenuShowcase
        restaurant={restaurant}
        themeIdentity={themeIdentity}
        menuItems={menuItems}
        featuredItems={featuredItems}
        quantities={quantities}
        orderingEnabled={orderingEnabled}
        reservationsEnabled={reservationsEnabled}
        mobileOpen={mobile}
        onToggleMobile={toggleMobile}
        onCloseMobile={closeMobile}
        onAdd={add}
      />
    );
  }

  if (page === "reservations") {
    return (
      <>
        <ClassicPageHero restaurant={restaurant} themeIdentity={themeIdentity} heroVisual={heroVisual} page={page} title="Reservations" copy="Request a table and give the team the details they need to prepare well." reservationsEnabled={reservationsEnabled} mobileOpen={mobile} onToggleMobile={toggleMobile} onCloseMobile={closeMobile} />
        <ClassicReservationPage restaurant={restaurant} themeIdentity={themeIdentity} reservationStatus={reservationStatus} onReserve={reserve} enabled={reservationsEnabled} />
      </>
    );
  }

  if (page === "gallery") {
    return (
      <>
        <ClassicPageHero restaurant={restaurant} themeIdentity={themeIdentity} heroVisual={heroVisual} page={page} title="Gallery" copy="Food, room, service, and atmosphere before you arrive." reservationsEnabled={reservationsEnabled} mobileOpen={mobile} onToggleMobile={toggleMobile} onCloseMobile={closeMobile} />
        <GalleryShowcase restaurant={restaurant} themeIdentity={themeIdentity} gallery={gallery} />
      </>
    );
  }

  if (page === "contact") {
    return (
      <>
        <ClassicPageHero restaurant={restaurant} themeIdentity={themeIdentity} heroVisual={heroVisual} page={page} title="Contact" copy="Address, hours, phone, email, map, and social links." reservationsEnabled={reservationsEnabled} mobileOpen={mobile} onToggleMobile={toggleMobile} onCloseMobile={closeMobile} />
        <ClassicContactPage restaurant={restaurant} themeIdentity={themeIdentity} hours={hours} />
      </>
    );
  }

  if (page === "events") {
    return (
      <>
        <ClassicPageHero restaurant={restaurant} themeIdentity={themeIdentity} heroVisual={heroVisual} page={page} title="Private Dining & Events" copy="Plan a special table, private dinner, or hospitality moment directly with the restaurant." reservationsEnabled={reservationsEnabled} mobileOpen={mobile} onToggleMobile={toggleMobile} onCloseMobile={closeMobile} />
        <ClassicEventsPage restaurant={restaurant} themeIdentity={themeIdentity} />
      </>
    );
  }

  return (
    <PremiumHomepage
      restaurant={restaurant}
      themeIdentity={themeIdentity}
      heroVisual={heroVisual}
      gallery={gallery}
      featuredItems={featuredItems}
      availableItems={availableItems}
      hours={hours}
      reservationsEnabled={reservationsEnabled}
      orderingEnabled={orderingEnabled}
      deliveryEnabled={deliveryEnabled}
      pickupEnabled={pickupEnabled}
      dineInEnabled={dineInEnabled}
      chatbotEnabled={chatbotEnabled}
      mobileOpen={mobile}
      onToggleMobile={toggleMobile}
      onCloseMobile={closeMobile}
    />
  );
}

function ClassicPageHero({
  restaurant,
  themeIdentity,
  heroVisual,
  page,
  title,
  copy,
  reservationsEnabled,
  mobileOpen,
  onToggleMobile,
  onCloseMobile,
}: {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  heroVisual: string;
  page: RestaurantSitePage;
  title: string;
  copy: string;
  reservationsEnabled: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
}) {
  const basePath = `/restaurants/${restaurant.slug}`;

  return (
    <section
      className="relative overflow-hidden px-4 pb-16 pt-5 text-white sm:px-6 lg:pb-24"
      style={
        heroVisual
          ? {
              backgroundImage: `${themeIdentity.heroOverlay}, url(${heroVisual})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : { background: themeIdentity.heroFallback }
      }
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_16%,rgba(255,255,255,.18),transparent_22rem)]" />
      <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/55 to-transparent" />
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
        activePage={page}
        buttonClass={themeIdentity.buttonClass}
        mobileOpen={mobileOpen}
        onToggleMobile={onToggleMobile}
        onCloseMobile={onCloseMobile}
      />
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="max-w-4xl pb-6 pt-40 sm:pt-44 lg:pt-48">
          <p className="luxury-kicker text-xs font-bold text-white/60">{restaurant.tagline || "Restaurant"} in {restaurant.city || "your city"}</p>
          <h1 className="mt-5 text-balance text-[clamp(3.75rem,12vw,8rem)] font-semibold leading-[.86] tracking-normal">{title}</h1>
          <p className="mt-6 max-w-2xl text-balance text-lg leading-8 text-white/76 sm:text-xl">{copy}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`${basePath}/menu`} className="min-h-12 rounded-full border border-white/[.18] bg-white px-6 py-3 text-sm font-bold text-[#21160f] shadow-2xl transition hover:-translate-y-0.5">
              View menu
            </a>
            <a href={`${basePath}/reservations`} className="min-h-12 rounded-full border border-white/[.18] bg-white/[.10] px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[.16]">
              Reserve table
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClassicReservationPage({
  restaurant,
  themeIdentity,
  reservationStatus,
  onReserve,
  enabled,
}: {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  reservationStatus: string;
  onReserve: (event: FormEvent<HTMLFormElement>) => void;
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-4xl font-semibold">Online reservations are currently paused.</h2>
        <p className="mt-4 opacity-60">Please contact {restaurant.name} directly for table requests.</p>
      </section>
    );
  }
  return (
    <section className="bg-[#f8f1e7] px-4 py-16 text-[#22170f] sm:px-6 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.82fr_1.18fr] lg:items-stretch">
        <div className="rounded-[2rem] border border-[#2d1b13]/10 bg-[#25170f] p-7 text-white shadow-2xl sm:p-9">
          <p className="luxury-kicker text-xs font-bold text-white/58">A calmer way to book</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.02] sm:text-5xl">Share the occasion, then let the restaurant prepare the table.</h2>
          <p className="mt-5 text-base leading-7 text-white/68">
            Share the date, party size, allergies, and occasion. {restaurant.name} can prepare the table with the same care as the kitchen.
          </p>
          <div className="mt-8 grid gap-3 text-sm font-semibold text-white/76">
            <span className="flex items-center gap-3"><CalendarDays size={18} /> Date, time, and party size</span>
            <span className="flex items-center gap-3"><Sparkles size={18} /> Allergies and special occasions</span>
            <span className="flex items-center gap-3"><Phone size={18} /> Direct confirmation from the restaurant</span>
          </div>
        </div>
        <form id="reserve" onSubmit={onReserve} className="rounded-[2rem] border border-[#2d1b13]/10 bg-white p-6 text-slate-900 shadow-[0_24px_70px_rgba(45,27,19,.12)] sm:p-8">
          <p className="luxury-kicker text-xs font-bold" style={{ color: themeIdentity.primary }}>Reservations</p>
          <h3 className="mt-2 text-3xl font-semibold sm:text-5xl">Request a table</h3>
          <p className="mt-3 text-sm leading-6 text-slate-500">The team confirms every request directly, so no detail is lost.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <input name="name" required placeholder="Your name" autoComplete="name" className="min-h-12 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 sm:text-sm" />
            <input name="email" type="email" required placeholder="Email" autoComplete="email" inputMode="email" className="min-h-12 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 sm:text-sm" />
            <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Phone" className="min-h-12 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 sm:text-sm" />
            <input name="party_size" type="number" min="1" inputMode="numeric" placeholder="Guests" className="min-h-12 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 sm:text-sm" />
            <input name="requested_at" type="datetime-local" className="min-h-12 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 sm:col-span-2 sm:text-sm" />
            <textarea name="message" placeholder="Allergies, occasion, preferred table, or notes" className="min-h-28 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 sm:col-span-2 sm:text-sm" />
          </div>
          <button className={`luxury-button mt-4 min-h-12 w-full ${themeIdentity.buttonClass} py-3.5 font-semibold text-white shadow-lg`} style={{ backgroundColor: themeIdentity.primary }}>
            Send reservation request
          </button>
          {reservationStatus && <p className="mt-3 rounded-xl border border-green-100 bg-green-50 p-3 text-center text-sm font-semibold text-green-800">{reservationStatus}</p>}
        </form>
      </div>
    </section>
  );
}

function ClassicContactPage({
  restaurant,
  themeIdentity,
  hours,
}: {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  hours: Record<string, string>;
}) {
  return (
    <section className="bg-[#fbf6ee] px-4 py-16 text-[#21160f] sm:px-6 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_.86fr]">
        <div className="rounded-[2rem] border border-[#2d1b13]/10 bg-white p-7 shadow-[0_24px_70px_rgba(45,27,19,.1)] sm:p-9">
          <p className="luxury-kicker text-xs font-bold" style={{ color: themeIdentity.primary }}>Visit {restaurant.name}</p>
          <h2 className="mt-3 text-4xl font-semibold leading-[1.03] sm:text-6xl">Find the table, the oven, and the people behind the meal.</h2>
          <div className="mt-8 grid gap-5 text-base leading-7">
            <p className="flex gap-4">
              <MapPin size={22} className="mt-1 shrink-0" style={{ color: themeIdentity.primary }} />
              <span>{restaurant.address}<br />{restaurant.postal_code} {restaurant.city}</span>
            </p>
            <p className="flex gap-4">
              <Phone size={22} className="mt-1 shrink-0" style={{ color: themeIdentity.primary }} />
              <span>{restaurant.phone || "Phone coming soon"}</span>
            </p>
            <p className="flex gap-4">
              <Mail size={22} className="mt-1 shrink-0" style={{ color: themeIdentity.primary }} />
              <span>{restaurant.email}</span>
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold">
            {restaurant.google_maps_url && <a href={restaurant.google_maps_url} target="_blank" rel="noreferrer" className="min-h-11 rounded-full border border-[#2d1b13]/15 px-5 py-3 transition hover:bg-[#2d1b13] hover:text-white">Open map</a>}
            {restaurant.instagram_url && <a href={restaurant.instagram_url} target="_blank" rel="noreferrer" className="min-h-11 rounded-full border border-[#2d1b13]/15 px-5 py-3 transition hover:bg-[#2d1b13] hover:text-white">Instagram</a>}
            {restaurant.facebook_url && <a href={restaurant.facebook_url} target="_blank" rel="noreferrer" className="min-h-11 rounded-full border border-[#2d1b13]/15 px-5 py-3 transition hover:bg-[#2d1b13] hover:text-white">Facebook</a>}
            {restaurant.tiktok_url && <a href={restaurant.tiktok_url} target="_blank" rel="noreferrer" className="min-h-11 rounded-full border border-[#2d1b13]/15 px-5 py-3 transition hover:bg-[#2d1b13] hover:text-white">TikTok</a>}
          </div>
        </div>
        <div className="rounded-[2rem] border border-[#2d1b13]/10 bg-[#25170f] p-7 text-white shadow-2xl sm:p-9">
          <p className="luxury-kicker text-xs font-bold text-white/58">Opening hours</p>
          <div className="mt-6 divide-y divide-white/10">
            {Object.entries(hours).map(([day, value]) => (
              <p key={day} className="flex justify-between gap-6 py-3.5">
                <span className="flex items-center gap-3 capitalize text-white/58"><Clock size={16} />{day}</span>
                <span className="font-semibold">{value}</span>
              </p>
            ))}
          </div>
          <p className="mt-6 rounded-2xl border border-white/[.10] bg-white/[.08] p-4 text-sm leading-6 text-white/66">
            For table availability, private dining, or urgent changes, contact the restaurant directly before visiting.
          </p>
        </div>
      </div>
    </section>
  );
}

function ClassicEventsPage({ restaurant, themeIdentity }: { restaurant: Restaurant; themeIdentity: RestaurantThemeIdentity }) {
  const experiences = [
    {
      title: "Private table",
      copy: "An intimate corner for birthdays, anniversaries, and family evenings that deserve a little ceremony.",
    },
    {
      title: "Tasting evening",
      copy: "A slower dinner built around the kitchen's strongest dishes, seasonal ingredients, and thoughtful pacing.",
    },
    {
      title: "Client dinner",
      copy: "A polished hospitality setting for conversations that need privacy, warmth, and reliable service.",
    },
  ];

  return (
    <section className="bg-[#120c08] px-4 py-16 text-white sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[.92fr_1.08fr] lg:items-end">
          <div>
            <p className="luxury-kicker text-xs font-bold" style={{ color: themeIdentity.primary }}>Private dining</p>
            <h2 className="mt-4 text-balance text-4xl font-semibold leading-[1.03] sm:text-6xl">Special tables, private evenings, and hospitality moments.</h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-white/66">
            For birthdays, client dinners, tasting nights, or private requests, contact {restaurant.name} directly. The team can confirm what is possible for the date, room, menu, and service style.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {experiences.map((experience) => (
            <article key={experience.title} className="rounded-[1.75rem] border border-white/10 bg-white/[.06] p-6 shadow-2xl transition hover:-translate-y-1 hover:bg-white/[.09]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/42">Experience</p>
              <h3 className="mt-4 text-2xl font-semibold">{experience.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/62">{experience.copy}</p>
            </article>
          ))}
        </div>
        <a href={`/restaurants/${restaurant.slug}/contact`} className={`luxury-button mt-8 inline-flex min-h-12 items-center rounded-full px-6 py-3 font-semibold text-white`} style={{ backgroundColor: themeIdentity.primary }}>
          Contact the restaurant
        </a>
      </div>
    </section>
  );
}
