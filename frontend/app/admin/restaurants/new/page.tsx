"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Camera,
  Check,
  Clock3,
  Eye,
  Globe2,
  ImageIcon,
  Loader2,
  Palette,
  Plus,
  Rocket,
  Sparkles,
  Store,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/admin/AdminShell";
import { adminRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Category, MenuItem, Restaurant, Theme, User } from "@/lib/types";

const STORAGE_KEY = "restaurantai.onboarding.v1";
const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100";
const textareaClass = `${inputClass} min-h-28 resize-y`;
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type WizardStep = "welcome" | "info" | "brand" | "hours" | "menu" | "assistant" | "review" | "publish";
type WizardCategory = {
  id: string;
  name: string;
  description: string;
  dishes: WizardDish[];
};
type WizardDish = {
  id: string;
  name: string;
  description: string;
  price: string;
  is_vegan: boolean;
  is_vegetarian: boolean;
  is_halal: boolean;
  allergens: string;
};
type WizardData = {
  name: string;
  slug: string;
  cuisine: string;
  description: string;
  story: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postal_code: string;
  website: string;
  owner_id: string;
  theme_id: string;
  opening_hours: Record<string, { open: string; close: string; closed: boolean }>;
  categories: WizardCategory[];
  assistant: {
    welcome: string;
    languages: string;
    reservations: boolean;
    ordering: boolean;
  };
};

const steps: { key: WizardStep; label: string; icon: typeof Sparkles }[] = [
  { key: "welcome", label: "Welcome", icon: Sparkles },
  { key: "info", label: "Info", icon: Store },
  { key: "brand", label: "Brand", icon: Palette },
  { key: "hours", label: "Hours", icon: Clock3 },
  { key: "menu", label: "Menu", icon: UtensilsCrossed },
  { key: "assistant", label: "Assistant", icon: Bot },
  { key: "review", label: "Review", icon: Eye },
  { key: "publish", label: "Publish", icon: Rocket },
];

const defaultData: WizardData = {
  name: "",
  slug: "",
  cuisine: "",
  description: "",
  story: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  postal_code: "",
  website: "",
  owner_id: "",
  theme_id: "",
  opening_hours: Object.fromEntries(days.map((day) => [day, { open: "17:00", close: "22:00", closed: day === "Monday" }])) as WizardData["opening_hours"],
  categories: [
    {
      id: cryptoId(),
      name: "Signature dishes",
      description: "The dishes guests should notice first.",
      dishes: [
        {
          id: cryptoId(),
          name: "",
          description: "",
          price: "",
          is_vegan: false,
          is_vegetarian: false,
          is_halal: false,
          allergens: "",
        },
      ],
    },
  ],
  assistant: {
    welcome: "Welcome. Tell us your mood, allergies, occasion, or pickup timing and we will help you choose.",
    languages: "English, German",
    reservations: true,
    ordering: true,
  },
};

