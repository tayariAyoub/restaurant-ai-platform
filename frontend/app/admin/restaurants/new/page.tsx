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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([adminRequest<User[]>("/admin/users", getToken()), adminRequest<Theme[]>("/admin/themes", getToken())])
      .then(([users, themeData]) => {
        setOwners(users.filter((user) => user.role === "RESTAURANT_OWNER"));
        setThemes(themeData);
      });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const created = await adminRequest<Restaurant>("/admin/restaurants", getToken(), {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          slug: data.slug,
          email: data.email,
          city: data.city,
          owner_id: data.owner_id ? Number(data.owner_id) : null,
          theme_id: data.theme_id ? Number(data.theme_id) : null,
          opening_hours: "{}",
          tagline: "",
          description: "",
          story: "",
          address: "",
          postal_code: "",
          phone: "",
          google_maps_url: "",
          facebook_url: "",
          instagram_url: "",
          tiktok_url: "",
          logo_url: "",
          hero_image: "",
          reservation_url: "",
          primary_color: "",
          secondary_color: "",
          background_color: "",
          text_color: "",
          font_family: "",
          button_style: "",
          homepage_style: "",
          menu_style: "",
          gallery_style: "",
          is_published: true,
        }),
      });
      router.push(`/admin/restaurants/${created.id}/edit`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create restaurant.");
      setLoading(false);
    }
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold text-orange-600">New customer</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">Create a restaurant</h1>
        <p className="mt-2 max-w-2xl text-slate-500">Start with the essentials. The owner can finish branding, menu, photos, hours, and AI knowledge in the visual editor.</p>

        <form onSubmit={submit} className="mt-8 grid gap-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-7">
          <label className="text-sm font-medium">Restaurant name<input name="name" required className={input} placeholder="Pizza Roma" /></label>
          <label className="text-sm font-medium">Website slug<input name="slug" required className={input} placeholder="pizza-roma" /></label>
          <label className="text-sm font-medium">Contact email<input name="email" type="email" required className={input} placeholder="hello@restaurant.com" /></label>
          <label className="text-sm font-medium">City<input name="city" className={input} placeholder="Berlin" /></label>
          <label className="text-sm font-medium">Restaurant owner<select name="owner_id" className={input}><option value="">Assign later</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name || owner.email}</option>)}</select></label>
          <label className="text-sm font-medium">Starting template<select name="theme_id" className={input}><option value="">Choose later</option>{themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></label>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
          <button disabled={loading} className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white shadow-lg disabled:opacity-60 sm:col-span-2">
            {loading ? "Creating restaurant..." : "Create and open editor"}
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
