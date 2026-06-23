"use client";

import { Check, Clock3, Instagram, Leaf, MapPin, Menu as MenuIcon, Minus, Phone, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import ChatWidget from "./ChatWidget";
import request from "@/lib/api";
import type { MenuItem, Restaurant, RestaurantOrder } from "@/lib/types";

type CartLine = { item: MenuItem; quantity: number };

export default function RestaurantSite({ restaurant }: { restaurant: Restaurant }) {
  const [mobile, setMobile] = useState(false);
  const [reservationStatus, setReservationStatus] = useState("");
  const [cart, setCart] = useState<Record<number, CartLine>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<"PICKUP" | "EAT_IN" | "DELIVERY">("PICKUP");
  const [orderStatus, setOrderStatus] = useState("");
  const [completedOrder, setCompletedOrder] = useState<RestaurantOrder | null>(null);
  const theme = restaurant.theme;
  const primary = restaurant.primary_color || theme?.primary_color || "#c84b31";
  const secondary = restaurant.secondary_color || theme?.secondary_color || "#6b7048";
  const background = restaurant.background_color || theme?.background_color || "#f7f3ea";
  const text = restaurant.text_color || theme?.text_color || "#1b1b18";
  const template = theme?.key || "mediterranean";
  const font = restaurant.font_family || theme?.font_family || "Cormorant Garamond";
  const buttonClass = restaurant.button_style === "square" ? "" : restaurant.button_style === "soft" ? "rounded-xl" : "rounded-full";
  const hours = useMemo(() => { try { return JSON.parse(restaurant.opening_hours) as Record<string, string>; } catch { return { hours: restaurant.opening_hours }; } }, [restaurant.opening_hours]);
  const gallery = restaurant.images.filter((image) => ["gallery", "food"].includes(image.image_type));
  const cartLines = Object.values(cart);
  const cartCount = cartLines.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cartLines.reduce((total, line) => total + Number(line.item.price) * line.quantity, 0);

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
    setOrderStatus("Sending your order…");
    try {
      const order = await request<RestaurantOrder>(`/restaurants/${restaurant.slug}/orders`, {
        method: "POST",
        body: JSON.stringify({
          order_type: orderType,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          customer_email: data.customer_email || null,
          notes: data.notes || "",
          items: cartLines.map((line) => ({ menu_item_id: line.item.id, quantity: line.quantity, notes: "" })),
          delivery_address: orderType === "DELIVERY" ? {
            street: data.street,
            postal_code: data.delivery_postal_code,
            city: data.delivery_city,
            instructions: data.delivery_instructions || "",
          } : null,
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
    event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
    setReservationStatus("Sending…");
    try { await request(`/restaurants/${restaurant.slug}/reservations`, { method: "POST", body: JSON.stringify({ ...data, party_size: data.party_size ? Number(data.party_size) : null }) }); form.reset(); setReservationStatus("Request received. The restaurant will confirm shortly."); }
    catch (error) { setReservationStatus(error instanceof Error ? error.message : "Could not send request."); }
  }

  const darkHero = template === "elegant" || template === "japanese";
  return (
    <div style={{ backgroundColor: background, color: text, fontFamily: font }}>
      <header className={`absolute inset-x-0 top-0 z-30 ${darkHero ? "text-white" : "text-white"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <a href="#top" className="flex items-center gap-3 text-xl font-bold">{restaurant.logo_url && <img src={restaurant.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />}{restaurant.name}</a>
          <nav className="hidden items-center gap-7 text-sm font-semibold md:flex"><a href="#story">Story</a><a href="#menu">Menu</a><a href="#gallery">Gallery</a><a href="#contact">Contact</a><a href="#reserve" className={`${buttonClass} px-5 py-2.5 text-white`} style={{ backgroundColor: primary }}>Reserve</a></nav>
          <button className="md:hidden" onClick={() => setMobile(!mobile)}>{mobile ? <X /> : <MenuIcon />}</button>
        </div>
        {mobile && <nav className="mx-4 flex flex-col gap-4 rounded-2xl bg-black/90 p-6 text-white md:hidden"><a href="#story">Story</a><a href="#menu">Menu</a><a href="#gallery">Gallery</a><a href="#contact">Contact</a></nav>}
      </header>

      <main id="top">
        <section className={`relative flex min-h-[88vh] items-end overflow-hidden bg-cover bg-center ${template === "japanese" ? "grayscale" : ""}`} style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.78), rgba(0,0,0,.12)), url(${restaurant.hero_image})` }}>
          <div className={`relative z-10 mx-auto w-full max-w-7xl px-6 pb-20 pt-40 text-white ${template === "minimal" ? "text-center" : ""}`}>
            <p className="text-xs font-bold uppercase tracking-[.35em]" style={{ color: secondary }}>{restaurant.city || "Welcome"}</p>
            <h1 className={`mt-5 max-w-5xl font-semibold leading-[.92] ${template === "fast-food" ? "text-6xl uppercase sm:text-8xl" : "text-6xl sm:text-8xl"}`}>{restaurant.tagline || restaurant.name}</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-white/80">{restaurant.description}</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href="#menu" className={`${buttonClass} px-7 py-4 font-semibold text-white`} style={{ backgroundColor: primary }}>Explore menu</a><a href="#reserve" className={`${buttonClass} border border-white/50 px-7 py-4 font-semibold`}>Book a table</a></div>
          </div>
        </section>

        <section className="border-b border-black/10 bg-white/80"><div className="mx-auto grid max-w-7xl divide-y px-6 md:grid-cols-3 md:divide-x md:divide-y-0"><div className="flex gap-3 py-6 md:pr-6"><MapPin style={{ color: primary }} /><span>{restaurant.address}, {restaurant.city}</span></div><div className="flex gap-3 py-6 md:px-6"><Phone style={{ color: primary }} /><span>{restaurant.phone || "Phone coming soon"}</span></div><div className="flex gap-3 py-6 md:pl-6"><Clock3 style={{ color: primary }} /><span>See opening hours below</span></div></div></section>

        <section id="story" className={`mx-auto max-w-7xl px-6 py-24 ${template === "cafe" ? "grid gap-8 lg:grid-cols-2" : ""}`}><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.3em]" style={{ color: primary }}>Our story</p><h2 className="mt-4 text-5xl font-semibold">{restaurant.name}, made personal.</h2><p className="mt-7 whitespace-pre-line text-lg leading-8 opacity-75">{restaurant.story || restaurant.description}</p></div></section>

        <section id="menu" className="bg-white/60 px-6 py-24"><div className="mx-auto max-w-6xl"><div className="text-center"><p className="text-xs font-bold uppercase tracking-[.3em]" style={{ color: primary }}>Fresh from the kitchen</p><h2 className="mt-4 text-5xl font-semibold">Menu & online ordering</h2><p className="mt-3 opacity-60">Add your favorites and choose pickup, eat-in, or delivery at checkout.</p></div><div className="mt-14 space-y-16">{restaurant.categories.map((category) => <section key={category.id}><div className="border-b border-black/15 pb-4"><h3 className="text-3xl font-semibold">{category.name}</h3><p className="mt-1 opacity-60">{category.description}</p></div><div className={`mt-7 grid gap-8 ${restaurant.menu_style === "cards" || theme?.menu_style === "cards" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>{category.items.filter((item) => item.is_available).map((item) => <article key={item.id} className={`${restaurant.menu_style === "cards" || theme?.menu_style === "cards" ? "rounded-2xl bg-white p-5 shadow-sm" : ""}`}>{item.image_url && <img src={item.image_url} alt={item.name} className="mb-4 h-40 w-full rounded-xl object-cover" />}<div className="flex justify-between gap-4"><h4 className="text-xl font-semibold">{item.name}</h4><b style={{ color: primary }}>€{Number(item.price).toFixed(2)}</b></div><p className="mt-2 text-sm leading-6 opacity-65">{item.description}</p><div className="mt-3 flex gap-3 text-xs font-bold uppercase tracking-wider" style={{ color: secondary }}>{item.is_vegan && <span className="flex gap-1"><Leaf size={13} /> Vegan</span>}{!item.is_vegan && item.is_vegetarian && <span>Vegetarian</span>}{item.is_halal && <span>Halal</span>}</div>{item.allergens && <p className="mt-2 text-xs opacity-45">Allergens: {item.allergens}</p>}<button onClick={() => changeCart(item, 1)} className={`mt-4 flex w-full items-center justify-center gap-2 ${buttonClass} py-2.5 text-sm font-bold text-white`} style={{ backgroundColor: primary }}><Plus size={16} /> Add to order</button></article>)}</div></section>)}</div></div></section>

        {gallery.length > 0 && <section id="gallery" className="px-3 py-3"><div className={`grid gap-3 ${theme?.gallery_style === "filmstrip" ? "md:grid-cols-4" : "md:grid-cols-3"}`}>{gallery.map((image) => <img key={image.id} src={image.url} alt={image.alt_text || restaurant.name} className="h-80 w-full object-cover" />)}</div></section>}

        <section id="contact" className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-[.3em]" style={{ color: primary }}>Visit us</p><h2 className="mt-4 text-5xl font-semibold">Come hungry.</h2><div className="mt-8 space-y-5 leading-7 opacity-75"><p>{restaurant.address}<br />{restaurant.postal_code} {restaurant.city}</p><p>{restaurant.phone}<br />{restaurant.email}</p><div>{Object.entries(hours).map(([day, value]) => <p key={day} className="flex max-w-md justify-between gap-6"><span className="capitalize">{day}</span><span>{value}</span></p>)}</div>{restaurant.google_maps_url && <a href={restaurant.google_maps_url} target="_blank" className="inline-block font-semibold underline">Open Google Maps</a>}{restaurant.instagram_url && <a href={restaurant.instagram_url} target="_blank" className="flex items-center gap-2"><Instagram size={17} /> Instagram</a>}</div></div>
          <form id="reserve" onSubmit={reserve} className="rounded-3xl bg-white p-7 text-slate-900 shadow-xl"><h2 className="text-4xl font-semibold">Request a table</h2><p className="mt-2 text-sm text-slate-500">The restaurant will confirm your request.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><input name="name" required placeholder="Your name" className="rounded-xl border px-4 py-3" /><input name="email" type="email" required placeholder="Email" className="rounded-xl border px-4 py-3" /><input name="phone" placeholder="Phone" className="rounded-xl border px-4 py-3" /><input name="party_size" type="number" min="1" placeholder="Guests" className="rounded-xl border px-4 py-3" /><input name="requested_at" type="datetime-local" className="rounded-xl border px-4 py-3 sm:col-span-2" /><textarea name="message" placeholder="Message" className="min-h-24 rounded-xl border px-4 py-3 sm:col-span-2" /></div><button className={`mt-4 w-full ${buttonClass} py-3.5 font-semibold text-white`} style={{ backgroundColor: primary }}>Send reservation request</button>{reservationStatus && <p className="mt-3 text-center text-sm text-slate-600">{reservationStatus}</p>}</form>
        </section>
      </main>
      <footer className="px-6 py-10 text-center text-sm opacity-60" style={{ backgroundColor: text, color: background }}>© {new Date().getFullYear()} {restaurant.name} · Powered by RestaurantAI</footer>
      <ChatWidget slug={restaurant.slug} restaurantName={restaurant.name} primaryColor={primary} />
      {cartCount > 0 && <button onClick={() => setCartOpen(true)} className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full px-6 py-4 font-bold text-white shadow-2xl" style={{ backgroundColor: primary }}><ShoppingBag size={19} /> View order · {cartCount} item{cartCount === 1 ? "" : "s"} · €{subtotal.toFixed(2)}</button>}
      {cartOpen && <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-5"><div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 text-slate-900 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between"><div><p className="text-sm font-bold uppercase tracking-wider" style={{ color: primary }}>Online order</p><h2 className="text-3xl font-semibold">Your cart</h2></div><button onClick={() => { setCartOpen(false); setCompletedOrder(null); }} className="rounded-full border p-2"><X /></button></div>
        {completedOrder ? <div className="mt-8 rounded-2xl bg-green-50 p-7 text-center"><Check className="mx-auto text-green-700" size={38} /><h3 className="mt-3 text-2xl font-bold">Order #{completedOrder.id} received!</h3><p className="mt-2 text-sm text-green-800">The restaurant will review your order. Total: €{Number(completedOrder.total).toFixed(2)}</p><button onClick={() => { setCartOpen(false); setCompletedOrder(null); }} className="mt-5 rounded-xl bg-green-800 px-5 py-3 font-bold text-white">Done</button></div> : <form onSubmit={submitOrder}>
          <div className="mt-6 space-y-3">{cartLines.map((line) => <div key={line.item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="font-semibold">{line.item.name}</p><p className="text-sm text-slate-500">€{Number(line.item.price).toFixed(2)} each</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => changeCart(line.item, -1)} className="rounded-lg border bg-white p-2"><Minus size={15} /></button><b>{line.quantity}</b><button type="button" onClick={() => changeCart(line.item, 1)} className="rounded-lg border bg-white p-2"><Plus size={15} /></button><button type="button" onClick={() => setCart((current) => { const next = { ...current }; delete next[line.item.id]; return next; })} className="ml-2 text-red-600"><Trash2 size={17} /></button></div></div>)}</div>
          <div className="mt-6"><p className="text-sm font-bold">How would you like your order?</p><div className="mt-3 grid grid-cols-3 gap-2">{[["PICKUP","Abholen"],["EAT_IN","Hier essen"],["DELIVERY","Lieferung"]].map(([value,label]) => <button type="button" key={value} onClick={() => setOrderType(value as typeof orderType)} className={`rounded-xl border px-2 py-3 text-sm font-bold ${orderType === value ? "text-white" : "bg-white"}`} style={orderType === value ? { backgroundColor: primary } : undefined}>{label}</button>)}</div></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><input required name="customer_name" placeholder="Your name" className="rounded-xl border px-4 py-3" /><input required name="customer_phone" placeholder="Phone number" className="rounded-xl border px-4 py-3" /><input name="customer_email" type="email" placeholder="Email (optional)" className="rounded-xl border px-4 py-3 sm:col-span-2" />{orderType === "DELIVERY" && <><input required name="street" placeholder="Street and house number" className="rounded-xl border px-4 py-3 sm:col-span-2" /><input required name="delivery_postal_code" placeholder="Postal code" className="rounded-xl border px-4 py-3" /><input required name="delivery_city" placeholder="City" className="rounded-xl border px-4 py-3" /><input name="delivery_instructions" placeholder="Doorbell, floor, delivery instructions" className="rounded-xl border px-4 py-3 sm:col-span-2" /></>}<textarea name="notes" placeholder="Notes for the restaurant" className="min-h-20 rounded-xl border px-4 py-3 sm:col-span-2" /></div>
          <div className="mt-6 space-y-2 border-t pt-4 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>€{subtotal.toFixed(2)}</span></div>{orderType === "DELIVERY" && <div className="flex justify-between"><span>Delivery fee</span><span>€3.50</span></div>}<div className="flex justify-between text-xl font-bold"><span>Total</span><span>€{(subtotal + (orderType === "DELIVERY" ? 3.5 : 0)).toFixed(2)}</span></div></div>
          {orderStatus && <p className="mt-3 text-center text-sm text-slate-600">{orderStatus}</p>}<button disabled={cartLines.length === 0} className={`mt-5 w-full ${buttonClass} py-4 font-bold text-white disabled:opacity-50`} style={{ backgroundColor: primary }}>Confirm order</button>
        </form>}
      </div></div>}
    </div>
  );
}
