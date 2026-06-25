"use client";

import {
  Award,
  Check,
  ChefHat,
  Clock3,
  Flame,
  Heart,
  Instagram,
  Leaf,
  type LucideIcon,
  MapPin,
  Menu as MenuIcon,
  Minus,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Wine,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import request from "@/lib/api";
import type { MenuItem, Restaurant, RestaurantOrder } from "@/lib/types";
import ChatWidget from "./ChatWidget";

type CartLine = { item: MenuItem; quantity: number };

export default function RestaurantSite({ restaurant }: { restaurant: Restaurant }) {
  const [mobile, setMobile] = useState(false);
  const [reservationStatus, setReservationStatus] = useState("");
  const [cart, setCart] = useState<Record<number, CartLine>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<"PICKUP" | "EAT_IN" | "DELIVERY">("PICKUP");
  const [orderStatus, setOrderStatus] = useState("");
  const [completedOrder, setCompletedOrder] = useState<RestaurantOrder | null>(null);
  const [menuQuery, setMenuQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<"all" | "vegan" | "vegetarian" | "halal">("all");

  const theme = restaurant.theme;
  const primary = restaurant.primary_color || theme?.primary_color || "#c84b31";
  const secondary = restaurant.secondary_color || theme?.secondary_color || "#6b7048";
  const background = restaurant.background_color || theme?.background_color || "#f7f3ea";
  const text = restaurant.text_color || theme?.text_color || "#1b1b18";
  const template = theme?.key || "mediterranean";
  const font = restaurant.font_family || theme?.font_family || "Cormorant Garamond";
  const buttonClass =
    restaurant.button_style === "square"
      ? ""
      : restaurant.button_style === "soft"
        ? "rounded-xl"
        : "rounded-full";

  const hours = useMemo(() => {
    try {
      return JSON.parse(restaurant.opening_hours) as Record<string, string>;
    } catch {
      return { hours: restaurant.opening_hours };
    }
  }, [restaurant.opening_hours]);

  const gallery = restaurant.images.filter((image) => ["gallery", "food"].includes(image.image_type));
  const heroGallery = gallery.slice(0, 3);
  const menuItems = restaurant.categories.flatMap((category) => category.items);
  const availableItems = menuItems.filter((item) => item.is_available).length;
  const featuredItems = menuItems.filter((item) => item.is_available).slice(0, 4);
  const heroVisual = restaurant.hero_image || gallery[0]?.url || "";
  const personality = restaurantPersonality(template);
  const storyMoments = buildStoryMoments(restaurant, featuredItems, personality);
  const dietaryPrompts = buildDietaryPrompts(menuItems);
  const filteredCategories = restaurant.categories.map((category) => ({
    ...category,
    items: category.items.filter((item) => matchesMenuFilters(item, menuQuery, dietaryFilter)),
  }));
  const visibleMenuItems = filteredCategories.reduce((total, category) => total + category.items.length, 0);
  const cartLines = Object.values(cart);
  const cartCount = cartLines.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cartLines.reduce((total, line) => total + Number(line.item.price) * line.quantity, 0);
  const completedEstimate = completedOrder ? estimateText(completedOrder) : "";

  function changeCart(item: MenuItem, change: number) {
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

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setOrderStatus("Sending your order...");
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
      setOrderStatus("");
    } catch (error) {
      setOrderStatus(error instanceof Error ? error.message : "Could not place order.");
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

  const darkHero = template === "elegant" || template === "japanese";

  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: background, color: text, fontFamily: font }}>
      <header className={`absolute inset-x-0 top-0 z-30 ${darkHero ? "text-white" : "text-white"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <a href="#top" className="flex min-w-0 items-center gap-3 text-lg font-bold sm:text-xl">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt="" className="h-11 w-11 rounded-full border border-white/30 object-cover shadow-lg" />
            ) : (
              <span className="grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-white/15">
                <ChefHat size={21} />
              </span>
            )}
            <span className="truncate">{restaurant.name}</span>
          </a>
          <nav className="hidden items-center gap-7 rounded-full border border-white/15 bg-black/25 px-5 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl md:flex">
            <a href="#story">Story</a>
            <a href="#menu">Menu</a>
            <a href="#gallery">Gallery</a>
            <a href="#contact">Contact</a>
            <a href="#reserve" className={`${buttonClass} px-5 py-2.5 text-white shadow-lg`} style={{ backgroundColor: primary }}>
              Reserve
            </a>
          </nav>
          <button
            className="rounded-full border border-white/25 bg-black/20 p-2 backdrop-blur md:hidden"
            onClick={() => setMobile(!mobile)}
            aria-label="Toggle menu"
          >
            {mobile ? <X /> : <MenuIcon />}
          </button>
        </div>
        {mobile && (
          <nav className="mx-4 flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/90 p-6 text-white shadow-2xl backdrop-blur md:hidden">
            <a href="#story">Story</a>
            <a href="#menu">Menu</a>
            <a href="#gallery">Gallery</a>
            <a href="#contact">Contact</a>
            <a href="#reserve">Reserve</a>
          </nav>
        )}
      </header>

      <main id="top">
        <section
          className={`relative flex min-h-[94vh] items-end overflow-hidden bg-cover bg-center ${template === "japanese" ? "grayscale" : ""}`}
          style={{
            backgroundImage: heroVisual
              ? `linear-gradient(90deg, rgba(10,8,5,.88), rgba(10,8,5,.5) 48%, rgba(10,8,5,.16)), url(${heroVisual})`
              : "linear-gradient(135deg, #15120f, #3b251f 48%, #15120f)",
          }}
        >
          <div className="absolute inset-0 slow-drift bg-[radial-gradient(circle_at_75%_18%,rgba(255,255,255,.16),transparent_18rem)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-4 pb-12 pt-40 text-white sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:items-end lg:pb-16">
            <div className="fade-up">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[.28em] backdrop-blur" style={{ color: "#fff" }}>
                <Sparkles size={14} /> {restaurant.city || "A table is waiting"}
              </p>
              <h1 className={`mt-6 max-w-5xl font-semibold leading-[.92] ${template === "fast-food" ? "text-5xl uppercase sm:text-7xl lg:text-8xl" : "text-5xl sm:text-7xl lg:text-8xl"}`}>
                {restaurant.tagline || restaurant.name}
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/85 sm:text-lg">{restaurant.description}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#menu" className={`${buttonClass} px-7 py-4 font-semibold text-white shadow-2xl`} style={{ backgroundColor: primary }}>
                  Explore menu
                </a>
                <a href="#reserve" className={`${buttonClass} border border-white/40 bg-white/10 px-7 py-4 font-semibold backdrop-blur`}>
                  Book a table
                </a>
              </div>
              <div className="mt-8 grid max-w-xl grid-cols-3 divide-x divide-white/15 rounded-2xl border border-white/15 bg-black/20 text-center text-sm backdrop-blur">
                <div className="p-4"><b className="block text-2xl">{restaurant.categories.length}</b><span className="text-white/65">Courses</span></div>
                <div className="p-4"><b className="block text-2xl">{availableItems}</b><span className="text-white/65">Dishes</span></div>
                <div className="p-4"><b className="block text-2xl">AI</b><span className="text-white/65">Maître d'</span></div>
              </div>
            </div>
            <div className="art-frame hidden rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl lg:block">
              <div className="grid grid-cols-3 gap-3">
                {heroGallery.length > 0 ? (
                  heroGallery.map((image, index) => (
                    <img
                      key={image.id}
                      src={image.url}
                      alt={image.alt_text || restaurant.name}
                      className={`${index === 0 ? "col-span-2 h-56" : "h-40"} w-full rounded-2xl object-cover`}
                    />
                  ))
                ) : (
                  <div className="col-span-3 rounded-2xl border border-white/10 bg-white/10 p-8 text-sm text-white/75">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">At the table</p>
                    <p className="mt-3 text-lg font-semibold">An intimate preview of the dining room will appear here.</p>
                  </div>
                )}
              </div>
              <div className="mt-4 rounded-2xl bg-black/25 p-5">
                    <p className="flex items-center gap-2 text-sm font-semibold"><Award size={17} /> Chef's selection, direct ordering, and table requests in one calm flow.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-black/10 bg-white/85 shadow-sm backdrop-blur">
          <div className="mx-auto grid max-w-7xl divide-y px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="flex gap-3 py-6 md:pr-6"><MapPin style={{ color: primary }} /><span>{restaurant.address}, {restaurant.city}</span></div>
            <div className="flex gap-3 py-6 md:px-6"><Phone style={{ color: primary }} /><span>{restaurant.phone || "Phone coming soon"}</span></div>
            <div className="flex gap-3 py-6 md:pl-6"><Clock3 style={{ color: primary }} /><span>Open hours and reservations below</span></div>
          </div>
        </section>

        <section id="story" className="sensory-section mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:py-28">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.3em]" style={{ color: primary }}>Our story</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">{restaurant.name}, made personal.</h2>
            <p className="mt-6 max-w-md text-base leading-8 opacity-65">{personality.description}</p>
          </div>
          <div className="premium-card rounded-[2rem] p-6 sm:p-8">
            <p className="whitespace-pre-line text-lg leading-8 opacity-75">{restaurant.story || restaurant.description}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StorySignal icon={ChefHat} label="Kitchen" value="Made fresh" />
              <StorySignal icon={ShieldCheck} label="Allergies" value="Ask before ordering" />
              <StorySignal icon={Heart} label="Hospitality" value="Direct to restaurant" />
            </div>
          </div>
        </section>

        <section className="sensory-section px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
              <div className="ambient-glow overflow-hidden rounded-[2rem] border border-black/10 bg-[#171511] p-6 text-white shadow-2xl sm:p-8 lg:p-10">
                <p className="text-xs font-bold uppercase tracking-[.3em] text-white/45">Tonight's experience</p>
                <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-6xl">{personality.momentTitle}</h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/70">{personality.momentCopy}</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {storyMoments.slice(0, 3).map((moment) => (
                    <div key={moment.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <moment.icon size={18} className="text-white/70" />
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">{moment.label}</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-white/90">{moment.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-5">
                {storyMoments.slice(3).map((moment) => (
                  <article key={moment.label} className="premium-lift rounded-[1.75rem] border border-black/10 bg-white/80 p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="rounded-2xl bg-black/[.04] p-3" style={{ color: primary }}><moment.icon size={20} /></span>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] opacity-45">{moment.label}</p>
                    </div>
                    <p className="mt-4 text-2xl font-semibold leading-tight">{moment.value}</p>
                    <p className="mt-3 text-sm leading-6 opacity-60">{moment.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="menu" className="sensory-section bg-white/70 px-4 py-16 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[.3em]" style={{ color: primary }}>Fresh from the kitchen</p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">Menu and online ordering</h2>
              <p className="mt-4 leading-7 opacity-65">Browse dishes like small experiences: chef notes, dietary cues, pairing prompts, and direct ordering without leaving the restaurant's world.</p>
            </div>
            {restaurant.categories.length === 0 || menuItems.length === 0 ? (
              <div className="mt-12 rounded-3xl border border-dashed bg-white p-10 text-center shadow-sm">
                <ChefHat className="mx-auto opacity-35" size={42} />
                <h3 className="mt-4 text-2xl font-semibold">Menu coming soon</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 opacity-60">The restaurant is still preparing its online menu. Ask the AI Maître d' or request a table for help.</p>
              </div>
            ) : (
              <>
                <div className="sticky top-0 z-20 -mx-4 mt-10 border-y border-black/10 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:top-2 sm:mx-0 sm:rounded-[1.5rem] sm:border">
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                    <label className="relative block">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-45" size={18} />
                      <input
                        value={menuQuery}
                        onChange={(event) => setMenuQuery(event.target.value)}
                        className="w-full rounded-full border border-black/10 bg-white py-3 pl-11 pr-4 text-sm shadow-sm"
                        placeholder="Search dishes, ingredients, allergens..."
                      />
                    </label>
                    <div className="flex gap-2 overflow-x-auto">
                      {(["all", "vegan", "vegetarian", "halal"] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setDietaryFilter(filter)}
                          className={`shrink-0 rounded-full border px-4 py-3 text-xs font-bold uppercase tracking-wider ${dietaryFilter === filter ? "text-white" : "bg-white"}`}
                          style={dietaryFilter === filter ? { backgroundColor: primary, borderColor: primary } : undefined}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:justify-center">
                    {restaurant.categories.map((category) => (
                      <a
                        key={category.id}
                        href={`#category-${category.id}`}
                        className="shrink-0 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold shadow-sm"
                      >
                        {category.name}
                      </a>
                    ))}
                  </div>
                  {(menuQuery || dietaryFilter !== "all") && <p className="mt-3 text-center text-xs font-semibold opacity-60">{visibleMenuItems} dishes match your selection</p>}
                </div>

                {featuredItems.length > 0 && (
                  <div className="ambient-glow mt-10 rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[.22em]" style={{ color: primary }}>Signature dishes</p>
                        <h3 className="mt-1 text-2xl font-semibold">A few plates to begin with.</h3>
                        <p className="mt-1 text-sm opacity-55">Ask the AI Maître d' for a pairing or a full meal built around these dishes.</p>
                      </div>
                      <Sparkles className="hidden opacity-40 sm:block" />
                    </div>
                    <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                      {featuredItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => changeCart(item, 1)}
                          className="premium-lift w-56 shrink-0 overflow-hidden rounded-2xl border bg-white text-left shadow-sm"
                        >
                          {item.image_url ? <img src={item.image_url} alt={item.name} className="h-28 w-full object-cover" /> : <FoodFallback name={item.name} compact />}
                          <span className="block p-3">
                            <span className="block truncate font-semibold">{item.name}</span>
                            <span className="mt-1 flex items-center justify-between text-sm opacity-65">
                              <span>EUR {Number(item.price).toFixed(2)}</span>
                              <Plus size={16} style={{ color: primary }} />
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-12 space-y-14">
                  {filteredCategories.map((category) => (
                    <section id={`category-${category.id}`} key={category.id} className="scroll-mt-24">
                      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/15 pb-5">
                        <div>
                          <h3 className="text-3xl font-semibold">{category.name}</h3>
                          <p className="mt-1 opacity-60">{category.description || "Prepared fresh by the kitchen."}</p>
                        </div>
                        <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                          {category.items.filter((item) => item.is_available).length} available
                        </span>
                      </div>
                      {category.items.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-dashed bg-white p-8 text-center text-sm opacity-60">No dishes match the current search or filter.</div>
                      ) : (
                        <div className={`mt-6 grid gap-4 ${restaurant.menu_style === "cards" || theme?.menu_style === "cards" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                          {category.items.map((item, index) => (
                            <MenuItemCard
                              key={item.id}
                              item={item}
                              index={index}
                              quantity={cart[item.id]?.quantity || 0}
                              primary={primary}
                              secondary={secondary}
                              buttonClass={buttonClass}
                              onAdd={() => changeCart(item, 1)}
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

        {gallery.length > 0 && (
          <section id="gallery" className="sensory-section px-3 py-16 sm:px-6">
            <div className="mx-auto mb-8 max-w-7xl">
              <p className="text-xs font-bold uppercase tracking-[.3em]" style={{ color: primary }}>Atmosphere</p>
              <h2 className="mt-3 text-4xl font-semibold sm:text-5xl">A glimpse before you arrive.</h2>
            </div>
            <div className={`mx-auto grid max-w-7xl gap-3 ${theme?.gallery_style === "filmstrip" ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
              {gallery.map((image) => (
                <img key={image.id} src={image.url} alt={image.alt_text || restaurant.name} className="art-frame h-80 w-full rounded-[1.5rem] object-cover shadow-sm transition duration-300 hover:scale-[1.01]" />
              ))}
            </div>
          </section>
        )}

        <section id="contact" className="sensory-section mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:py-28">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.3em]" style={{ color: primary }}>Visit us</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">Come hungry.</h2>
            <div className="mt-8 space-y-5 leading-7 opacity-75">
              <p>{restaurant.address}<br />{restaurant.postal_code} {restaurant.city}</p>
              <p>{restaurant.phone}<br />{restaurant.email}</p>
              <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
                {Object.entries(hours).map(([day, value]) => (
                  <p key={day} className="flex justify-between gap-6 border-b border-black/5 py-2 last:border-0">
                    <span className="capitalize">{day}</span>
                    <span className="font-semibold">{value}</span>
                  </p>
                ))}
              </div>
              {restaurant.google_maps_url && <a href={restaurant.google_maps_url} target="_blank" className="inline-block font-semibold underline">Open Google Maps</a>}
              {restaurant.instagram_url && <a href={restaurant.instagram_url} target="_blank" className="flex items-center gap-2"><Instagram size={17} /> Instagram</a>}
            </div>
          </div>
          <form id="reserve" onSubmit={reserve} className="premium-card rounded-[2rem] p-6 text-slate-900 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: primary }}>Reservations</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Request a table</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">The restaurant will confirm your request. Add dietary notes, allergies, or a special occasion below.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <input name="name" required placeholder="Your name" className="rounded-xl border px-4 py-3" />
              <input name="email" type="email" required placeholder="Email" className="rounded-xl border px-4 py-3" />
              <input name="phone" placeholder="Phone" className="rounded-xl border px-4 py-3" />
              <input name="party_size" type="number" min="1" placeholder="Guests" className="rounded-xl border px-4 py-3" />
              <input name="requested_at" type="datetime-local" className="rounded-xl border px-4 py-3 sm:col-span-2" />
              <textarea name="message" placeholder="Message" className="min-h-24 rounded-xl border px-4 py-3 sm:col-span-2" />
            </div>
            <button className={`mt-4 w-full ${buttonClass} py-3.5 font-semibold text-white shadow-lg`} style={{ backgroundColor: primary }}>
              Send reservation request
            </button>
            {reservationStatus && <p className="mt-3 rounded-xl border border-green-100 bg-green-50 p-3 text-center text-sm font-semibold text-green-800">{reservationStatus}</p>}
          </form>
        </section>
      </main>

      <footer className="px-6 py-12 text-center text-sm" style={{ backgroundColor: text, color: background }}>
        <p className="font-display text-3xl font-semibold">{restaurant.name}</p>
        <p className="mt-3 opacity-70">{restaurant.address}, {restaurant.city}</p>
        <p className="mt-6 text-xs uppercase tracking-[0.24em] opacity-50">Reservations, ordering, and hospitality online.</p>
      </footer>

      <ChatWidget
        slug={restaurant.slug}
        restaurantName={restaurant.name}
        primaryColor={primary}
        menuHighlights={featuredItems.map((item) => item.name)}
        dietaryPrompts={dietaryPrompts}
        bottomOffsetClass={cartCount > 0 ? "bottom-24 sm:bottom-5" : "bottom-5"}
      />

      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-white shadow-2xl sm:left-1/2 sm:right-auto sm:w-[min(520px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:rounded-full sm:px-6 sm:py-4 sm:text-base"
          style={{ backgroundColor: primary }}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15"><ShoppingBag size={19} /></span>
            <span className="min-w-0">
              <span className="block truncate">View order</span>
              <span className="block text-xs text-white/75">{cartCount} item{cartCount === 1 ? "" : "s"}</span>
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-white/15 px-3 py-2">EUR {subtotal.toFixed(2)}</span>
        </button>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5">
          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:rounded-[2rem]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider" style={{ color: primary }}>Online order</p>
                <h2 className="text-3xl font-semibold">Your cart</h2>
              </div>
              <button onClick={() => { setCartOpen(false); setCompletedOrder(null); }} className="rounded-full border p-2" aria-label="Close cart"><X /></button>
            </div>

            {completedOrder ? (
              <div className="mt-8 overflow-hidden rounded-3xl border border-green-100 bg-green-50">
                <div className="p-6 text-center sm:p-8">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-700 text-white">
                    <Check size={30} />
                  </span>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-green-700">Order confirmed</p>
                  <h3 className="mt-2 text-3xl font-bold">#{shortOrderNumber(completedOrder.public_id)}</h3>
                  <p className="mt-2 text-sm leading-6 text-green-900">
                    {restaurant.name} received your order. Keep this number handy if you call the restaurant.
                  </p>
                </div>

                <div className="grid gap-3 border-y border-green-100 bg-white/80 p-4 text-sm sm:grid-cols-3">
                  <SuccessMetric label="Total" value={`EUR ${Number(completedOrder.total).toFixed(2)}`} />
                  <SuccessMetric label="Method" value={orderTypeLabel(completedOrder.order_type)} />
                  <SuccessMetric label="Estimate" value={completedEstimate} />
                </div>

                <div className="space-y-4 p-5 sm:p-6">
                  <OrderTimeline status={completedOrder.status} orderType={completedOrder.order_type} />
                  <div className="rounded-2xl bg-white p-4 text-sm leading-6 text-slate-600">
                    <p className="font-semibold text-slate-900">What happens next</p>
                    <p className="mt-1">{nextInstruction(completedOrder.order_type)}</p>
                    {restaurant.phone && <p className="mt-3">Need help? Call {restaurant.name} at <a className="font-semibold underline" href={`tel:${restaurant.phone}`}>{restaurant.phone}</a>.</p>}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link
                      href={`/restaurants/${restaurant.slug}/orders/${completedOrder.public_id}`}
                      className="rounded-xl bg-green-800 px-5 py-3 text-center font-bold text-white"
                    >
                      Track order
                    </Link>
                    <button onClick={() => { setCartOpen(false); setCompletedOrder(null); }} className="rounded-xl border border-green-200 bg-white px-5 py-3 font-bold text-green-900">
                      Back to menu
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={submitOrder}>
                <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-500">
                  {["Review", "Details", "Confirm"].map((step, index) => (
                    <span key={step} className={`rounded-full px-3 py-2 ${index === 0 ? "text-white" : "bg-slate-100"}`} style={index === 0 ? { backgroundColor: primary } : undefined}>{step}</span>
                  ))}
                </div>
                <div className="mt-6 space-y-3">
                  {cartLines.map((line) => (
                    <div key={line.item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                      <div>
                        <p className="font-semibold">{line.item.name}</p>
                        <p className="text-sm text-slate-500">EUR {Number(line.item.price).toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => changeCart(line.item, -1)} className="rounded-lg border bg-white p-2" aria-label={`Remove one ${line.item.name}`}><Minus size={15} /></button>
                        <b>{line.quantity}</b>
                        <button type="button" onClick={() => changeCart(line.item, 1)} className="rounded-lg border bg-white p-2" aria-label={`Add one ${line.item.name}`}><Plus size={15} /></button>
                        <button type="button" onClick={() => setCart((current) => { const next = { ...current }; delete next[line.item.id]; return next; })} className="ml-2 text-red-600" aria-label={`Remove ${line.item.name}`}><Trash2 size={17} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <p className="text-sm font-bold">How would you like your order?</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[["PICKUP", "Pickup"], ["EAT_IN", "Dine in"], ["DELIVERY", "Delivery"]].map(([value, label]) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() => setOrderType(value as typeof orderType)}
                        className={`rounded-xl border px-2 py-3 text-sm font-bold ${orderType === value ? "text-white" : "bg-white"}`}
                        style={orderType === value ? { backgroundColor: primary } : undefined}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <input required name="customer_name" placeholder="Your name" className="rounded-xl border px-4 py-3" />
                  <input required name="customer_phone" placeholder="Phone number" className="rounded-xl border px-4 py-3" />
                  <input name="customer_email" type="email" placeholder="Email (optional)" className="rounded-xl border px-4 py-3 sm:col-span-2" />
                  {orderType === "DELIVERY" && (
                    <>
                      <input required name="street" placeholder="Street and house number" className="rounded-xl border px-4 py-3 sm:col-span-2" />
                      <input required name="delivery_postal_code" placeholder="Postal code" className="rounded-xl border px-4 py-3" />
                      <input required name="delivery_city" placeholder="City" className="rounded-xl border px-4 py-3" />
                      <input name="delivery_instructions" placeholder="Doorbell, floor, delivery instructions" className="rounded-xl border px-4 py-3 sm:col-span-2" />
                    </>
                  )}
                  <textarea name="notes" placeholder="Notes for the restaurant" className="min-h-20 rounded-xl border px-4 py-3 sm:col-span-2" />
                </div>

                <div className="mt-6 space-y-2 border-t pt-4 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>EUR {subtotal.toFixed(2)}</span></div>
                  {orderType === "DELIVERY" && <div className="flex justify-between"><span>Delivery fee</span><span>EUR 3.50</span></div>}
                  <div className="flex justify-between text-xl font-bold"><span>Total</span><span>EUR {(subtotal + (orderType === "DELIVERY" ? 3.5 : 0)).toFixed(2)}</span></div>
                </div>

                {orderStatus && <p className="mt-3 text-center text-sm text-slate-600">{orderStatus}</p>}
                <button disabled={cartLines.length === 0} className={`mt-5 w-full ${buttonClass} py-4 font-bold text-white disabled:opacity-50`} style={{ backgroundColor: primary }}>
                  Confirm order
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SuccessMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-4 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StorySignal({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
      <Icon size={18} className="opacity-55" />
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] opacity-45">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function FoodFallback({ name, compact = false }: { name: string; compact?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-[#1d1a16] text-white ${compact ? "h-28" : "h-44 sm:h-48"}`}>
      <div className="absolute inset-0 opacity-70" style={{ background: "radial-gradient(circle at 20% 20%, rgba(255,255,255,.16), transparent 9rem), linear-gradient(135deg, rgba(200,75,49,.28), rgba(107,112,72,.18))" }} />
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
  onAdd,
}: {
  item: MenuItem;
  index: number;
  quantity: number;
  primary: string;
  secondary: string;
  buttonClass: string;
  onAdd: () => void;
}) {
  const label = dishExperienceLabel(item, index);
  const pairing = pairingSuggestion(item);

  return (
    <article className={`premium-lift group grid overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm sm:block ${!item.is_available ? "opacity-60" : ""}`}>
      <div className="relative">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="h-44 w-full object-cover transition duration-700 group-hover:scale-105 sm:h-48" />
        ) : (
          <FoodFallback name={item.name} />
        )}
        {quantity > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold shadow-lg" style={{ color: primary }}>
            {quantity} in order
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-40">Plate {String(index + 1).padStart(2, "0")}</p>
            <h4 className="mt-1 text-xl font-semibold leading-snug">{item.name}</h4>
          </div>
          <div className="shrink-0 text-right">
            <b className="block rounded-full bg-black/[.04] px-3 py-1 text-sm" style={{ color: primary }}>EUR {Number(item.price).toFixed(2)}</b>
            <span className="mt-2 inline-block rounded-full border border-black/10 bg-black/[.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: primary }}>{label}</span>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 opacity-65">{item.description || "Ask the AI Maître d' what pairs well with this dish."}</p>
        <p className="mt-3 rounded-xl border border-black/5 bg-black/[.025] px-3 py-2 text-xs leading-5 opacity-70">
          {pairing}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: secondary }}>
          {item.is_vegan && <span className="flex items-center gap-1 rounded-full bg-black/[.04] px-2.5 py-1"><Leaf size={13} /> Vegan</span>}
          {!item.is_vegan && item.is_vegetarian && <span className="rounded-full bg-black/[.04] px-2.5 py-1">Vegetarian</span>}
          {item.is_halal && <span className="rounded-full bg-black/[.04] px-2.5 py-1">Halal</span>}
          {!item.is_available && <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">Unavailable</span>}
        </div>
        {item.allergens ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">Allergens: {item.allergens}</p>
        ) : (
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">Ask staff about allergens before ordering.</p>
        )}
        <button
          disabled={!item.is_available}
          onClick={onAdd}
          className={`mt-5 flex w-full items-center justify-center gap-2 ${buttonClass} py-3 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none`}
          style={item.is_available ? { backgroundColor: primary } : undefined}
        >
          <Plus size={16} /> {item.is_available ? "Add to order" : "Unavailable today"}
        </button>
      </div>
    </article>
  );
}

function OrderTimeline({ status, orderType }: { status: string; orderType: RestaurantOrder["order_type"] }) {
  const steps = orderSteps(orderType);
  const currentIndex = Math.max(0, steps.findIndex((step) => step.statuses.includes(status)));
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="font-semibold text-slate-900">Status timeline</p>
      <div className="mt-4 space-y-3">
        {steps.map((step, index) => {
          const done = index <= currentIndex;
          return (
            <div key={step.label} className="flex gap-3">
              <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? "bg-green-700 text-white" : "bg-slate-100 text-slate-400"}`}>
                {index + 1}
              </span>
              <div>
                <p className={`font-semibold ${done ? "text-slate-950" : "text-slate-400"}`}>{step.label}</p>
                <p className="text-sm leading-6 text-slate-500">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function orderSteps(orderType: RestaurantOrder["order_type"]) {
  if (orderType === "DELIVERY") {
    return [
      { label: "Order received", description: "The restaurant has your order.", statuses: ["NEW"] },
      { label: "Preparing", description: "The kitchen is working on it.", statuses: ["ACCEPTED", "PREPARING"] },
      { label: "On the way", description: "Delivery is heading to you.", statuses: ["READY", "DELIVERING"] },
      { label: "Delivered", description: "Enjoy your meal.", statuses: ["DELIVERED", "COMPLETED"] },
    ];
  }
  return [
    { label: "Order received", description: "The restaurant has your order.", statuses: ["NEW"] },
    { label: "Preparing", description: "The kitchen is working on it.", statuses: ["ACCEPTED", "PREPARING"] },
    { label: orderType === "EAT_IN" ? "Ready for your table" : "Ready for pickup", description: "Staff will have it ready shortly.", statuses: ["READY"] },
    { label: "Completed", description: "Thanks for ordering.", statuses: ["PICKED_UP", "COMPLETED"] },
  ];
}

function estimateText(order: RestaurantOrder) {
  if (order.estimated_minutes) return `${order.estimated_minutes} min`;
  if (order.order_type === "DELIVERY") return "35-50 min";
  if (order.order_type === "EAT_IN") return "15-25 min";
  return "20-30 min";
}

function orderTypeLabel(orderType: RestaurantOrder["order_type"]) {
  return orderType === "EAT_IN" ? "Dine in" : orderType.charAt(0) + orderType.slice(1).toLowerCase();
}

function nextInstruction(orderType: RestaurantOrder["order_type"]) {
  if (orderType === "DELIVERY") return "Watch this tracking page for status changes. The restaurant may call if they need delivery details.";
  if (orderType === "EAT_IN") return "Arrive at the restaurant and mention your order number to staff.";
  return "Come to the restaurant around the estimated pickup time and mention your order number.";
}

function buildDietaryPrompts(items: MenuItem[]) {
  const prompts = [];
  if (items.some((item) => item.is_vegan)) prompts.push("Show me vegan options");
  if (items.some((item) => item.is_vegetarian)) prompts.push("What is vegetarian?");
  if (items.some((item) => item.is_halal)) prompts.push("Which dishes are halal?");
  if (items.some((item) => item.allergens)) prompts.push("Help me avoid allergens");
  return prompts.length > 0 ? prompts : ["Help me choose for allergies"];
}

function restaurantPersonality(template: string) {
  const personalities: Record<string, { name: string; description: string; momentTitle: string; momentCopy: string }> = {
    elegant: {
      name: "Modern Luxury",
      description: "A quiet, high-touch identity for restaurants that want every interaction to feel composed and intentional.",
      momentTitle: "A room designed around anticipation.",
      momentCopy: "Before the first plate arrives, the evening already has a rhythm: soft light, clear choices, and a sense that the kitchen is ready for you.",
    },
    modern_luxury: {
      name: "Modern Luxury",
      description: "A quiet, high-touch identity for restaurants that want every interaction to feel composed and intentional.",
      momentTitle: "A room designed around anticipation.",
      momentCopy: "Before the first plate arrives, the evening already has a rhythm: soft light, clear choices, and a sense that the kitchen is ready for you.",
    },
    italian: {
      name: "Italian Heritage",
      description: "Warm, generous, ingredient-led storytelling for restaurants built on family, fire, wine, and memory.",
      momentTitle: "An evening that begins with the table.",
      momentCopy: "Comfort, aroma, and hospitality lead the experience, with dishes presented as familiar rituals rather than simple products.",
    },
    nordic: {
      name: "Nordic Michelin",
      description: "Minimal, seasonal, and atmospheric: the restaurant feels precise, natural, and deeply connected to the moment.",
      momentTitle: "Seasonality, restraint, and a little silence.",
      momentCopy: "The story is told through space, ingredients, and confidence. Nothing shouts, but every detail carries weight.",
    },
    japanese: {
      name: "Japanese Omakase",
      description: "Disciplined pacing, quiet detail, and trust in the chef's sequence for restaurants centered on craft.",
      momentTitle: "Let the evening unfold one course at a time.",
      momentCopy: "The menu feels guided, personal, and precise, with the AI maitre d' helping guests navigate preferences before they arrive.",
    },
    french: {
      name: "French Fine Dining",
      description: "Ceremonial, composed, and wine-aware with a sense of polish around booking, pacing, and service.",
      momentTitle: "A more ceremonial kind of evening.",
      momentCopy: "The experience gives guests confidence before arrival: what to order, how to pair, when to book, and how the room will feel.",
    },
    steakhouse: {
      name: "Modern Steakhouse",
      description: "Bold, direct, flame-led confidence for restaurants where craft, sourcing, and service create the atmosphere.",
      momentTitle: "Fire, timing, and a confident room.",
      momentCopy: "The experience highlights signature cuts, generous sides, and pairings that make ordering feel easy and decisive.",
    },
    mediterranean: {
      name: "Mediterranean",
      description: "Sunlit, relaxed, produce-forward hospitality for restaurants that want warmth without losing polish.",
      momentTitle: "Bright plates, generous tables, easy decisions.",
      momentCopy: "The guest journey feels open and inviting, with seasonal dishes, direct ordering, and reservations gathered into one elegant flow.",
    },
    minimal_black: {
      name: "Minimal Black",
      description: "Gallery-like restraint for restaurants that want the food, photography, and typography to carry the entire mood.",
      momentTitle: "A darker room. A sharper focus.",
      momentCopy: "The interface steps back so the food becomes the object: precise, desirable, and calm.",
    },
    "minimal-black": {
      name: "Minimal Black",
      description: "Gallery-like restraint for restaurants that want the food, photography, and typography to carry the entire mood.",
      momentTitle: "A darker room. A sharper focus.",
      momentCopy: "The interface steps back so the food becomes the object: precise, desirable, and calm.",
    },
  };
  return personalities[template] ?? personalities.mediterranean;
}

function buildStoryMoments(restaurant: Restaurant, featuredItems: MenuItem[], personality: ReturnType<typeof restaurantPersonality>) {
  const firstDish = featuredItems[0]?.name || "the first plate";
  const secondDish = featuredItems[1]?.name || "the seasonal special";
  return [
    {
      icon: Sparkles,
      label: personality.name,
      value: "A restaurant identity ready to become a full website theme.",
      detail: personality.description,
    },
    {
      icon: ChefHat,
      label: "Chef's note",
      value: `${firstDish} is a natural place to begin.`,
      detail: "The menu presentation gives guests a confident first choice instead of forcing them to scan a long list.",
    },
    {
      icon: Leaf,
      label: "Seasonal moment",
      value: `${secondDish} can become tonight's highlight.`,
      detail: "The highlight changes with the season, the kitchen's rhythm, and the table you are planning.",
    },
    {
      icon: Flame,
      label: "Kitchen story",
      value: restaurant.story ? "The restaurant already has a story worth surfacing." : "Add a kitchen note to make the room feel alive.",
      detail: "This area is designed for wood-fired ovens, handmade pasta, omakase pacing, local produce, or any detail that makes the restaurant memorable.",
    },
    {
      icon: Wine,
      label: "Pairing cue",
      value: "Guests are invited to ask for pairings, allergies, and occasion-based guidance.",
      detail: "This makes the AI Maître d' feel like part of hospitality, not just a question box.",
    },
  ];
}

function dishExperienceLabel(item: MenuItem, index: number) {
  if (index === 0) return "Signature";
  if (index === 1) return "Most loved";
  if (item.description?.toLowerCase().includes("season")) return "Seasonal";
  if (item.is_vegan || item.is_vegetarian) return "Plant friendly";
  return "Tonight";
}

function pairingSuggestion(item: MenuItem) {
  const description = `${item.name} ${item.description}`.toLowerCase();
  if (description.includes("spicy") || description.includes("chili")) return "Pair with something bright, cold, or citrus-led to keep the heat elegant.";
  if (description.includes("beef") || description.includes("steak")) return "Ask for a bold red wine or a roasted side to make this feel like the center of the table.";
  if (description.includes("fish") || description.includes("sea")) return "A crisp white wine, fresh salad, or citrus-forward starter will keep the plate lifted.";
  if (item.is_vegan || item.is_vegetarian) return "A fresh starter keeps this plant-forward choice bright and balanced.";
  return "Ask the AI Maître d' for a pairing based on your mood, appetite, and table plans.";
}

function matchesMenuFilters(item: MenuItem, query: string, filter: "all" | "vegan" | "vegetarian" | "halal") {
  const haystack = `${item.name} ${item.description} ${item.allergens}`.toLowerCase();
  const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
  const matchesFilter =
    filter === "all" ||
    (filter === "vegan" && item.is_vegan) ||
    (filter === "vegetarian" && (item.is_vegetarian || item.is_vegan)) ||
    (filter === "halal" && item.is_halal);
  return matchesQuery && matchesFilter;
}

function shortOrderNumber(publicId: string) {
  return publicId.split("-")[0].toUpperCase();
}