export default function NewRestaurantPage() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [owners, setOwners] = useState<User[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [data, setData] = useState<WizardData>(defaultData);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<Restaurant | null>(null);

  const activeStep = steps[activeIndex];
  const percent = Math.round(((activeIndex + 1) / steps.length) * 100);
  const selectedTheme = themes.find((theme) => String(theme.id) === data.theme_id) || null;
  const menuDishCount = data.categories.reduce((total, category) => total + category.dishes.filter((dish) => dish.name.trim()).length, 0);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setData({ ...defaultData, ...JSON.parse(saved) });
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    Promise.all([adminRequest<User[]>("/admin/users", getToken()), adminRequest<Theme[]>("/admin/themes", getToken())])
      .then(([users, themeData]) => {
        setOwners(users.filter((user) => user.role === "RESTAURANT_OWNER"));
        setThemes(themeData);
        if (themeData[0]) {
          setData((current) => current.theme_id ? current : { ...current, theme_id: String(themeData[0].id) });
        }
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load onboarding data."));
  }, []);

  useEffect(() => {
    if (!hydrated || created) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [created, data, hydrated]);

  const canContinue = useMemo(() => {
    if (activeStep.key === "info") return Boolean(data.name.trim() && data.email.trim() && data.city.trim());
    if (activeStep.key === "menu") return menuDishCount > 0;
    return true;
  }, [activeStep.key, data.city, data.email, data.name, menuDishCount]);

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((current) => ({ ...current, [key]: value }));
  }

  function updateInfo(key: keyof WizardData, value: string) {
    setData((current) => ({
      ...current,
      [key]: value,
      slug: key === "name" && !current.slug ? slugify(value) : current.slug,
    }));
  }

  function updateHours(day: string, patch: Partial<WizardData["opening_hours"][string]>) {
    setData((current) => ({
      ...current,
      opening_hours: {
        ...current.opening_hours,
        [day]: { ...current.opening_hours[day], ...patch },
      },
    }));
  }

  function addCategory() {
    setData((current) => ({
      ...current,
      categories: [
        ...current.categories,
        { id: cryptoId(), name: "", description: "", dishes: [emptyDish()] },
      ],
    }));
  }

  function updateCategory(id: string, patch: Partial<WizardCategory>) {
    setData((current) => ({
      ...current,
      categories: current.categories.map((category) => category.id === id ? { ...category, ...patch } : category),
    }));
  }

  function removeCategory(id: string) {
    setData((current) => ({
      ...current,
      categories: current.categories.filter((category) => category.id !== id),
    }));
  }

  function addDish(categoryId: string) {
    setData((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId ? { ...category, dishes: [...category.dishes, emptyDish()] } : category,
      ),
    }));
  }

  function updateDish(categoryId: string, dishId: string, patch: Partial<WizardDish>) {
    setData((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId
          ? { ...category, dishes: category.dishes.map((dish) => dish.id === dishId ? { ...dish, ...patch } : dish) }
          : category,
      ),
    }));
  }

  function removeDish(categoryId: string, dishId: string) {
    setData((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId ? { ...category, dishes: category.dishes.filter((dish) => dish.id !== dishId) } : category,
      ),
    }));
  }

  async function publish(event?: FormEvent) {
    event?.preventDefault();
    if (loading || created) return;
    setError("");
    setLoading(true);
    try {
      const token = getToken();
      const theme = selectedTheme;
      const restaurant = await adminRequest<Restaurant>("/admin/restaurants", token, {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          slug: data.slug || slugify(data.name),
          tagline: data.cuisine ? `${data.cuisine} in ${data.city}` : "",
          description: data.description,
          story: data.story,
          address: data.address,
          city: data.city,
          postal_code: data.postal_code,
          phone: data.phone,
          email: data.email,
          google_maps_url: "",
          facebook_url: "",
          instagram_url: "",
          tiktok_url: "",
          opening_hours: JSON.stringify(
            Object.fromEntries(
              Object.entries(data.opening_hours).map(([day, value]) => [
                day.toLowerCase(),
                value.closed ? "Closed" : `${value.open}-${value.close}`,
              ]),
            ),
          ),
          logo_url: "",
          hero_image: "",
          reservation_url: data.website,
          owner_id: data.owner_id ? Number(data.owner_id) : null,
          theme_id: data.theme_id ? Number(data.theme_id) : null,
          primary_color: theme?.primary_color || "",
          secondary_color: theme?.secondary_color || "",
          background_color: theme?.background_color || "",
          text_color: theme?.text_color || "",
          font_family: theme?.font_family || "",
          button_style: theme?.button_style || "",
          homepage_style: theme?.homepage_style || "",
          menu_style: theme?.menu_style || "",
          gallery_style: theme?.gallery_style || "",
          is_published: true,
        }),
      });

      await uploadWizardImage(restaurant.id, logoFile, "logo", `${data.name} logo`, token);
      await uploadWizardImage(restaurant.id, heroFile, "hero", `${data.name} hero image`, token);
      await createMenu(restaurant.id, data.categories, token);
      await uploadAssistantNotes(restaurant.id, data, token);
      window.localStorage.removeItem(STORAGE_KEY);
      setCreated(restaurant);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not publish the restaurant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl lg:sticky lg:top-6 lg:h-fit">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">Restaurant launch</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">Publish a premium website in minutes.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">A guided setup for owners who want the site live without learning the dashboard first.</p>
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>{percent}% complete</span>
                <span>{activeIndex + 1} of {steps.length}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${percent}%` }} />
              </div>
            </div>
            <nav className="mt-6 space-y-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const active = index === activeIndex;
                const done = index < activeIndex || Boolean(created);
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition ${active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10"}`}
                  >
                    <span className={`grid h-8 w-8 place-items-center rounded-xl ${active ? "bg-slate-950 text-white" : done ? "bg-green-500 text-white" : "bg-white/10"}`}>
                      {done ? <Check size={16} /> : <Icon size={16} />}
                    </span>
                    {step.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="min-w-0">
            <form onSubmit={publish} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              {activeStep.key === "welcome" && <WelcomeStep />}
              {activeStep.key === "info" && <InfoStep data={data} owners={owners} updateInfo={updateInfo} update={update} />}
              {activeStep.key === "brand" && (
                <BrandStep
                  data={data}
                  themes={themes}
                  selectedTheme={selectedTheme}
                  logoFile={logoFile}
                  heroFile={heroFile}
                  setLogoFile={setLogoFile}
                  setHeroFile={setHeroFile}
                  update={update}
                />
              )}
              {activeStep.key === "hours" && <HoursStep data={data} updateHours={updateHours} />}
              {activeStep.key === "menu" && (
                <MenuStep
                  data={data}
                  addCategory={addCategory}
                  updateCategory={updateCategory}
                  removeCategory={removeCategory}
                  addDish={addDish}
                  updateDish={updateDish}
                  removeDish={removeDish}
                />
              )}
              {activeStep.key === "assistant" && <AssistantStep data={data} update={update} />}
              {activeStep.key === "review" && <ReviewStep data={data} theme={selectedTheme} logoFile={logoFile} heroFile={heroFile} editStep={setActiveIndex} dishCount={menuDishCount} />}
              {activeStep.key === "publish" && <PublishStep created={created} data={data} loading={loading} publish={publish} />}

              {error && <p className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}

              {!created && (
                <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
                    disabled={activeIndex === 0 || loading}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold disabled:opacity-40"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  {activeStep.key === "publish" ? (
                    <button disabled={loading || !data.name || !data.email} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50">
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Rocket size={18} />}
                      {loading ? "Publishing..." : "Publish restaurant website"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canContinue || loading}
                      onClick={() => setActiveIndex((index) => Math.min(steps.length - 1, index + 1))}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50"
                    >
                      Continue <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              )}
            </form>
          </main>
        </div>
      </div>
    </AdminShell>
  );
}

