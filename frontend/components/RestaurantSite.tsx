"use client";

import { ShoppingBag } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import ChatWidget from "@/components/ChatWidget";
import GalleryShowcase from "@/components/public/restaurant/GalleryShowcase";
import ImmersiveRestaurantExperience from "@/components/public/restaurant/ImmersiveRestaurantExperience";
import MenuShowcase from "@/components/public/restaurant/MenuShowcase";
import OrderCartDrawer from "@/components/public/restaurant/OrderCartDrawer";
import RestaurantHero from "@/components/public/restaurant/RestaurantHero";
import TrustAndStory from "@/components/public/restaurant/TrustAndStory";
import request from "@/lib/api";
import { clearCart, loadCart, saveCart, type StoredCart } from "@/lib/cartStorage";
import { buildRestaurantJsonLd } from "@/lib/restaurantSeo";
import { resolveRestaurantTheme, type RestaurantThemeIdentity } from "@/lib/restaurantTheme";
import type { MenuItem, Restaurant, RestaurantImage, RestaurantOrder } from "@/lib/types";
import {
  buildDietaryPrompts,
  buildStoryMoments,
  formatPrice,
  parseOpeningHours,
  type StoryMoment,
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
  const heroGallery = gallery.slice(0, 3);
  const menuItems = useMemo(
    () => restaurant.categories.flatMap((category) => category.items),
    [restaurant.categories],
  );
  const availableItems = menuItems.filter((item) => item.is_available).length;
  const featuredItems = menuItems.filter((item) => item.is_available).slice(0, 4);
  const heroVisual = restaurant.hero_image || gallery[0]?.url || "";
  const storyMoments = buildStoryMoments(restaurant, featuredItems, themeIdentity.personality);
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
    setCartHydrated(false);
    setCart(loadCart(cartScope, menuItems));
    setCartHydrated(true);
  }, [cartScope, menuItems]);

  useEffect(() => {
    if (!cartHydrated) return;
    saveCart(cartScope, cart);
  }, [cart, cartHydrated, cartScope]);

  function changeCart(item: MenuItem, change: number) {
    if (!orderingEnabled) return;
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
            heroGallery,
            availableItems,
            reservationsEnabled,
            orderingEnabled,
            deliveryEnabled,
            pickupEnabled,
            dineInEnabled,
            mobile,
            toggleMobile: () => setMobile((current) => !current),
            closeMobile: () => setMobile(false),
            storyMoments,
            menuItems,
            featuredItems,
            quantities,
            gallery,
            hours,
            reservationStatus,
            reserve,
            add: (item) => changeCart(item, 1),
          })
        )}
      </main>

      {!immersiveTheme && (
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
          bottomOffsetClass={cartCount > 0 ? "bottom-[calc(6.75rem+env(safe-area-inset-bottom))] sm:bottom-5" : "bottom-[calc(1.25rem+env(safe-area-inset-bottom))]"}
        />
      )}

      {orderingEnabled && cartCount > 0 && (
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
  heroGallery,
  availableItems,
  reservationsEnabled,
  orderingEnabled,
  deliveryEnabled,
  pickupEnabled,
  dineInEnabled,
  mobile,
  toggleMobile,
  closeMobile,
  storyMoments,
  menuItems,
  featuredItems,
  quantities,
  gallery,
  hours,
  reservationStatus,
  reserve,
  add,
}: {
  page: RestaurantSitePage;
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  heroVisual: string;
  heroGallery: RestaurantImage[];
  availableItems: number;
  reservationsEnabled: boolean;
  orderingEnabled: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  dineInEnabled: boolean;
  mobile: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
  storyMoments: StoryMoment[];
  menuItems: MenuItem[];
  featuredItems: MenuItem[];
  quantities: Record<number, number>;
  gallery: RestaurantImage[];
  hours: Record<string, string>;
  reservationStatus: string;
  reserve: (event: FormEvent<HTMLFormElement>) => void;
  add: (item: MenuItem) => void;
}) {
  if (page === "menu") {
    return (
      <>
        <ClassicPageHero restaurant={restaurant} themeIdentity={themeIdentity} title="Menu" copy="Explore tonight's dishes, dietary notes, and ordering options." />
        <MenuShowcase
          restaurant={restaurant}
          themeIdentity={themeIdentity}
          menuItems={menuItems}
          featuredItems={featuredItems}
          quantities={quantities}
          orderingEnabled={orderingEnabled}
          onAdd={add}
        />
      </>
    );
  }

  if (page === "reservations") {
    return (
      <>
        <ClassicPageHero restaurant={restaurant} themeIdentity={themeIdentity} title="Reservations" copy="Request a table and give the team the details they need to prepare well." />
        <ClassicReservationPage restaurant={restaurant} themeIdentity={themeIdentity} reservationStatus={reservationStatus} onReserve={reserve} enabled={reservationsEnabled} />
      </>
    );
  }

  if (page === "gallery") {
    return (
      <>
        <ClassicPageHero restaurant={restaurant} themeIdentity={themeIdentity} title="Gallery" copy="Food, room, service, and atmosphere before you arrive." />
        <GalleryShowcase restaurant={restaurant} themeIdentity={themeIdentity} gallery={gallery} />
      </>
    );
  }

  if (page === "contact") {
    return (
      <>
        <ClassicPageHero restaurant={restaurant} themeIdentity={themeIdentity} title="Contact" copy="Address, hours, phone, email, map, and social links." />
        <ClassicContactPage restaurant={restaurant} themeIdentity={themeIdentity} hours={hours} />
      </>
    );
  }

  if (page === "events") {
    return (
      <>
        <ClassicPageHero restaurant={restaurant} themeIdentity={themeIdentity} title="Private Dining & Events" copy="Plan a special table, private dinner, or hospitality moment directly with the restaurant." />
        <ClassicEventsPage restaurant={restaurant} themeIdentity={themeIdentity} />
      </>
    );
  }

  return (
    <>
      <RestaurantHero
        restaurant={restaurant}
        themeIdentity={themeIdentity}
        heroVisual={heroVisual}
        heroGallery={heroGallery}
        availableItems={availableItems}
        reservationsEnabled={reservationsEnabled}
        orderingEnabled={orderingEnabled}
        deliveryEnabled={deliveryEnabled}
        pickupEnabled={pickupEnabled}
        dineInEnabled={dineInEnabled}
        mobileOpen={mobile}
        onToggleMobile={toggleMobile}
        onCloseMobile={closeMobile}
      />
      <TrustAndStory
        restaurant={restaurant}
        themeIdentity={themeIdentity}
        storyMoments={storyMoments}
      />
      <ClassicRouteTeasers restaurant={restaurant} themeIdentity={themeIdentity} reservationsEnabled={reservationsEnabled} orderingEnabled={orderingEnabled} gallery={gallery} />
    </>
  );
}

