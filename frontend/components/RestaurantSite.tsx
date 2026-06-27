"use client";

import { ShoppingBag } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import ChatWidget from "@/components/ChatWidget";
import GalleryShowcase from "@/components/public/restaurant/GalleryShowcase";
import MenuShowcase from "@/components/public/restaurant/MenuShowcase";
import OrderCartDrawer from "@/components/public/restaurant/OrderCartDrawer";
import ReservationPanel from "@/components/public/restaurant/ReservationPanel";
import RestaurantHero from "@/components/public/restaurant/RestaurantHero";
import TrustAndStory from "@/components/public/restaurant/TrustAndStory";
import request from "@/lib/api";
import { clearCart, loadCart, saveCart, type StoredCart } from "@/lib/cartStorage";
import { buildRestaurantJsonLd } from "@/lib/restaurantSeo";
import { resolveRestaurantTheme } from "@/lib/restaurantTheme";
import type { MenuItem, Restaurant, RestaurantOrder } from "@/lib/types";
import {
  buildDietaryPrompts,
  buildStoryMoments,
  formatPrice,
  parseOpeningHours,
} from "./public/restaurant/experience";

type CartLine = StoredCart[number];

export default function RestaurantSite({ restaurant }: { restaurant: Restaurant }) {
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
          onToggleMobile={() => setMobile((current) => !current)}
          onCloseMobile={() => setMobile(false)}
        />
        <TrustAndStory
          restaurant={restaurant}
          themeIdentity={themeIdentity}
          storyMoments={storyMoments}
        />
        <MenuShowcase
          restaurant={restaurant}
          themeIdentity={themeIdentity}
          menuItems={menuItems}
          featuredItems={featuredItems}
          quantities={quantities}
          orderingEnabled={orderingEnabled}
          onAdd={(item) => changeCart(item, 1)}
        />
        <GalleryShowcase restaurant={restaurant} themeIdentity={themeIdentity} gallery={gallery} />
        {reservationsEnabled && (
          <ReservationPanel
            restaurant={restaurant}
            themeIdentity={themeIdentity}
            hours={hours}
            reservationStatus={reservationStatus}
            onReserve={reserve}
          />
        )}
      </main>

      <footer className="px-6 py-12 text-center text-sm" style={{ backgroundColor: text, color: background }}>
        <p className="font-display text-3xl font-semibold">{restaurant.name}</p>
        <p className="mt-3 opacity-70">{restaurant.address}, {restaurant.city}</p>
        <p className="mt-6 text-xs uppercase tracking-[0.24em] opacity-50">{footerServices}.</p>
      </footer>

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
