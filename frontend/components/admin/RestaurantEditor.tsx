"use client";

import { ExternalLink, Plus, Save, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import AdminShell from "./AdminShell";
import RestaurantNav from "./RestaurantNav";
import SetupProgress from "./SetupProgress";
import { adminRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type {
  ContactRequest,
  Conversation,
  MenuItem,
  Restaurant,
  RestaurantOverview,
  Theme,
  User,
} from "@/lib/types";

type Mode = "edit" | "design" | "menu" | "images" | "chatbot" | "reservations";
type Document = { id: number; filename: string; status: string; created_at: string };
const field = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm";
const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function restaurantPayload(restaurant: Restaurant) {
  const { id, owner, theme, categories, images, created_at, ...payload } = restaurant;
  return payload;
}

export default function RestaurantEditor({ id, mode }: { id: number; mode: Mode }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [owners, setOwners] = useState<User[]>([]);
  const [status, setStatus] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [reservations, setReservations] = useState<ContactRequest[]>([]);
  const [overview, setOverview] = useState<RestaurantOverview | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">("saved");
  const token = getToken();
  const load = useCallback(async () => {
    const [restaurantData, overviewData] = await Promise.all([
      adminRequest<Restaurant>(`/admin/restaurants/${id}`, getToken()),
      adminRequest<RestaurantOverview[]>("/admin/restaurants-overview", getToken()),
    ]);
    setRestaurant(restaurantData);
    setOverview(overviewData.find((item) => item.id === id) || null);
    setSaveState("saved");
  }, [id]);

  useEffect(() => {
    load();
    adminRequest<Theme[]>("/admin/themes", getToken()).then(setThemes);
    adminRequest<User[]>("/admin/users", getToken()).then(setOwners).catch(() => setOwners([]));
  }, [load]);
  useEffect(() => {
    if (mode === "chatbot") Promise.all([
      adminRequest<Document[]>(`/admin/restaurants/${id}/documents`, getToken()),
      adminRequest<Conversation[]>(`/admin/restaurants/${id}/conversations`, getToken()),
    ]).then(([d, c]) => { setDocuments(d); setConversations(c); });
    if (mode === "reservations") adminRequest<ContactRequest[]>(`/admin/restaurants/${id}/reservations`, getToken()).then(setReservations);
  }, [id, mode]);

  const hours = useMemo(() => {
    try { return JSON.parse(restaurant?.opening_hours || "{}") as Record<string, string>; } catch { return {}; }
  }, [restaurant]);

  async function update(payload: Partial<Restaurant>, message = "Changes saved.") {
    if (!restaurant) return;
    setSaveState("saving");
    try {
      const updated = await adminRequest<Restaurant>(`/admin/restaurants/${id}`, token, {
        method: "PUT",
        body: JSON.stringify({ ...restaurantPayload(restaurant), ...payload }),
      });
      setRestaurant(updated); setStatus(message); setSaveState("saved");
      const overviewData = await adminRequest<RestaurantOverview[]>("/admin/restaurants-overview", token);
      setOverview(overviewData.find((item) => item.id === id) || null);
    } catch (error) {
      setSaveState("unsaved");
      setStatus(error instanceof Error ? error.message : "Could not save changes.");
    }
  }

  async function saveInfo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formData = new FormData(event.currentTarget); const data = Object.fromEntries(formData);
    data.is_published = formData.has("is_published") ? "true" : "false";
    const opening_hours = JSON.stringify(Object.fromEntries(days.map((day) => [day, data[`hours_${day}`] || "Closed"])));
    days.forEach((day) => delete data[`hours_${day}`]);
    await update({ ...data, owner_id: data.owner_id ? Number(data.owner_id) : null, opening_hours } as Partial<Restaurant>);
  }

  async function applyTheme(theme: Theme) {
    if (!restaurant) return;
    setRestaurant({ ...restaurant, theme_id: theme.id, theme, primary_color: theme.primary_color, secondary_color: theme.secondary_color, background_color: theme.background_color, text_color: theme.text_color, font_family: theme.font_family, button_style: theme.button_style, homepage_style: theme.homepage_style, menu_style: theme.menu_style, gallery_style: theme.gallery_style });
    setSaveState("unsaved");
    setStatus(`${theme.name} selected. Review the preview, then save.`);
  }

  async function saveDesign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget));
    await update({ ...data, theme_id: Number(data.theme_id) || null } as Partial<Restaurant>, "Design published.");
  }

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
    await adminRequest(`/admin/restaurants/${id}/categories`, token, { method: "POST", body: JSON.stringify({ ...data, sort_order: restaurant?.categories.length || 0 }) }); form.reset(); load();
  }
  async function deleteCategory(categoryId: number) { if (!confirm("Delete category and all its items?")) return; await adminRequest(`/admin/restaurants/${id}/categories/${categoryId}`, token, { method: "DELETE" }); load(); }
  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    await adminRequest(`/admin/restaurants/${id}/menu-items`, token, { method: "POST", body: JSON.stringify({ category_id: Number(data.get("category_id")), name: data.get("name"), description: data.get("description"), price: Number(data.get("price")), allergens: data.get("allergens"), image_url: data.get("image_url") || "", is_available: true, is_vegan: data.get("is_vegan") === "on", is_vegetarian: data.get("is_vegetarian") === "on", is_halal: data.get("is_halal") === "on" }) }); form.reset(); load();
  }
  async function editItem(item: MenuItem) {
    const name = prompt("Item name", item.name); if (name === null) return;
    const price = prompt("Price", String(item.price)); if (price === null) return;
    const description = prompt("Description", item.description); if (description === null) return;
    await adminRequest(`/admin/restaurants/${id}/menu-items/${item.id}`, token, { method: "PUT", body: JSON.stringify({ ...item, name, price: Number(price), description }) }); load();
  }
  async function deleteItem(itemId: number) { if (!confirm("Delete this menu item?")) return; await adminRequest(`/admin/restaurants/${id}/menu-items/${itemId}`, token, { method: "DELETE" }); load(); }

  async function uploadImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; await adminRequest(`/admin/restaurants/${id}/images`, token, { method: "POST", body: new FormData(form) }); form.reset(); await load(); setStatus("Image uploaded.");
  }
  async function deleteImage(imageId: number) { await adminRequest(`/admin/restaurants/${id}/images/${imageId}`, token, { method: "DELETE" }); load(); }
  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; await adminRequest(`/admin/restaurants/${id}/documents`, token, { method: "POST", body: new FormData(form) }); form.reset(); setDocuments(await adminRequest<Document[]>(`/admin/restaurants/${id}/documents`, token)); setStatus("Knowledge document processed.");
  }
  async function reservationStatus(reservationId: number, value: string) {
    await adminRequest(`/admin/restaurants/${id}/reservations/${reservationId}`, token, { method: "PATCH", body: JSON.stringify({ status: value }) });
    setReservations(await adminRequest<ContactRequest[]>(`/admin/restaurants/${id}/reservations`, token));
  }

  if (!restaurant) return <AdminShell><p className="text-slate-500">Loading restaurant editor…</p></AdminShell>;
  const primary = restaurant.primary_color || restaurant.theme?.primary_color || "#c84b31";
  const secondary = restaurant.secondary_color || restaurant.theme?.secondary_color || "#6b7048";
  const background = restaurant.background_color || restaurant.theme?.background_color || "#f7f3ea";
  const text = restaurant.text_color || restaurant.theme?.text_color || "#1b1b18";

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-orange-600">Restaurant editor</p><h1 className="mt-1 text-4xl font-semibold">{restaurant.name}</h1><p className="mt-1 text-sm text-slate-500">/restaurants/{restaurant.slug}</p></div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${saveState === "saved" ? "bg-green-50 text-green-700" : saveState === "saving" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{saveState === "saved" ? "All changes saved" : saveState === "saving" ? "Saving…" : "Unsaved changes"}</span>
          <Link href={`/restaurants/${restaurant.slug}`} target="_blank" className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold">Open website <ExternalLink size={15} /></Link>
        </div>
      </div>
      <RestaurantNav id={id} active={mode} />
      {overview && <section className="mb-6 rounded-2xl border bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Website setup</h2><p className="text-xs text-slate-500">Complete the missing steps to make this restaurant presentation-ready.</p></div>{overview.setup_percent < 100 && <Link href={`/admin/restaurants/${id}/${!overview.checklist.information ? "edit" : !overview.checklist.branding ? "images" : !overview.checklist.menu ? "menu" : !overview.checklist.design ? "design" : "chatbot"}`} className="text-sm font-semibold text-orange-600">Continue setup →</Link>}</div><div className="mt-4"><SetupProgress checklist={overview.checklist} percent={overview.setup_percent} /></div></section>}
      {status && <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{status}</div>}

      {mode === "edit" && <form onSubmit={saveInfo} onChange={() => setSaveState("unsaved")} className="grid gap-5 rounded-2xl border bg-white p-6 md:grid-cols-2">
        <div className="md:col-span-2"><h2 className="text-2xl font-semibold">Basic information</h2><p className="mt-1 text-sm text-slate-500">Everything customers see and use to contact the restaurant.</p></div>
        <label className="text-sm font-medium">Restaurant name<input className={field} name="name" defaultValue={restaurant.name} required /></label><label className="text-sm font-medium">Website slug<input className={field} name="slug" defaultValue={restaurant.slug} required /></label>
        <label className="text-sm font-medium">Tagline<input className={field} name="tagline" defaultValue={restaurant.tagline} /></label><label className="text-sm font-medium">Owner<select className={field} name="owner_id" defaultValue={restaurant.owner_id || ""}><option value="">No owner assigned</option>{owners.filter((owner) => owner.role === "RESTAURANT_OWNER").map((owner) => <option key={owner.id} value={owner.id}>{owner.name || owner.email}</option>)}</select></label>
        <label className="text-sm font-medium md:col-span-2">Description<textarea className={`${field} min-h-28`} name="description" defaultValue={restaurant.description} /></label><label className="text-sm font-medium md:col-span-2">Restaurant story<textarea className={`${field} min-h-28`} name="story" defaultValue={restaurant.story} /></label>
        <label className="text-sm font-medium">Phone<input className={field} name="phone" defaultValue={restaurant.phone} /></label><label className="text-sm font-medium">Email<input className={field} name="email" type="email" defaultValue={restaurant.email} required /></label>
        <label className="text-sm font-medium">Address<input className={field} name="address" defaultValue={restaurant.address} /></label><label className="text-sm font-medium">City<input className={field} name="city" defaultValue={restaurant.city} /></label><label className="text-sm font-medium">Postal code<input className={field} name="postal_code" defaultValue={restaurant.postal_code} /></label><label className="text-sm font-medium">Google Maps link<input className={field} name="google_maps_url" defaultValue={restaurant.google_maps_url} /></label>
        <label className="text-sm font-medium">Instagram<input className={field} name="instagram_url" defaultValue={restaurant.instagram_url} /></label><label className="text-sm font-medium">Facebook<input className={field} name="facebook_url" defaultValue={restaurant.facebook_url} /></label><label className="text-sm font-medium">TikTok<input className={field} name="tiktok_url" defaultValue={restaurant.tiktok_url} /></label><label className="flex items-center gap-3 self-end rounded-xl bg-slate-50 p-4 text-sm font-medium"><input type="checkbox" name="is_published" defaultChecked={restaurant.is_published} /> Website published</label>
        <div className="border-t pt-5 md:col-span-2"><h2 className="text-2xl font-semibold">Opening hours</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{days.map((day) => <label key={day} className="text-sm font-medium capitalize">{day}<input className={field} name={`hours_${day}`} defaultValue={hours[day] || "Closed"} placeholder="12:00–22:00 or Closed" /></label>)}</div></div>
        <input type="hidden" name="logo_url" value={restaurant.logo_url} /><input type="hidden" name="hero_image" value={restaurant.hero_image} /><input type="hidden" name="reservation_url" value={restaurant.reservation_url} /><input type="hidden" name="theme_id" value={restaurant.theme_id || ""} />
        {["primary_color","secondary_color","background_color","text_color","font_family","button_style","homepage_style","menu_style","gallery_style"].map((name) => <input key={name} type="hidden" name={name} value={String(restaurant[name as keyof Restaurant] || "")} />)}
        <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-2xl border bg-white/95 p-3 shadow-xl backdrop-blur md:col-span-2"><p className="text-sm text-slate-500">{saveState === "unsaved" ? "You have changes that are not saved yet." : "Your website information is up to date."}</p><button className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"><Save size={17} /> Save information</button></div>
      </form>}

      {mode === "design" && <form onSubmit={saveDesign} onChange={() => setSaveState("unsaved")} className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-6"><div className="rounded-2xl border bg-white p-6"><h2 className="text-2xl font-semibold">Choose template</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{themes.map((theme) => <button type="button" key={theme.id} onClick={() => applyTheme(theme)} className={`rounded-xl border p-4 text-left hover:border-slate-400 ${restaurant.theme_id === theme.id ? "ring-2 ring-slate-900" : ""}`}><div className="flex gap-1">{[theme.primary_color, theme.secondary_color, theme.background_color].map((color) => <span key={color} className="h-6 w-6 rounded-full border" style={{ background: color }} />)}</div><p className="mt-3 font-semibold">{theme.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{theme.description}</p></button>)}</div></div>
          <div className="grid gap-4 rounded-2xl border bg-white p-6 sm:grid-cols-2"><h2 className="text-2xl font-semibold sm:col-span-2">Manual customization</h2><input type="hidden" name="theme_id" value={restaurant.theme_id || ""} />{[["primary_color","Main color",primary],["secondary_color","Secondary color",secondary],["background_color","Background",background],["text_color","Text color",text]].map(([name,label,fallback]) => <label key={name} className="text-sm font-medium">{label}<div className="mt-2 flex gap-2"><input type="color" className="h-11 w-14 rounded border p-1" value={String(restaurant[name as keyof Restaurant] || fallback)} onChange={(e) => setRestaurant({ ...restaurant, [name]: e.target.value })} /><input className="w-full rounded-xl border px-3" name={name} value={String(restaurant[name as keyof Restaurant] || fallback)} onChange={(e) => setRestaurant({ ...restaurant, [name]: e.target.value })} /></div></label>)}
            <label className="text-sm font-medium">Font<select className={field} name="font_family" value={restaurant.font_family} onChange={(e) => setRestaurant({ ...restaurant, font_family: e.target.value })}><option>Cormorant Garamond</option><option>Inter</option><option>Georgia</option><option>Arial</option></select></label><label className="text-sm font-medium">Buttons<select className={field} name="button_style" value={restaurant.button_style} onChange={(e) => setRestaurant({ ...restaurant, button_style: e.target.value })}><option value="pill">Rounded pill</option><option value="soft">Soft rounded</option><option value="square">Square</option><option value="bold">Large bold</option></select></label>
            {[["homepage_style","Homepage"],["menu_style","Menu"],["gallery_style","Gallery"]].map(([name,label]) => <label key={name} className="text-sm font-medium">{label} style<input className={field} name={name} value={String(restaurant[name as keyof Restaurant] || "")} onChange={(e) => setRestaurant({ ...restaurant, [name]: e.target.value })} /></label>)}
            <button className="sticky bottom-4 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white shadow-xl sm:col-span-2">Save and publish design</button></div>
        </div>
        <div className="xl:sticky xl:top-24 xl:h-fit"><p className="mb-3 text-sm font-semibold text-slate-500">LIVE PREVIEW</p><div className="overflow-hidden rounded-2xl border shadow-xl" style={{ background, color: text, fontFamily: restaurant.font_family || undefined }}><div className="relative min-h-[560px] bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg, ${text}dd, transparent), url(${restaurant.hero_image})` }}><div className="p-7"><div className="flex justify-between"><b>{restaurant.name}</b><span className="text-sm">Menu · Gallery · Contact</span></div><div className="mt-28 max-w-md"><p className="text-xs font-bold uppercase tracking-[.25em]" style={{ color: secondary }}>{restaurant.city || "Your city"}</p><h3 className="mt-3 text-5xl font-semibold">{restaurant.tagline || restaurant.name}</h3><p className="mt-4 text-sm leading-6 opacity-80">{restaurant.description}</p><button type="button" className={`mt-6 px-6 py-3 font-semibold text-white ${restaurant.button_style === "square" ? "" : restaurant.button_style === "soft" ? "rounded-xl" : "rounded-full"}`} style={{ background: primary }}>View menu</button></div></div></div></div></div>
      </form>}

      {mode === "menu" && <div className="space-y-6"><form onSubmit={addCategory} className="grid gap-3 rounded-2xl border bg-white p-6 md:grid-cols-[1fr_1.5fr_auto]"><input className="rounded-xl border px-4 py-3" name="name" placeholder="New category" required /><input className="rounded-xl border px-4 py-3" name="description" placeholder="Description" /><button className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"><Plus className="inline" size={16} /> Add category</button></form>
        <form onSubmit={addItem} className="grid gap-4 rounded-2xl border bg-white p-6 md:grid-cols-2"><h2 className="text-2xl font-semibold md:col-span-2">Add menu item</h2><select className="rounded-xl border px-4 py-3" name="category_id" required><option value="">Choose category</option>{restaurant.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input className="rounded-xl border px-4 py-3" name="name" placeholder="Item name" required /><input className="rounded-xl border px-4 py-3" name="price" type="number" step=".01" min="0" placeholder="Price" required /><input className="rounded-xl border px-4 py-3" name="allergens" placeholder="Allergens" /><input className="rounded-xl border px-4 py-3 md:col-span-2" name="image_url" placeholder="Food image URL (or upload under Images)" /><textarea className="rounded-xl border px-4 py-3 md:col-span-2" name="description" placeholder="Description" /><div className="flex flex-wrap gap-5 text-sm md:col-span-2">{["is_vegan","is_vegetarian","is_halal"].map((name) => <label key={name} className="flex gap-2 capitalize"><input type="checkbox" name={name} />{name.replace("is_","")}</label>)}</div><button className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white md:col-span-2">Add menu item</button></form>
        {restaurant.categories.map((category) => <section key={category.id} className="rounded-2xl border bg-white p-6"><div className="flex justify-between"><div><h2 className="text-2xl font-semibold">{category.name}</h2><p className="text-sm text-slate-500">{category.description}</p></div><button onClick={() => deleteCategory(category.id)} className="text-red-600"><Trash2 size={18} /></button></div><div className="mt-4 divide-y">{category.items.map((item) => <div key={item.id} className="flex items-start justify-between gap-4 py-4"><div><p className="font-semibold">{item.name} · €{Number(item.price).toFixed(2)}</p><p className="mt-1 text-sm text-slate-500">{item.description}</p><p className="mt-1 text-xs text-slate-400">{[item.is_vegan && "Vegan", item.is_vegetarian && "Vegetarian", item.is_halal && "Halal", item.allergens && `Allergens: ${item.allergens}`].filter(Boolean).join(" · ")}</p></div><div className="flex gap-2"><button onClick={() => editItem(item)} className="rounded-lg border px-3 py-2 text-xs font-semibold">Edit</button><button onClick={() => deleteItem(item.id)} className="rounded-lg border p-2 text-red-600"><Trash2 size={15} /></button></div></div>)}</div></section>)}</div>}

      {mode === "images" && <div className="space-y-6"><form onSubmit={uploadImage} className="rounded-2xl border-2 border-dashed bg-white p-8 text-center"><Upload className="mx-auto text-orange-600" /><h2 className="mt-3 text-xl font-semibold">Upload restaurant image</h2><div className="mx-auto mt-5 grid max-w-xl gap-3 sm:grid-cols-2"><input name="file" type="file" accept="image/*" required className="rounded-xl border p-3 text-sm" /><select name="image_type" className="rounded-xl border px-4"><option value="gallery">Gallery photo</option><option value="hero">Hero image</option><option value="logo">Logo</option><option value="food">Food photo</option></select><input name="alt_text" placeholder="Image description" className="rounded-xl border px-4 py-3 sm:col-span-2" /></div><button className="mt-4 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white">Upload image</button></form><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{restaurant.images.map((image) => <article key={image.id} className="overflow-hidden rounded-2xl border bg-white"><img src={image.url} alt={image.alt_text || restaurant.name} className="h-48 w-full object-cover" /><div className="flex items-center justify-between p-4"><div><p className="font-semibold capitalize">{image.image_type}</p><p className="text-xs text-slate-500">{image.alt_text || "No description"}</p></div><button onClick={() => deleteImage(image.id)} className="text-red-600"><Trash2 size={18} /></button></div></article>)}</div></div>}

      {mode === "chatbot" && <div className="space-y-6"><div className="rounded-2xl border bg-white p-6"><h2 className="text-2xl font-semibold">AI knowledge base</h2><p className="mt-2 text-sm text-slate-500">Profile, opening hours and menu are synchronized automatically. Add PDF/TXT files for policies, catering or detailed allergen information.</p><form onSubmit={uploadDocument} className="mt-5 flex flex-wrap gap-3"><input className="rounded-xl border p-3 text-sm" name="file" type="file" accept=".pdf,.txt" required /><button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Process document</button></form><div className="mt-5 divide-y">{documents.map((doc) => <div key={doc.id} className="flex justify-between py-3 text-sm"><span>{doc.filename}</span><span className="text-green-700">{doc.status}</span></div>)}</div></div>
        <div className="rounded-2xl border bg-white p-6"><h2 className="text-2xl font-semibold">Customer questions</h2><div className="mt-5 space-y-4">{conversations.length === 0 && <p className="text-sm text-slate-500">No conversations yet.</p>}{conversations.map((conversation) => <article key={conversation.id} className="rounded-xl border p-4"><p className="text-xs text-slate-400">{new Date(conversation.created_at).toLocaleString()}</p><div className="mt-3 space-y-2">{conversation.messages.map((message, index) => <p key={message.id || index} className={`text-sm ${message.is_unanswered ? "rounded-lg bg-red-50 p-2 text-red-800" : ""}`}><b className="capitalize">{message.role}:</b> {message.content}</p>)}</div></article>)}</div></div></div>}

      {mode === "reservations" && <div className="rounded-2xl border bg-white p-6"><h2 className="text-2xl font-semibold">Reservations & contact requests</h2><div className="mt-5 space-y-4">{reservations.length === 0 && <p className="text-sm text-slate-500">No reservation requests yet.</p>}{reservations.map((reservation) => <article key={reservation.id} className="grid gap-4 rounded-xl border p-4 md:grid-cols-[1fr_auto]"><div><p className="font-semibold">{reservation.name} · {reservation.party_size || "?"} guests</p><p className="mt-1 text-sm text-slate-500">{reservation.requested_at || "No requested time"} · {reservation.email} · {reservation.phone}</p>{reservation.message && <p className="mt-3 text-sm">{reservation.message}</p>}</div><select value={reservation.status} onChange={(e) => reservationStatus(reservation.id, e.target.value)} className="h-fit rounded-lg border px-3 py-2 text-sm"><option value="new">New</option><option value="confirmed">Confirmed</option><option value="declined">Declined</option><option value="completed">Completed</option></select></article>)}</div></div>}
    </AdminShell>
  );
}
