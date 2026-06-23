"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import { adminRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Restaurant, Theme, User } from "@/lib/types";

const input = "mt-2 w-full rounded-xl border border-slate-200 px-4 py-3";

export default function NewRestaurantPage() {
  const router = useRouter();
  const [owners, setOwners] = useState<User[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { Promise.all([adminRequest<User[]>("/admin/users", getToken()), adminRequest<Theme[]>("/admin/themes", getToken())]).then(([u, t]) => { setOwners(u.filter((x) => x.role === "RESTAURANT_OWNER")); setThemes(t); }); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const created = await adminRequest<Restaurant>("/admin/restaurants", getToken(), { method: "POST", body: JSON.stringify({ name: data.name, slug: data.slug, email: data.email, city: data.city, owner_id: data.owner_id ? Number(data.owner_id) : null, theme_id: data.theme_id ? Number(data.theme_id) : null, opening_hours: "{}", tagline: "", description: "", story: "", address: "", postal_code: "", phone: "", google_maps_url: "", facebook_url: "", instagram_url: "", tiktok_url: "", logo_url: "", hero_image: "", reservation_url: "", primary_color: "", secondary_color: "", background_color: "", text_color: "", font_family: "", button_style: "", homepage_style: "", menu_style: "", gallery_style: "", is_published: true }) });
      router.push(`/admin/restaurants/${created.id}/edit`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create restaurant"); }
  }
  return <AdminShell><div className="mx-auto max-w-3xl"><p className="text-sm font-semibold text-orange-600">New customer</p><h1 className="mt-1 text-4xl font-semibold">Create a restaurant</h1><p className="mt-2 text-slate-500">Start with the essentials. Everything else can be edited visually afterward.</p><form onSubmit={submit} className="mt-8 grid gap-5 rounded-2xl border bg-white p-7 sm:grid-cols-2">
    <label className="text-sm font-medium">Restaurant name<input name="name" required className={input} placeholder="Pizza Roma" /></label>
    <label className="text-sm font-medium">Website slug<input name="slug" required className={input} placeholder="pizza-roma" /></label>
    <label className="text-sm font-medium">Contact email<input name="email" type="email" required className={input} placeholder="hello@restaurant.com" /></label>
    <label className="text-sm font-medium">City<input name="city" className={input} placeholder="Berlin" /></label>
    <label className="text-sm font-medium">Restaurant owner<select name="owner_id" className={input}><option value="">Assign later</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name || owner.email}</option>)}</select></label>
    <label className="text-sm font-medium">Starting template<select name="theme_id" className={input}><option value="">Choose later</option>{themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></label>
    {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}<button className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white sm:col-span-2">Create and open editor</button>
  </form></div></AdminShell>;
}
