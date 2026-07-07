"use client";

import { CalendarDays, Clock, Mail, MapPin, Phone, ShoppingBag, Sparkles, Utensils, type LucideIcon } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from "react";

import ChatWidget from "@/components/ChatWidget";
import GalleryShowcase from "@/components/public/restaurant/GalleryShowcase";
import ImmersiveRestaurantExperience from "@/components/public/restaurant/ImmersiveRestaurantExperience";
import MenuShowcase from "@/components/public/restaurant/MenuShowcase";
import OrderCartDrawer from "@/components/public/restaurant/OrderCartDrawer";
import PremiumHomepage from "@/components/public/restaurant/PremiumHomepage";
import PremiumNavigation, { getRestaurantNavigationLinks } from "@/components/public/restaurant/PremiumNavigation";
import WiseAyoTheme, { isWiseAyoTheme } from "@/components/public/restaurant/WiseAyoTheme";
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
const LEGAL_FOOTER_LINKS = [
  { label: "Impressum", href: "/impressum" },
  { label: "Datenschutz", href: "/datenschutz" },
];

export default function RestaurantSite({ restaurant, page = "home" }: { restaurant: Restaurant; page?: RestaurantSitePage }) {
  if (isWiseAyoTheme(restaurant)) {
    return <WiseAyoTheme restaurant={restaurant} />;
  }

  return <StandardRestaurantSite restaurant={restaurant} page={page} />;
}