function ClassicPageHero({
  restaurant,
  themeIdentity,
  title,
  copy,
}: {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  title: string;
  copy: string;
}) {
  return (
    <section className="relative overflow-hidden px-4 py-24 text-white sm:px-6 lg:py-32" style={{ background: themeIdentity.heroFallback }}>
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <a href={`/restaurants/${restaurant.slug}`} className="text-xs font-bold uppercase tracking-[0.24em] text-white/58">{restaurant.name}</a>
        <h1 className="mt-5 text-5xl font-semibold leading-tight sm:text-7xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">{copy}</p>
      </div>
    </section>
  );
}

function ClassicRouteTeasers({
  restaurant,
  themeIdentity,
  reservationsEnabled,
  orderingEnabled,
  gallery,
}: {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  reservationsEnabled: boolean;
  orderingEnabled: boolean;
  gallery: RestaurantImage[];
}) {
  const cards = [
    orderingEnabled && ["Menu", "Browse dishes and order directly.", `/restaurants/${restaurant.slug}/menu`],
    reservationsEnabled && ["Reservations", "Request a table with occasion and allergy notes.", `/restaurants/${restaurant.slug}/reservations`],
    gallery.length > 0 && ["Gallery", "See the room, food, and atmosphere.", `/restaurants/${restaurant.slug}/gallery`],
    ["Contact", "Find hours, address, phone, and map.", `/restaurants/${restaurant.slug}/contact`],
  ].filter(Boolean) as string[][];
  return (
    <section className="px-4 pb-20 sm:px-6 lg:pb-28">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
        {cards.map(([title, copy, href]) => (
          <a key={title} href={href} className="premium-lift rounded-[1.75rem] border border-black/10 bg-white/75 p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[.24em]" style={{ color: themeIdentity.primary }}>{title}</p>
            <p className="mt-4 text-lg leading-7 opacity-70">{copy}</p>
          </a>
        ))}
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
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
      <form id="reserve" onSubmit={onReserve} className="premium-card rounded-[2rem] p-6 text-slate-900 sm:p-8">
        <p className="luxury-kicker text-xs font-bold" style={{ color: themeIdentity.primary }}>Reservations</p>
        <h2 className="mt-2 text-3xl font-semibold sm:text-5xl">Request a table</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">Share party size, timing, allergies, and occasion details. The restaurant confirms every request directly.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <input name="name" required placeholder="Your name" autoComplete="name" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:text-sm" />
          <input name="email" type="email" required placeholder="Email" autoComplete="email" inputMode="email" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:text-sm" />
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Phone" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:text-sm" />
          <input name="party_size" type="number" min="1" inputMode="numeric" placeholder="Guests" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:text-sm" />
          <input name="requested_at" type="datetime-local" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:col-span-2 sm:text-sm" />
          <textarea name="message" placeholder="Allergies, occasion, preferred table, or notes" className="min-h-28 rounded-xl border px-4 py-3 text-base sm:col-span-2 sm:text-sm" />
        </div>
        <button className={`luxury-button mt-4 min-h-12 w-full ${themeIdentity.buttonClass} py-3.5 font-semibold text-white shadow-lg`} style={{ backgroundColor: themeIdentity.primary }}>
          Send reservation request
        </button>
        {reservationStatus && <p className="mt-3 rounded-xl border border-green-100 bg-green-50 p-3 text-center text-sm font-semibold text-green-800">{reservationStatus}</p>}
      </form>
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
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:py-28">
      <div className="space-y-5 text-lg leading-8">
        <p>{restaurant.address}<br />{restaurant.postal_code} {restaurant.city}</p>
        <p>{restaurant.phone || "Phone coming soon"}<br />{restaurant.email}</p>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          {restaurant.google_maps_url && <a href={restaurant.google_maps_url} target="_blank" className="min-h-11 rounded-full border px-4 py-3">Open map</a>}
          {restaurant.instagram_url && <a href={restaurant.instagram_url} target="_blank" className="min-h-11 rounded-full border px-4 py-3">Instagram</a>}
          {restaurant.facebook_url && <a href={restaurant.facebook_url} target="_blank" className="min-h-11 rounded-full border px-4 py-3">Facebook</a>}
          {restaurant.tiktok_url && <a href={restaurant.tiktok_url} target="_blank" className="min-h-11 rounded-full border px-4 py-3">TikTok</a>}
        </div>
      </div>
      <div className="premium-card rounded-[2rem] p-6 sm:p-8">
        <p className="luxury-kicker text-xs font-bold" style={{ color: themeIdentity.primary }}>Opening hours</p>
        <div className="mt-5 divide-y divide-black/10">
          {Object.entries(hours).map(([day, value]) => (
            <p key={day} className="flex justify-between gap-6 py-3">
              <span className="capitalize opacity-60">{day}</span>
              <span className="font-semibold">{value}</span>
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClassicEventsPage({ restaurant, themeIdentity }: { restaurant: Restaurant; themeIdentity: RestaurantThemeIdentity }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:py-28">
      <div>
        <p className="luxury-kicker text-xs font-bold" style={{ color: themeIdentity.primary }}>Private dining</p>
        <h2 className="mt-4 text-4xl font-semibold sm:text-6xl">Special tables, private evenings, and hospitality moments.</h2>
      </div>
      <div className="premium-card rounded-[2rem] p-6 sm:p-8">
        <p className="text-lg leading-8 opacity-75">
          For birthdays, client dinners, tasting nights, or private requests, contact {restaurant.name} directly. The team can confirm what is possible for the date, room, menu, and service style.
        </p>
        <a href={`/restaurants/${restaurant.slug}/contact`} className={`luxury-button mt-6 inline-flex min-h-12 items-center rounded-full px-6 py-3 font-semibold text-white`} style={{ backgroundColor: themeIdentity.primary }}>
          Contact the restaurant
        </a>
      </div>
    </section>
  );
}