function WelcomeStep() {
  return (
    <section>
      <StepHeader
        eyebrow="Step 1"
        title="In a few minutes your restaurant website will be ready."
        description="This wizard collects only what matters for a polished first launch: identity, food, hours, images, and guest guidance."
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <PromiseCard icon={Store} title="No technical setup" description="Plain-language questions replace dashboard hunting." />
        <PromiseCard icon={Palette} title="Premium by default" description="Themes, spacing, and preview cues keep the site owner-ready." />
        <PromiseCard icon={Rocket} title="Launch path" description="Review everything, publish, then continue in the dashboard if needed." />
      </div>
    </section>
  );
}

function InfoStep({
  data,
  owners,
  updateInfo,
  update,
}: {
  data: WizardData;
  owners: User[];
  updateInfo: (key: keyof WizardData, value: string) => void;
  update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
}) {
  return (
    <section>
      <StepHeader eyebrow="Step 2" title="Restaurant information" description="Start with the details guests need to trust the restaurant and find it quickly." />
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field label="Restaurant name" required><input className={inputClass} value={data.name} onChange={(event) => updateInfo("name", event.target.value)} placeholder="Bella Napoli" /></Field>
        <Field label="Website slug"><input className={inputClass} value={data.slug} onChange={(event) => updateInfo("slug", slugify(event.target.value))} placeholder="bella-napoli" /></Field>
        <Field label="Cuisine"><input className={inputClass} value={data.cuisine} onChange={(event) => updateInfo("cuisine", event.target.value)} placeholder="Italian, sushi, vegan, cafe..." /></Field>
        <Field label="Email" required><input className={inputClass} type="email" value={data.email} onChange={(event) => updateInfo("email", event.target.value)} placeholder="hello@restaurant.com" /></Field>
        <Field label="Phone"><input className={inputClass} type="tel" value={data.phone} onChange={(event) => updateInfo("phone", event.target.value)} placeholder="+49 30 123456" /></Field>
        <Field label="City" required><input className={inputClass} value={data.city} onChange={(event) => updateInfo("city", event.target.value)} placeholder="Berlin" /></Field>
        <Field label="Street address"><input className={inputClass} value={data.address} onChange={(event) => updateInfo("address", event.target.value)} placeholder="Sonnenallee 42" /></Field>
        <Field label="Postal code"><input className={inputClass} value={data.postal_code} onChange={(event) => updateInfo("postal_code", event.target.value)} placeholder="12045" /></Field>
        <Field label="Website or booking link"><input className={inputClass} value={data.website} onChange={(event) => updateInfo("website", event.target.value)} placeholder="https://..." /></Field>
        {owners.length > 0 && (
          <Field label="Restaurant owner">
            <select className={inputClass} value={data.owner_id} onChange={(event) => update("owner_id", event.target.value)}>
              <option value="">Assign later</option>
              {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name || owner.email}</option>)}
            </select>
          </Field>
        )}
        <Field label="Short description"><textarea className={textareaClass} value={data.description} onChange={(event) => updateInfo("description", event.target.value)} placeholder="A warm neighborhood pizzeria serving slow-fermented dough and Italian classics." /></Field>
        <Field label="Chef or restaurant story"><textarea className={textareaClass} value={data.story} onChange={(event) => updateInfo("story", event.target.value)} placeholder="Tell guests what makes the kitchen memorable." /></Field>
      </div>
    </section>
  );
}