function StandardRestaurantSite({ restaurant, page = "home" }: { restaurant: Restaurant; page?: RestaurantSitePage }) {
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
  // TODO: Restore public delivery once fees are configurable per restaurant.
  const publicDeliveryEnabled = false;
  const pickupEnabled = restaurant.pickup_enabled !== false;
  const dineInEnabled = restaurant.dine_in_enabled !== false;
  const chatbotEnabled = restaurant.chatbot_enabled !== false;
  const orderModes = useMemo(
    () =>
      [
        pickupEnabled && "PICKUP",
        dineInEnabled && "EAT_IN",
      ].filter(Boolean) as RestaurantOrder["order_type"][],
    [dineInEnabled, pickupEnabled],
  );
  const immersiveTheme = themeIdentity.homepageStyle === "immersive";
  const footerStyle = immersiveTheme
    ? {
        background:
          "linear-gradient(180deg, rgba(5,3,11,.98), rgba(2,1,8,1))",
        color: themeIdentity.text,
      }
    : { backgroundColor: text, color: background };
  const cartPreviewVisible = cartEnabled && cartCount > 0;
  const showMobileVisitorActions = !cartPreviewVisible;
  const chatBottomOffsetClass = "bottom-[calc(6.75rem+env(safe-area-inset-bottom))] sm:bottom-5";

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
    setOrderStatus("Bestellung wird gesendet...");
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
      setOrderStatus(error instanceof Error ? error.message : "Bestellung konnte nicht gesendet werden.");
    } finally {
      setOrderSubmitting(false);
    }
  }

  async function reserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setReservationStatus("Anfrage wird gesendet...");
    try {
      await request(`/restaurants/${restaurant.slug}/reservations`, {
        method: "POST",
        body: JSON.stringify({
          ...data,
          party_size: data.party_size ? Number(data.party_size) : null,
        }),
      });
      form.reset();
      setReservationStatus("Ihre Reservierungsanfrage ist eingegangen. Das Restaurant bestätigt die Details in Kürze.");
    } catch (error) {
      setReservationStatus(error instanceof Error ? error.message : "Anfrage konnte nicht gesendet werden.");
    }
  }

  return (
    <div
      className={`luxury-shell min-h-screen antialiased ${showMobileVisitorActions ? "pb-24 sm:pb-0" : ""}`}
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
            deliveryEnabled={publicDeliveryEnabled}
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
            deliveryEnabled: publicDeliveryEnabled,
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
        <ClassicPublicFooter restaurant={restaurant} reservationsEnabled={reservationsEnabled} style={footerStyle} />
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
          bottomOffsetClass={chatBottomOffsetClass}
        />
      )}

      <MobileVisitorActionBar
        restaurant={restaurant}
        reservationsEnabled={reservationsEnabled}
        visible={showMobileVisitorActions}
        primaryColor={primary}
      />

      {cartPreviewVisible && (
        <button
          onClick={() => setCartOpen(true)}
          className="luxury-button fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-white/15 px-4 py-3 text-left text-sm font-bold text-white shadow-2xl backdrop-blur sm:left-1/2 sm:right-auto sm:w-[min(560px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:rounded-full sm:px-6 sm:py-4 sm:text-base"
          style={{ backgroundColor: primary }}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15"><ShoppingBag size={19} /></span>
            <span className="min-w-0">
              <span className="block truncate">Bestellung ansehen</span>
              <span className="block text-xs text-white/75">{cartCount} Gericht{cartCount === 1 ? "" : "e"}</span>
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

function buildPhoneHref(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : "";
}

function MobileVisitorActionBar({
  restaurant,
  reservationsEnabled,
  visible,
  primaryColor,
}: {
  restaurant: Restaurant;
  reservationsEnabled: boolean;
  visible: boolean;
  primaryColor: string;
}) {
  if (!visible) return null;

  const basePath = `/restaurants/${restaurant.slug}`;
  const phoneHref = restaurant.phone ? buildPhoneHref(restaurant.phone) : "";
  const actions = [
    { label: "Speisekarte", href: `${basePath}/menu`, icon: Utensils },
    reservationsEnabled
      ? { label: "Tisch", ariaLabel: "Tisch reservieren", href: `${basePath}/reservations`, icon: CalendarDays }
      : { label: "Kontakt", href: `${basePath}/contact`, icon: Mail },
    phoneHref ? { label: "Anrufen", ariaLabel: "Restaurant anrufen", href: phoneHref, icon: Phone } : null,
    restaurant.google_maps_url
      ? { label: "Route", ariaLabel: "Route öffnen", href: restaurant.google_maps_url, icon: MapPin, external: true }
      : { label: "Kontakt", ariaLabel: "Kontakt öffnen", href: `${basePath}/contact`, icon: MapPin },
  ].filter(Boolean) as Array<{
    label: string;
    ariaLabel?: string;
    href: string;
    icon: LucideIcon;
    external?: boolean;
  }>;

  return (
    <nav aria-label="Mobile Schnellaktionen" className="fixed inset-x-3 bottom-[calc(.75rem+env(safe-area-inset-bottom))] z-40 sm:hidden">
      <div className="grid overflow-hidden rounded-[1.4rem] border border-white/55 bg-white/92 text-[#241811] shadow-[0_20px_60px_rgba(0,0,0,.18)] backdrop-blur" style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}>
        {actions.map(({ label, ariaLabel, href, icon: Icon, external }) => (
          <a
            key={`${label}-${href}`}
            href={href}
            aria-label={ariaLabel}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            className="flex min-h-[4.45rem] min-w-0 flex-col items-center justify-center gap-1.5 border-r border-[#241811]/10 px-1 py-2 text-[10px] font-bold last:border-r-0"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full text-white" style={{ backgroundColor: primaryColor }}>
              <Icon size={15} />
            </span>
            <span className="max-w-full truncate">{label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

function buildPublicFooterLinks(restaurant: Restaurant, reservationsEnabled: boolean) {
  const basePath = `/restaurants/${restaurant.slug}`;

  return [
    { label: "Speisekarte", href: `${basePath}/menu` },
    reservationsEnabled
      ? { label: "Tisch reservieren", href: `${basePath}/reservations` }
      : { label: "Kontakt", href: `${basePath}/contact` },
    { label: "Galerie", href: `${basePath}/gallery` },
    { label: "Events", href: `${basePath}/events` },
    ...(reservationsEnabled ? [{ label: "Kontakt", href: `${basePath}/contact` }] : []),
  ];
}

function ClassicPublicFooter({
  restaurant,
  reservationsEnabled,
  style,
}: {
  restaurant: Restaurant;
  reservationsEnabled: boolean;
  style: CSSProperties;
}) {
  const footerLinks = buildPublicFooterLinks(restaurant, reservationsEnabled);
  const location = [restaurant.address, restaurant.city].filter(Boolean).join(", ");
  const closingLine = reservationsEnabled
    ? "Speisekarte, Reservierung, Galerie, Private Dining und Kontakt bleiben für den nächsten Schritt griffbereit."
    : "Speisekarte, Galerie, Private Dining und Kontakt bleiben für den nächsten Schritt griffbereit.";

  return (
    <footer className="px-4 py-12 text-sm sm:px-6" style={style}>
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div className="text-center md:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.24em] opacity-50">Besuch planen</p>
          <p className="mt-3 font-display text-3xl font-semibold">{restaurant.name}</p>
          {location && <p className="mt-3 opacity-70">{location}</p>}
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 opacity-60 md:mx-0">
            {closingLine}
          </p>
        </div>
        <div className="grid gap-4">
          <nav aria-label="Footer restaurant links" className="flex flex-wrap justify-center gap-2 md:justify-end">
            {footerLinks.map((link) => (
              <a key={`${link.label}-${link.href}`} href={link.href} className="min-h-11 rounded-full border border-white/15 bg-white/[.06] px-4 py-2.5 font-semibold transition hover:bg-white/[.12]">
                {link.label}
              </a>
            ))}
          </nav>
          <nav aria-label="Legal links" className="flex flex-wrap justify-center gap-4 text-xs font-semibold opacity-55 md:justify-end">
            {LEGAL_FOOTER_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="underline-offset-4 transition hover:underline">
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
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
        <ClassicPageHero restaurant={restaurant} themeIdentity={themeIdentity} heroVisual={heroVisual} page={page} title="Reservierungen" copy="Fragen Sie einen Tisch mit den Details an, die dem Team die richtige Vorbereitung erleichtern." reservationsEnabled={reservationsEnabled} mobileOpen={mobile} onToggleMobile={toggleMobile} onCloseMobile={closeMobile} />
        <ClassicReservationPage restaurant={restaurant} themeIdentity={themeIdentity} reservationStatus={reservationStatus} onReserve={reserve} enabled={reservationsEnabled} />
      </>
    );
  }

  if (page === "gallery") {
    return (
      <>
        <ClassicPageHero restaurant={restaurant} themeIdentity={themeIdentity} heroVisual={heroVisual} page={page} title="Galerie" copy="Ein visueller Eindruck von Raum, Tellern und Atmosphäre, bevor Sie ankommen." reservationsEnabled={reservationsEnabled} mobileOpen={mobile} onToggleMobile={toggleMobile} onCloseMobile={closeMobile} />
        <GalleryShowcase restaurant={restaurant} themeIdentity={themeIdentity} gallery={gallery} />
      </>
    );
  }

  if (page === "contact") {
    return (
      <>
        <ClassicPageHero restaurant={restaurant} themeIdentity={themeIdentity} heroVisual={heroVisual} page={page} title="Kontakt" copy="Alles Wichtige vor dem Besuch: Adresse, Öffnungszeiten, Telefon, E-Mail, Karte und Social Links." reservationsEnabled={reservationsEnabled} mobileOpen={mobile} onToggleMobile={toggleMobile} onCloseMobile={closeMobile} />
        <ClassicContactPage restaurant={restaurant} themeIdentity={themeIdentity} hours={hours} />
      </>
    );
  }

  if (page === "events") {
    return (
      <>
        <ClassicPageHero restaurant={restaurant} themeIdentity={themeIdentity} heroVisual={heroVisual} page={page} title="Private Dining & Events" copy="Plan a private table, client dinner, celebration, or hospitality moment directly with the restaurant." reservationsEnabled={reservationsEnabled} mobileOpen={mobile} onToggleMobile={toggleMobile} onCloseMobile={closeMobile} />
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
  const actions = classicHeroActions({ page, basePath, reservationsEnabled });

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
          label: reservationsEnabled ? "Tisch reservieren" : "Kontakt",
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
            <a href={actions.primary.href} className="min-h-12 rounded-full border border-white/[.18] bg-white px-6 py-3 text-sm font-bold text-[#21160f] shadow-2xl transition hover:-translate-y-0.5">
              {actions.primary.label}
            </a>
            <a href={actions.secondary.href} className="min-h-12 rounded-full border border-white/[.18] bg-white/[.10] px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[.16]">
              {actions.secondary.label}
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
        <h2 className="text-4xl font-semibold">Online-Reservierungen sind aktuell pausiert.</h2>
        <p className="mt-4 opacity-60">Bitte kontaktieren Sie {restaurant.name} direkt für Tischanfragen.</p>
      </section>
    );
  }
  return (
    <section className="bg-[#f8f1e7] px-4 py-16 text-[#22170f] sm:px-6 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.82fr_1.18fr] lg:items-stretch">
        <div className="rounded-[2rem] border border-[#2d1b13]/10 bg-[#25170f] p-7 text-white shadow-2xl sm:p-9">
          <p className="luxury-kicker text-xs font-bold text-white/58">Ruhiger reservieren</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.02] sm:text-5xl">Share the occasion, then let the restaurant prepare the table.</h2>
          <p className="mt-5 text-base leading-7 text-white/68">
            Share the date, party size, allergies, and occasion. {restaurant.name} can prepare the table with the same care as the kitchen.
          </p>
          <div className="mt-8 grid gap-3 text-sm font-semibold text-white/76">
            <span className="flex items-center gap-3"><CalendarDays size={18} /> Datum, Uhrzeit und Gästezahl</span>
            <span className="flex items-center gap-3"><Sparkles size={18} /> Allergien und besondere Anlässe</span>
            <span className="flex items-center gap-3"><Phone size={18} /> Direkte Bestätigung durch das Restaurant</span>
          </div>
        </div>
        <form id="reserve" onSubmit={onReserve} className="rounded-[2rem] border border-[#2d1b13]/10 bg-white p-6 text-slate-900 shadow-[0_24px_70px_rgba(45,27,19,.12)] sm:p-8">
          <p className="luxury-kicker text-xs font-bold" style={{ color: themeIdentity.primary }}>Reservierungen</p>
          <h3 className="mt-2 text-3xl font-semibold sm:text-5xl">Tisch anfragen</h3>
          <p className="mt-3 text-sm leading-6 text-slate-500">The team confirms every request directly. Share the essentials now, and the restaurant will handle the details with care.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Name
              <input name="name" required placeholder="Vollständiger Name" autoComplete="name" className="min-h-12 rounded-xl border border-slate-200 px-4 py-3 text-base font-normal outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 sm:text-sm" />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              E-Mail
              <input name="email" type="email" required placeholder="you@example.com" autoComplete="email" inputMode="email" className="min-h-12 rounded-xl border border-slate-200 px-4 py-3 text-base font-normal outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 sm:text-sm" />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Telefon
              <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Beste Nummer für die Bestätigung" className="min-h-12 rounded-xl border border-slate-200 px-4 py-3 text-base font-normal outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 sm:text-sm" />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Gäste
              <input name="party_size" type="number" min="1" inputMode="numeric" placeholder="Anzahl der Gäste" className="min-h-12 rounded-xl border border-slate-200 px-4 py-3 text-base font-normal outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 sm:text-sm" />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700 sm:col-span-2">
              Gewünschtes Datum / Uhrzeit
              <input name="requested_at" type="datetime-local" className="min-h-12 rounded-xl border border-slate-200 px-4 py-3 text-base font-normal outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 sm:text-sm" />
              <span className="text-xs font-normal leading-5 text-slate-500">Wählen Sie Ihr bevorzugtes Ankunftsfenster. Das Restaurant bestätigt die Verfügbarkeit direkt.</span>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700 sm:col-span-2">
              Hinweise für das Restaurant
              <textarea name="message" placeholder="Allergien, Anlass, Tischwunsch oder Hinweise" className="min-h-28 rounded-xl border border-slate-200 px-4 py-3 text-base font-normal outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 sm:text-sm" />
            </label>
          </div>
          <button className={`luxury-button mt-4 min-h-12 w-full ${themeIdentity.buttonClass} py-3.5 font-semibold text-white shadow-lg`} style={{ backgroundColor: themeIdentity.primary }}>
            Reservierungsanfrage senden
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
  const phoneHref = restaurant.phone ? `tel:${restaurant.phone.replace(/[^\d+]/g, "")}` : "";
  const emailHref = restaurant.email ? `mailto:${restaurant.email}` : "";

  return (
    <section id="contact-details" className="bg-[#fbf6ee] px-4 py-16 text-[#21160f] sm:px-6 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_.86fr]">
        <div className="rounded-[2rem] border border-[#2d1b13]/10 bg-white p-7 shadow-[0_24px_70px_rgba(45,27,19,.1)] sm:p-9">
          <p className="luxury-kicker text-xs font-bold" style={{ color: themeIdentity.primary }}>Visit {restaurant.name}</p>
          <h2 className="mt-3 text-4xl font-semibold leading-[1.03] sm:text-6xl">Plan your visit with confidence.</h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#6f5144]">
            Use the direct details below for arrival questions, same-day timing, private dining context, or anything the team should know before you arrive.
          </p>
          <div className="mt-8 grid gap-5 text-base leading-7">
            <p className="flex gap-4">
              <MapPin size={22} className="mt-1 shrink-0" style={{ color: themeIdentity.primary }} />
              <span>{restaurant.address}<br />{restaurant.postal_code} {restaurant.city}</span>
            </p>
            <p className="flex gap-4">
              <Phone size={22} className="mt-1 shrink-0" style={{ color: themeIdentity.primary }} />
              <span>
                <span className="block text-xs font-bold uppercase tracking-[0.18em] text-[#6f5144]">Telefon</span>
                {restaurant.phone ? (
                  <a href={phoneHref} className="font-semibold underline decoration-[#2d1b13]/20 underline-offset-4 transition hover:text-[#6f5144]">
                    {restaurant.phone}
                  </a>
                ) : (
                  <span>Telefon bald verfügbar</span>
                )}
              </span>
            </p>
            <p className="flex gap-4">
              <Mail size={22} className="mt-1 shrink-0" style={{ color: themeIdentity.primary }} />
              <span>
                <span className="block text-xs font-bold uppercase tracking-[0.18em] text-[#6f5144]">E-Mail</span>
                {restaurant.email ? (
                  <a href={emailHref} className="font-semibold underline decoration-[#2d1b13]/20 underline-offset-4 transition hover:text-[#6f5144]">
                    {restaurant.email}
                  </a>
                ) : (
                  <span>E-Mail bald verfügbar</span>
                )}
              </span>
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold">
            {restaurant.google_maps_url && <a href={restaurant.google_maps_url} target="_blank" rel="noreferrer" className="min-h-11 rounded-full border border-[#2d1b13]/15 px-5 py-3 transition hover:bg-[#2d1b13] hover:text-white">Karte öffnen</a>}
            {restaurant.instagram_url && <a href={restaurant.instagram_url} target="_blank" rel="noreferrer" className="min-h-11 rounded-full border border-[#2d1b13]/15 px-5 py-3 transition hover:bg-[#2d1b13] hover:text-white">Instagram</a>}
            {restaurant.facebook_url && <a href={restaurant.facebook_url} target="_blank" rel="noreferrer" className="min-h-11 rounded-full border border-[#2d1b13]/15 px-5 py-3 transition hover:bg-[#2d1b13] hover:text-white">Facebook</a>}
            {restaurant.tiktok_url && <a href={restaurant.tiktok_url} target="_blank" rel="noreferrer" className="min-h-11 rounded-full border border-[#2d1b13]/15 px-5 py-3 transition hover:bg-[#2d1b13] hover:text-white">TikTok</a>}
          </div>
        </div>
        <div className="rounded-[2rem] border border-[#2d1b13]/10 bg-[#25170f] p-7 text-white shadow-2xl sm:p-9">
          <p className="luxury-kicker text-xs font-bold text-white/58">Öffnungszeiten</p>
          <div className="mt-6 divide-y divide-white/10">
            {Object.entries(hours).map(([day, value]) => (
              <p key={day} className="flex justify-between gap-6 py-3.5">
                <span className="flex items-center gap-3 capitalize text-white/58"><Clock size={16} />{day}</span>
                <span className="font-semibold">{value}</span>
              </p>
            ))}
          </div>
          <p className="mt-6 rounded-2xl border border-white/[.10] bg-white/[.08] p-4 text-sm leading-6 text-white/66">
            For table availability, private dining, accessibility notes, or urgent changes, reach the restaurant directly before visiting.
          </p>
        </div>
      </div>
    </section>
  );
}

function ClassicEventsPage({ restaurant, themeIdentity }: { restaurant: Restaurant; themeIdentity: RestaurantThemeIdentity }) {
  const basePath = `/restaurants/${restaurant.slug}`;
  const reservationsEnabled = restaurant.reservations_enabled !== false;
  const experiences = [
    {
      title: "Private table",
      copy: "A composed table for birthdays, anniversaries, family dinners, or evenings that need a little more care.",
    },
    {
      title: "Hosted evening",
      copy: "A slower dining moment shaped around timing, room feel, menu direction, and the pace guests expect.",
    },
    {
      title: "Client dinner",
      copy: "A polished hospitality setting for conversations that need privacy, warmth, and reliable coordination.",
    },
  ];
  const planningDetails = [
    {
      icon: CalendarDays,
      title: "Date, party size, and timing",
      copy: "Share the preferred date, approximate guest count, and whether the evening should feel quick, relaxed, or celebratory.",
    },
    {
      icon: Sparkles,
      title: "Menu direction",
      copy: "Point the team toward dietary needs, favorite dishes, drinks, pacing, and the kind of welcome guests should feel.",
    },
    {
      icon: Phone,
      title: "Direct coordination",
      copy: "The restaurant confirms availability, details, and next steps directly, without pretending this is an automated events calendar.",
    },
  ];
  const actions = [
    { label: "Anfrage starten", href: `${basePath}/contact`, primary: true },
    reservationsEnabled ? { label: "Tisch anfragen", href: `${basePath}/reservations`, primary: false } : null,
    { label: "Speisekarte ansehen", href: `${basePath}/menu`, primary: false },
  ].filter(Boolean) as Array<{ label: string; href: string; primary: boolean }>;

  return (
    <section id="events-details" className="bg-[#120c08] px-4 py-16 text-white sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[.92fr_1.08fr] lg:items-stretch">
          <div>
            <p className="luxury-kicker text-xs font-bold" style={{ color: themeIdentity.primary }}>Private dining</p>
            <h2 className="mt-4 text-balance text-4xl font-semibold leading-[1.03] sm:text-6xl">Private dining that starts with a clear conversation.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/66">
              For celebrations, client dinners, hosted evenings, or private requests, {restaurant.name} can help shape the date, room, menu, and service style before guests arrive.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {actions.map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${
                    action.primary
                      ? "text-white shadow-lg"
                      : "border border-white/15 bg-white/[.08] text-white backdrop-blur hover:bg-white/[.12]"
                  }`}
                  style={action.primary ? { backgroundColor: themeIdentity.primary } : undefined}
                >
                  {action.label}
                </a>
              ))}
            </div>
          </div>
          <aside className="rounded-[2rem] border border-white/10 bg-white/[.06] p-6 shadow-2xl backdrop-blur sm:p-8">
            <p className="luxury-kicker text-xs font-bold text-white/45">Inquiry guide</p>
            <h3 className="mt-3 text-3xl font-semibold leading-tight">Share what matters before the team replies.</h3>
            <div className="mt-6 grid gap-3">
              {planningDetails.map((detail) => (
                <EventPlanningDetail key={detail.title} {...detail} color={themeIdentity.primary} />
              ))}
            </div>
          </aside>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {experiences.map((experience) => (
            <article key={experience.title} className="rounded-[1.75rem] border border-white/10 bg-white/[.06] p-6 shadow-2xl transition hover:-translate-y-1 hover:bg-white/[.09]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/42">Inquiry type</p>
              <h3 className="mt-4 text-2xl font-semibold">{experience.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/62">{experience.copy}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-black/20 p-6 text-sm leading-7 text-white/62 sm:p-7">
          <p className="font-semibold text-white">No fake calendar, no generic packages.</p>
          <p className="mt-2">
            This page is a premium inquiry path: guests can review the menu, request a standard table, or contact the restaurant with the context needed for a private dining reply.
          </p>
        </div>
      </div>
    </section>
  );
}

function EventPlanningDetail({
  icon: Icon,
  title,
  copy,
  color,
}: {
  icon: LucideIcon;
  title: string;
  copy: string;
  color: string;
}) {
  return (
    <p className="grid grid-cols-[auto_1fr] gap-4 rounded-[1.25rem] border border-white/10 bg-black/[.18] p-4">
      <Icon size={19} className="mt-0.5" style={{ color }} />
      <span>
        <b className="block text-white">{title}</b>
        <span className="mt-1 block leading-6 text-white/58">{copy}</span>
      </span>
    </p>
  );
}

function classicHeroActions({
  page,
  basePath,
  reservationsEnabled,
}: {
  page: RestaurantSitePage;
  basePath: string;
  reservationsEnabled: boolean;
}) {
  const reservationAction = reservationsEnabled
    ? { label: "Tisch anfragen", href: `${basePath}/reservations` }
    : { label: "Restaurant kontaktieren", href: `${basePath}/contact` };

  if (page === "reservations") {
    return {
      primary: { label: reservationsEnabled ? "Reservierungsanfrage starten" : "Restaurant kontaktieren", href: reservationsEnabled ? "#reserve" : `${basePath}/contact` },
      secondary: { label: "Zuerst Speisekarte ansehen", href: `${basePath}/menu` },
    };
  }

  if (page === "gallery") {
    return {
      primary: { label: "Galerie ansehen", href: "#gallery" },
      secondary: reservationsEnabled
        ? { label: "Nach dem Stöbern reservieren", href: `${basePath}/reservations` }
        : { label: "Nach dem Stöbern Kontakt aufnehmen", href: `${basePath}/contact` },
    };
  }

  if (page === "contact") {
    return {
      primary: { label: "Kontaktdaten ansehen", href: "#contact-details" },
      secondary: reservationAction,
    };
  }

  if (page === "events") {
    return {
      primary: { label: "Event anfragen", href: "#events-details" },
      secondary: { label: "Restaurant kontaktieren", href: `${basePath}/contact` },
    };
  }

  return {
    primary: { label: "Speisekarte ansehen", href: `${basePath}/menu` },
    secondary: reservationAction,
  };
}