function BrandStep({
  data,
  themes,
  selectedTheme,
  logoFile,
  heroFile,
  setLogoFile,
  setHeroFile,
  update,
}: {
  data: WizardData;
  themes: Theme[];
  selectedTheme: Theme | null;
  logoFile: File | null;
  heroFile: File | null;
  setLogoFile: (file: File | null) => void;
  setHeroFile: (file: File | null) => void;
  update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
}) {
  return (
    <section>
      <StepHeader eyebrow="Step 3" title="Brand and first impression" description="Choose a visual direction and add the two images that make the restaurant feel real." />
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <UploadBox icon={ImageIcon} label="Logo" file={logoFile} onChange={setLogoFile} />
            <UploadBox icon={Camera} label="Hero image" file={heroFile} onChange={setHeroFile} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Theme</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {themes.map((theme) => (
                <button
                  type="button"
                  key={theme.id}
                  onClick={() => update("theme_id", String(theme.id))}
                  className={`rounded-2xl border p-4 text-left transition hover:border-slate-400 ${data.theme_id === String(theme.id) ? "border-slate-950 ring-4 ring-slate-100" : "border-slate-200"}`}
                >
                  <div className="flex gap-2">
                    {[theme.primary_color, theme.secondary_color, theme.background_color].map((color) => <span key={color} className="h-7 w-7 rounded-full border" style={{ backgroundColor: color }} />)}
                  </div>
                  <p className="mt-4 font-semibold">{friendlyThemeName(theme)}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{theme.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <PreviewCard data={data} theme={selectedTheme} heroFile={heroFile} logoFile={logoFile} />
      </div>
    </section>
  );
}

function HoursStep({ data, updateHours }: { data: WizardData; updateHours: (day: string, patch: Partial<WizardData["opening_hours"][string]>) => void }) {
  return (
    <section>
      <StepHeader eyebrow="Step 4" title="Opening hours" description="Keep this simple. Owners can refine special days later." />
      <div className="mt-8 divide-y rounded-2xl border border-slate-200">
        {days.map((day) => {
          const value = data.opening_hours[day];
          return (
            <div key={day} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
              <p className="font-semibold">{day}</p>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <input type="checkbox" checked={value.closed} onChange={(event) => updateHours(day, { closed: event.target.checked })} />
                Closed
              </label>
              <input aria-label={`${day} open`} disabled={value.closed} className={inputClass} type="time" value={value.open} onChange={(event) => updateHours(day, { open: event.target.value })} />
              <input aria-label={`${day} close`} disabled={value.closed} className={inputClass} type="time" value={value.close} onChange={(event) => updateHours(day, { close: event.target.value })} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MenuStep({
  data,
  addCategory,
  updateCategory,
  removeCategory,
  addDish,
  updateDish,
  removeDish,
}: {
  data: WizardData;
  addCategory: () => void;
  updateCategory: (id: string, patch: Partial<WizardCategory>) => void;
  removeCategory: (id: string) => void;
  addDish: (categoryId: string) => void;
  updateDish: (categoryId: string, dishId: string, patch: Partial<WizardDish>) => void;
  removeDish: (categoryId: string, dishId: string) => void;
}) {
  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <StepHeader eyebrow="Step 5" title="Menu starter" description="Add enough of the menu for a credible launch. Full menu editing remains available later." />
        <button type="button" onClick={addCategory} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"><Plus size={16} /> Category</button>
      </div>
      <div className="mt-8 space-y-5">
        {data.categories.map((category, categoryIndex) => (
          <div key={category.id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input className={inputClass} value={category.name} onChange={(event) => updateCategory(category.id, { name: event.target.value })} placeholder={`Category ${categoryIndex + 1}, e.g. Starters`} />
              <input className={inputClass} value={category.description} onChange={(event) => updateCategory(category.id, { description: event.target.value })} placeholder="Short category description" />
              <button type="button" onClick={() => removeCategory(category.id)} className="grid h-12 w-12 place-items-center rounded-xl text-red-600" aria-label={`Remove ${category.name || "category"}`}><Trash2 size={17} /></button>
            </div>
            <div className="mt-4 space-y-3">
              {category.dishes.map((dish) => (
                <div key={dish.id} className="grid gap-3 rounded-xl bg-slate-50 p-3 lg:grid-cols-[1fr_1.3fr_110px_auto]">
                  <input className={inputClass} value={dish.name} onChange={(event) => updateDish(category.id, dish.id, { name: event.target.value })} placeholder="Dish name" />
                  <input className={inputClass} value={dish.description} onChange={(event) => updateDish(category.id, dish.id, { description: event.target.value })} placeholder="Description" />
                  <input className={inputClass} value={dish.price} onChange={(event) => updateDish(category.id, dish.id, { price: event.target.value })} placeholder="14.50" inputMode="decimal" />
                  <button type="button" onClick={() => removeDish(category.id, dish.id)} className="grid h-12 w-12 place-items-center rounded-xl text-red-600" aria-label={`Remove ${dish.name || "dish"}`}><Trash2 size={17} /></button>
                  <div className="flex flex-wrap gap-2 lg:col-span-4">
                    <TagToggle label="Vegetarian" checked={dish.is_vegetarian} onChange={(checked) => updateDish(category.id, dish.id, { is_vegetarian: checked })} />
                    <TagToggle label="Vegan" checked={dish.is_vegan} onChange={(checked) => updateDish(category.id, dish.id, { is_vegan: checked, is_vegetarian: checked || dish.is_vegetarian })} />
                    <TagToggle label="Halal" checked={dish.is_halal} onChange={(checked) => updateDish(category.id, dish.id, { is_halal: checked })} />
                    <input className="min-h-10 flex-1 rounded-full border border-slate-200 bg-white px-4 text-sm" value={dish.allergens} onChange={(event) => updateDish(category.id, dish.id, { allergens: event.target.value })} placeholder="Allergens, e.g. Gluten, Milk" />
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => addDish(category.id)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold shadow-sm ring-1 ring-slate-200"><Plus size={16} /> Add dish</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function AssistantStep({ data, update }: { data: WizardData; update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void }) {
  return (
    <section>
      <StepHeader eyebrow="Step 6" title="Menu guide" description="Simple guest-facing guidance. No technical AI settings are exposed to the owner." />
      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Field label="Welcome message">
            <textarea className={textareaClass} value={data.assistant.welcome} onChange={(event) => update("assistant", { ...data.assistant, welcome: event.target.value })} />
          </Field>
          <Field label="Languages">
            <input className={inputClass} value={data.assistant.languages} onChange={(event) => update("assistant", { ...data.assistant, languages: event.target.value })} placeholder="English, German" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleCard title="Reservation support" description="Guests can ask about table requests." checked={data.assistant.reservations} onChange={(checked) => update("assistant", { ...data.assistant, reservations: checked })} />
            <ToggleCard title="Order support" description="Guests can ask for pickup or order help." checked={data.assistant.ordering} onChange={(checked) => update("assistant", { ...data.assistant, ordering: checked })} />
          </div>
        </div>
        <div className="rounded-2xl bg-slate-950 p-5 text-white">
          <Bot className="text-orange-300" />
          <p className="mt-4 text-lg font-semibold">{data.name || "Your restaurant"} menu guide</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{data.assistant.welcome}</p>
          <div className="mt-4 rounded-xl bg-white/10 p-3 text-xs text-slate-300">Uses the restaurant description, hours, menu, allergens, and launch notes created in this wizard.</div>
        </div>
      </div>
    </section>
  );
}

function ReviewStep({ data, theme, logoFile, heroFile, editStep, dishCount }: { data: WizardData; theme: Theme | null; logoFile: File | null; heroFile: File | null; editStep: (index: number) => void; dishCount: number }) {
  const rows = [
    ["Restaurant", `${data.name || "Missing"} / ${data.cuisine || "Cuisine missing"}`, 1],
    ["Contact", `${data.phone || "Phone missing"} / ${data.email || "Email missing"}`, 1],
    ["Brand", `${theme ? friendlyThemeName(theme) : "Theme missing"} / ${logoFile ? "Logo ready" : "No logo"} / ${heroFile ? "Hero ready" : "No hero"}`, 2],
    ["Hours", "Weekly schedule ready", 3],
    ["Menu", `${dishCount} dishes ready`, 4],
    ["Assistant", `${data.assistant.languages || "Languages missing"} / ${data.assistant.reservations ? "reservations" : "no reservations"} / ${data.assistant.ordering ? "orders" : "no orders"}`, 5],
  ] as const;
  return (
    <section>
      <StepHeader eyebrow="Step 7" title="Review before launch" description="Everything below can be edited before publishing." />
      <div className="mt-8 divide-y rounded-2xl border border-slate-200">
        {rows.map(([label, value, index]) => (
          <div key={label} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="mt-1 font-semibold">{value}</p>
            </div>
            <button type="button" onClick={() => editStep(index)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Edit</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function PublishStep({ created, data, loading, publish }: { created: Restaurant | null; data: WizardData; loading: boolean; publish: () => void }) {
  if (created) {
    return (
      <section className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-green-600 text-white"><Check size={30} /></div>
        <h2 className="mt-6 text-4xl font-semibold tracking-tight">Your restaurant website is live.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-500">The public site has been published. You can preview it now or continue refining photos, menu, and operations in the dashboard.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/restaurants/${created.slug}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"><Globe2 size={17} /> Preview website</Link>
          <Link href={`/admin/restaurants/${created.id}/edit`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-semibold"><Store size={17} /> Open dashboard</Link>
        </div>
      </section>
    );
  }
  return (
    <section>
      <StepHeader eyebrow="Step 8" title="Publish" description="Create the restaurant, upload the launch images, add the starter menu, and prepare assistant knowledge." />
      <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50 p-6">
        <p className="text-lg font-semibold text-orange-950">{data.name || "This restaurant"} is ready for first launch.</p>
        <p className="mt-2 text-sm leading-6 text-orange-900">Publishing keeps the current dashboard intact and creates a normal restaurant record that can be edited later.</p>
        <button type="button" disabled={loading || !data.name || !data.email} onClick={publish} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 font-bold text-white shadow-lg disabled:opacity-50">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Rocket size={18} />}
          {loading ? "Publishing..." : "Publish now"}
        </button>
      </div>
    </section>
  );
}

function StepHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-600">{eyebrow}</p>
      <h2 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-800">
      {label} {required && <span className="text-orange-600">*</span>}
      {children}
    </label>
  );
}

function PromiseCard({ icon: Icon, title, description }: { icon: typeof Sparkles; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <Icon className="text-orange-600" />
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function UploadBox({ icon: Icon, label, file, onChange }: { icon: typeof ImageIcon; label: string; file: File | null; onChange: (file: File | null) => void }) {
  return (
    <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-slate-500">
      <Icon className="text-slate-500" />
      <span className="mt-3 font-semibold">{label}</span>
      <span className="mt-1 text-xs text-slate-500">{file ? file.name : "JPG, PNG, WEBP, or GIF"}</span>
      <input type="file" accept="image/*" className="sr-only" onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.files?.[0] || null)} />
    </label>
  );
}

function PreviewCard({ data, theme, heroFile, logoFile }: { data: WizardData; theme: Theme | null; heroFile: File | null; logoFile: File | null }) {
  const heroUrl = useObjectUrl(heroFile);
  const logoUrl = useObjectUrl(logoFile);
  const primary = theme?.primary_color || "#c84b31";
  const background = theme?.background_color || "#f7f3ea";
  const text = theme?.text_color || "#111827";
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 shadow-lg" style={{ backgroundColor: background, color: text }}>
      <div className="relative min-h-56 bg-cover bg-center p-5 text-white" style={{ backgroundImage: heroUrl ? `linear-gradient(90deg, rgba(0,0,0,.72), rgba(0,0,0,.18)), url(${heroUrl})` : "linear-gradient(135deg, #171511, #3b251f)" }}>
        {logoUrl && <img src={logoUrl} alt="" className="h-12 w-12 rounded-full border border-white/40 object-cover" />}
        <p className="mt-16 text-xs font-bold uppercase tracking-[0.24em] text-white/70">{data.city || "Your city"} / {data.cuisine || "Cuisine"}</p>
        <p className="mt-2 text-3xl font-semibold leading-tight">{data.name || "Restaurant name"}</p>
      </div>
      <div className="p-5">
        <p className="text-sm leading-6 opacity-70">{data.description || "Your restaurant description will appear here."}</p>
        <button type="button" className="mt-5 rounded-full px-5 py-3 text-sm font-semibold text-white" style={{ backgroundColor: primary }}>Reserve a table</button>
      </div>
    </div>
  );
}

function TagToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className={`flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-bold uppercase tracking-wider ${checked ? "border-green-700 bg-green-50 text-green-800" : "border-slate-200 bg-white text-slate-500"}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function ToggleCard({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className={`block rounded-2xl border p-5 ${checked ? "border-slate-950 ring-4 ring-slate-100" : "border-slate-200"}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="ml-2 font-semibold">{title}</span>
      <span className="mt-2 block text-sm leading-6 text-slate-500">{description}</span>
    </label>
  );
}

async function uploadWizardImage(restaurantId: number, file: File | null, imageType: "logo" | "hero", altText: string, token: string) {
  if (!file) return;
  const form = new FormData();
  form.append("file", file);
  form.append("image_type", imageType);
  form.append("alt_text", altText);
  await adminRequest(`/admin/restaurants/${restaurantId}/images`, token, { method: "POST", body: form });
}

async function createMenu(restaurantId: number, categories: WizardCategory[], token: string) {
  for (const [index, category] of categories.entries()) {
    if (!category.name.trim()) continue;
    const created = await adminRequest<Category>(`/admin/restaurants/${restaurantId}/categories`, token, {
      method: "POST",
      body: JSON.stringify({ name: category.name, description: category.description, sort_order: index }),
    });
    for (const dish of category.dishes) {
      if (!dish.name.trim()) continue;
      await adminRequest<MenuItem>(`/admin/restaurants/${restaurantId}/menu-items`, token, {
        method: "POST",
        body: JSON.stringify({
          category_id: created.id,
          name: dish.name,
          description: dish.description,
          price: Number(dish.price || 0),
          image_url: "",
          is_available: true,
          is_vegan: dish.is_vegan,
          is_vegetarian: dish.is_vegetarian || dish.is_vegan,
          is_halal: dish.is_halal,
          allergens: dish.allergens,
        }),
      });
    }
  }
}

async function uploadAssistantNotes(restaurantId: number, data: WizardData, token: string) {
  const content = [
    `Assistant welcome message: ${data.assistant.welcome}`,
    `Languages: ${data.assistant.languages}`,
    `Reservation support: ${data.assistant.reservations ? "yes" : "no"}`,
    `Order support: ${data.assistant.ordering ? "yes" : "no"}`,
    `Cuisine: ${data.cuisine}`,
    `Restaurant story: ${data.story}`,
  ].join("\n");
  const form = new FormData();
  form.append("file", new File([content], "onboarding-assistant-notes.txt", { type: "text/plain" }));
  await adminRequest(`/admin/restaurants/${restaurantId}/documents`, token, { method: "POST", body: form });
}

function emptyDish(): WizardDish {
  return { id: cryptoId(), name: "", description: "", price: "", is_vegan: false, is_vegetarian: false, is_halal: false, allergens: "" };
}

function cryptoId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function friendlyThemeName(theme: Theme) {
  const key = `${theme.key} ${theme.name}`.toLowerCase();
  if (key.includes("ultraviolet") || key.includes("cinematic") || key.includes("immersive")) return "Ultraviolet Luxury";
  if (key.includes("michelin") || key.includes("elegant")) return "Michelin";
  if (key.includes("italian") || key.includes("mediterranean")) return "Italian";
  if (key.includes("sushi") || key.includes("japanese")) return "Sushi";
  if (key.includes("vegan") || key.includes("natural")) return "Vegan";
  if (key.includes("cafe") || key.includes("coffee")) return "Cafe";
  return theme.name;
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) {
      setUrl("");
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}
