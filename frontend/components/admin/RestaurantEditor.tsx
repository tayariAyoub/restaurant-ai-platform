"use client";

import {
  Bot,
  Camera,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
  type LucideIcon,
  Leaf,
  Palette,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, type InputHTMLAttributes, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { adminRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type {
  ContactRequest,
  Conversation,
  MenuItem,
  Restaurant,
  RestaurantImage,
  RestaurantOverview,
  Theme,
  User,
} from "@/lib/types";
import AdminShell from "./AdminShell";
import RestaurantNav from "./RestaurantNav";
import SetupProgress from "./SetupProgress";

type Mode = "edit" | "design" | "menu" | "images" | "chatbot" | "reservations";
type Document = { id: number; filename: string; status: string; created_at: string };

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm";
const textareaClass = `${inputClass} min-h-28`;
const cardClass = "rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6";

function restaurantPayload(restaurant: Restaurant) {
  const { id, owner, theme, categories, images, created_at, ...payload } = restaurant;
  return payload;
}

function money(value: string | number) {
  return `EUR ${Number(value).toFixed(2)}`;
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
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
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
    if (mode === "chatbot") {
      Promise.all([
        adminRequest<Document[]>(`/admin/restaurants/${id}/documents`, getToken()),
        adminRequest<Conversation[]>(`/admin/restaurants/${id}/conversations`, getToken()),
      ]).then(([documentData, conversationData]) => {
        setDocuments(documentData);
        setConversations(conversationData);
      });
    }
    if (mode === "reservations") {
      adminRequest<ContactRequest[]>(`/admin/restaurants/${id}/reservations`, getToken()).then(setReservations);
    }
  }, [id, mode]);

  const hours = useMemo(() => {
    try {
      return JSON.parse(restaurant?.opening_hours || "{}") as Record<string, string>;
    } catch {
      return {};
    }
  }, [restaurant]);

  async function update(payload: Partial<Restaurant>, message = "Changes saved.") {
    if (!restaurant) return;
    setSaveState("saving");
    setStatus("");
    try {
      const updated = await adminRequest<Restaurant>(`/admin/restaurants/${id}`, token, {
        method: "PUT",
        body: JSON.stringify({ ...restaurantPayload(restaurant), ...payload }),
      });
      setRestaurant(updated);
      setStatus(message);
      setSaveState("saved");
      const overviewData = await adminRequest<RestaurantOverview[]>("/admin/restaurants-overview", token);
      setOverview(overviewData.find((item) => item.id === id) || null);
    } catch (error) {
      setSaveState("unsaved");
      setStatus(error instanceof Error ? error.message : "Could not save changes.");
    }
  }

  async function saveInfo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData);
    data.is_published = formData.has("is_published") ? "true" : "false";
    const opening_hours = JSON.stringify(
      Object.fromEntries(days.map((day) => [day, data[`hours_${day}`] || "Closed"])),
    );
    days.forEach((day) => delete data[`hours_${day}`]);
    await update({ ...data, owner_id: data.owner_id ? Number(data.owner_id) : null, opening_hours } as Partial<Restaurant>);
  }

  function applyTheme(theme: Theme) {
    if (!restaurant) return;
    setRestaurant({
      ...restaurant,
      theme_id: theme.id,
      theme,
      primary_color: theme.primary_color,
      secondary_color: theme.secondary_color,
      background_color: theme.background_color,
      text_color: theme.text_color,
      font_family: theme.font_family,
      button_style: theme.button_style,
      homepage_style: theme.homepage_style,
      menu_style: theme.menu_style,
      gallery_style: theme.gallery_style,
    });
    setSaveState("unsaved");
    setStatus(`${theme.name} selected. Review the preview, then save.`);
  }

  async function saveDesign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    await update({ ...data, theme_id: Number(data.theme_id) || null } as Partial<Restaurant>, "Design published.");
  }

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    await adminRequest(`/admin/restaurants/${id}/categories`, token, {
      method: "POST",
      body: JSON.stringify({ ...data, sort_order: restaurant?.categories.length || 0 }),
    });
    form.reset();
    setStatus("Category added.");
    load();
  }

  async function deleteCategory(categoryId: number) {
    if (!confirm("Delete category and all its items?")) return;
    await adminRequest(`/admin/restaurants/${id}/categories/${categoryId}`, token, { method: "DELETE" });
    setStatus("Category deleted.");
    load();
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await adminRequest(`/admin/restaurants/${id}/menu-items`, token, {
      method: "POST",
      body: JSON.stringify(menuItemPayload(data)),
    });
    form.reset();
    setStatus("Menu item added.");
    load();
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingItem) return;
    const data = new FormData(event.currentTarget);
    await adminRequest(`/admin/restaurants/${id}/menu-items/${editingItem.id}`, token, {
      method: "PUT",
      body: JSON.stringify(menuItemPayload(data)),
    });
    setEditingItem(null);
    setStatus("Menu item updated.");
    load();
  }

  function menuItemPayload(data: FormData) {
    return {
      category_id: Number(data.get("category_id")),
      name: data.get("name"),
      description: data.get("description"),
      price: Number(data.get("price")),
      allergens: data.get("allergens") || "",
      image_url: data.get("image_url") || "",
      is_available: data.get("is_available") === "on",
      is_vegan: data.get("is_vegan") === "on",
      is_vegetarian: data.get("is_vegetarian") === "on",
      is_halal: data.get("is_halal") === "on",
    };
  }

  async function deleteItem(itemId: number) {
    if (!confirm("Delete this menu item?")) return;
    await adminRequest(`/admin/restaurants/${id}/menu-items/${itemId}`, token, { method: "DELETE" });
    setStatus("Menu item deleted.");
    load();
  }

  async function uploadImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await adminRequest(`/admin/restaurants/${id}/images`, token, { method: "POST", body: new FormData(form) });
    form.reset();
    await load();
    setStatus("Image uploaded.");
  }

  async function deleteImage(imageId: number) {
    await adminRequest(`/admin/restaurants/${id}/images/${imageId}`, token, { method: "DELETE" });
    setStatus("Image deleted.");
    load();
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await adminRequest(`/admin/restaurants/${id}/documents`, token, { method: "POST", body: new FormData(form) });
    form.reset();
    setDocuments(await adminRequest<Document[]>(`/admin/restaurants/${id}/documents`, token));
    setStatus("Knowledge document processed.");
  }

  async function reservationStatus(reservationId: number, value: string) {
    await adminRequest(`/admin/restaurants/${id}/reservations/${reservationId}`, token, {
      method: "PATCH",
      body: JSON.stringify({ status: value }),
    });
    setReservations(await adminRequest<ContactRequest[]>(`/admin/restaurants/${id}/reservations`, token));
  }

  if (!restaurant) {
    return (
      <AdminShell>
        <div className="rounded-2xl border bg-white p-6 text-slate-500 shadow-sm">Loading restaurant editor...</div>
      </AdminShell>
    );
  }

  const primary = restaurant.primary_color || restaurant.theme?.primary_color || "#c84b31";
  const secondary = restaurant.secondary_color || restaurant.theme?.secondary_color || "#6b7048";
  const background = restaurant.background_color || restaurant.theme?.background_color || "#f7f3ea";
  const text = restaurant.text_color || restaurant.theme?.text_color || "#1b1b18";
  const heroImage = restaurant.hero_image || restaurant.images.find((image) => image.image_type === "hero")?.url || "";
  const logo = restaurant.logo_url || restaurant.images.find((image) => image.image_type === "logo")?.url || "";
  const menuCount = restaurant.categories.reduce((sum, category) => sum + category.items.length, 0);

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-orange-600">Restaurant workspace</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">{restaurant.name}</h1>
          <p className="mt-2 text-sm text-slate-500">Public URL: /restaurants/{restaurant.slug}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SaveBadge state={saveState} />
          <Link href={`/restaurants/${restaurant.slug}`} target="_blank" className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold shadow-sm">
            Open website <ExternalLink size={15} />
          </Link>
        </div>
      </div>

      <RestaurantNav id={id} active={mode} />

      {overview && (
        <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Website setup</h2>
              <p className="text-xs text-slate-500">Complete these steps before sending the website to customers.</p>
            </div>
            {overview.setup_percent < 100 && (
              <Link href={`/admin/restaurants/${id}/${nextSetupStep(overview)}`} className="text-sm font-semibold text-orange-600">
                Continue setup -&gt;
              </Link>
            )}
          </div>
          <div className="mt-4"><SetupProgress checklist={overview.checklist} percent={overview.setup_percent} /></div>
        </section>
      )}

      {status && (
        <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${status.toLowerCase().includes("could not") || status.toLowerCase().includes("error") ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"}`}>
          {status}
        </div>
      )}

      {mode === "edit" && (
        <EditInformation
          restaurant={restaurant}
          owners={owners}
          hours={hours}
          saveState={saveState}
          onChange={() => setSaveState("unsaved")}
          onSubmit={saveInfo}
        />
      )}

      {mode === "design" && (
        <DesignEditor
          restaurant={restaurant}
          themes={themes}
          primary={primary}
          secondary={secondary}
          background={background}
          text={text}
          heroImage={heroImage}
          saveState={saveState}
          onRestaurantChange={(next) => {
            setRestaurant(next);
            setSaveState("unsaved");
          }}
          onApplyTheme={applyTheme}
          onSubmit={saveDesign}
        />
      )}

      {mode === "menu" && (
        <MenuEditor
          restaurant={restaurant}
          editingItem={editingItem}
          menuCount={menuCount}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
          onAddItem={addItem}
          onSaveItem={saveItem}
          onEditItem={setEditingItem}
          onCancelEdit={() => setEditingItem(null)}
          onDeleteItem={deleteItem}
        />
      )}

      {mode === "images" && (
        <ImagesEditor
          restaurant={restaurant}
          heroImage={heroImage}
          logo={logo}
          onUploadImage={uploadImage}
          onDeleteImage={deleteImage}
        />
      )}

      {mode === "chatbot" && (
        <ChatbotEditor
          documents={documents}
          conversations={conversations}
          restaurant={restaurant}
          onUploadDocument={uploadDocument}
        />
      )}

      {mode === "reservations" && (
        <ReservationsEditor reservations={reservations} onUpdateStatus={reservationStatus} />
      )}
    </AdminShell>
  );
}

function nextSetupStep(overview: RestaurantOverview) {
  if (!overview.checklist.information) return "edit";
  if (!overview.checklist.branding) return "images";
  if (!overview.checklist.menu) return "menu";
  if (!overview.checklist.design) return "design";
  return "chatbot";
}

function SaveBadge({ state }: { state: "saved" | "saving" | "unsaved" }) {
  const classes = {
    saved: "bg-green-50 text-green-700",
    saving: "bg-blue-50 text-blue-700",
    unsaved: "bg-amber-50 text-amber-700",
  };
  const label = state === "saved" ? "All changes saved" : state === "saving" ? "Saving..." : "Unsaved changes";
  return <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${classes[state]}`}>{label}</span>;
}

function SectionHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600"><Icon size={19} /></span>
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function HelperCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="rounded-2xl border border-orange-100 bg-orange-50/70 p-5 text-sm text-orange-950">
      <p className="font-semibold">{title}</p>
      <div className="mt-2 leading-6 opacity-80">{children}</div>
    </aside>
  );
}

function EditInformation({
  restaurant,
  owners,
  hours,
  saveState,
  onChange,
  onSubmit,
}: {
  restaurant: Restaurant;
  owners: User[];
  hours: Record<string, string>;
  saveState: "saved" | "saving" | "unsaved";
  onChange: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} onChange={onChange} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className={cardClass}>
          <SectionHeader icon={Sparkles} title="Website basics" description="This is the first information customers see when they open the restaurant website." />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Restaurant name" name="name" defaultValue={restaurant.name} required />
            <Field label="Website slug" name="slug" defaultValue={restaurant.slug} required helper="Lowercase URL name, for example bella-napoli." />
            <Field label="Tagline" name="tagline" defaultValue={restaurant.tagline} helper="Short promise shown in the hero section." />
            <label className="text-sm font-medium">
              Owner
              <select className={inputClass} name="owner_id" defaultValue={restaurant.owner_id || ""}>
                <option value="">No owner assigned</option>
                {owners.filter((owner) => owner.role === "RESTAURANT_OWNER").map((owner) => (
                  <option key={owner.id} value={owner.id}>{owner.name || owner.email}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium md:col-span-2">
              Description
              <textarea className={textareaClass} name="description" defaultValue={restaurant.description} placeholder="What makes this restaurant worth visiting?" />
            </label>
            <label className="text-sm font-medium md:col-span-2">
              Restaurant story
              <textarea className={textareaClass} name="story" defaultValue={restaurant.story} placeholder="Chef, origins, atmosphere, ingredients, or hospitality story." />
            </label>
          </div>
        </section>

        <section className={cardClass}>
          <SectionHeader icon={Clock3} title="Contact and opening hours" description="Keep contact details and weekly opening hours current so the AI and website answer correctly." />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Phone" name="phone" defaultValue={restaurant.phone} />
            <Field label="Email" name="email" type="email" defaultValue={restaurant.email} required />
            <Field label="Address" name="address" defaultValue={restaurant.address} />
            <Field label="City" name="city" defaultValue={restaurant.city} />
            <Field label="Postal code" name="postal_code" defaultValue={restaurant.postal_code} />
            <Field label="Google Maps link" name="google_maps_url" defaultValue={restaurant.google_maps_url} />
            <Field label="Instagram" name="instagram_url" defaultValue={restaurant.instagram_url} />
            <Field label="Facebook" name="facebook_url" defaultValue={restaurant.facebook_url} />
            <Field label="TikTok" name="tiktok_url" defaultValue={restaurant.tiktok_url} />
            <label className="flex items-center gap-3 self-end rounded-xl bg-slate-50 p-4 text-sm font-medium">
              <input type="checkbox" name="is_published" defaultChecked={restaurant.is_published} />
              Website published
            </label>
          </div>

          <div className="mt-6 border-t pt-6">
            <h3 className="font-semibold">Weekly opening hours</h3>
            <p className="mt-1 text-sm text-slate-500">Use simple text like 12:00-22:00 or Closed.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {days.map((day) => (
                <label key={day} className="text-sm font-medium capitalize">
                  {day}
                  <input className={inputClass} name={`hours_${day}`} defaultValue={hours[day] || "Closed"} placeholder="12:00-22:00 or Closed" />
                </label>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
        <HelperCard title="Owner guidance">
          <p>Write the page as if a hungry customer is deciding where to eat tonight. Specific dishes, atmosphere, parking, dietary options, and booking instructions make the website feel real.</p>
        </HelperCard>
        <InfoPreview restaurant={restaurant} hours={hours} />
        <input type="hidden" name="logo_url" value={restaurant.logo_url} />
        <input type="hidden" name="hero_image" value={restaurant.hero_image} />
        <input type="hidden" name="reservation_url" value={restaurant.reservation_url} />
        <input type="hidden" name="theme_id" value={restaurant.theme_id || ""} />
        {["primary_color", "secondary_color", "background_color", "text_color", "font_family", "button_style", "homepage_style", "menu_style", "gallery_style"].map((name) => (
          <input key={name} type="hidden" name={name} value={String(restaurant[name as keyof Restaurant] || "")} />
        ))}
        <SavePanel saveState={saveState} label="Save information" />
      </div>
    </form>
  );
}

function Field({
  label,
  helper,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; helper?: string }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input className={inputClass} {...props} />
      {helper && <span className="mt-1 block text-xs leading-5 text-slate-500">{helper}</span>}
    </label>
  );
}

function InfoPreview({ restaurant, hours }: { restaurant: Restaurant; hours: Record<string, string> }) {
  return (
    <section className={cardClass}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer preview</p>
      <h3 className="mt-3 text-2xl font-semibold">{restaurant.tagline || restaurant.name}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{restaurant.description || "Add a description to explain the restaurant experience."}</p>
      <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold">{restaurant.address || "Address missing"}</p>
        <p>{restaurant.phone || "Phone missing"} - {restaurant.email || "Email missing"}</p>
        <div className="mt-3 space-y-1">
          {days.slice(0, 3).map((day) => <p key={day} className="flex justify-between gap-3"><span className="capitalize">{day}</span><span>{hours[day] || "Closed"}</span></p>)}
        </div>
      </div>
    </section>
  );
}

function SavePanel({ saveState, label }: { saveState: "saved" | "saving" | "unsaved"; label: string }) {
  return (
    <div className="rounded-2xl border bg-white/95 p-4 shadow-xl backdrop-blur">
      <p className="text-sm text-slate-500">{saveState === "unsaved" ? "You have changes that are not saved yet." : "Your changes are up to date."}</p>
      <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white">
        <Save size={17} /> {label}
      </button>
    </div>
  );
}

function DesignEditor({
  restaurant,
  themes,
  primary,
  secondary,
  background,
  text,
  heroImage,
  saveState,
  onRestaurantChange,
  onApplyTheme,
  onSubmit,
}: {
  restaurant: Restaurant;
  themes: Theme[];
  primary: string;
  secondary: string;
  background: string;
  text: string;
  heroImage: string;
  saveState: "saved" | "saving" | "unsaved";
  onRestaurantChange: (restaurant: Restaurant) => void;
  onApplyTheme: (theme: Theme) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1fr_440px]">
      <div className="space-y-6">
        <section className={cardClass}>
          <SectionHeader icon={LayoutTemplate} title="Choose a website style" description="Start with a template, then adjust colors and layout details for the restaurant brand." />
          {themes.length === 0 ? (
            <EmptyState title="No templates found" description="Templates are loaded from the backend. Try refreshing or seed the demo data." />
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {themes.map((theme) => (
                <button
                  type="button"
                  key={theme.id}
                  onClick={() => onApplyTheme(theme)}
                  className={`rounded-2xl border p-4 text-left transition hover:border-slate-400 hover:bg-slate-50 ${restaurant.theme_id === theme.id ? "ring-2 ring-slate-900" : ""}`}
                >
                  <div className="flex gap-1">
                    {[theme.primary_color, theme.secondary_color, theme.background_color].map((color) => (
                      <span key={color} className="h-7 w-7 rounded-full border" style={{ background: color }} />
                    ))}
                  </div>
                  <p className="mt-3 font-semibold">{theme.name}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{theme.description}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={cardClass}>
          <SectionHeader icon={Palette} title="Brand controls" description="Tune the colors and presentation used by the public restaurant website." />
          <input type="hidden" name="theme_id" value={restaurant.theme_id || ""} />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ["primary_color", "Main color", primary],
              ["secondary_color", "Accent color", secondary],
              ["background_color", "Background", background],
              ["text_color", "Text color", text],
            ].map(([name, label, fallback]) => (
              <label key={name} className="text-sm font-medium">
                {label}
                <div className="mt-2 flex gap-2">
                  <input
                    type="color"
                    className="h-11 w-14 rounded border p-1"
                    value={String(restaurant[name as keyof Restaurant] || fallback)}
                    onChange={(event) => onRestaurantChange({ ...restaurant, [name]: event.target.value })}
                  />
                  <input
                    className="w-full rounded-xl border px-3"
                    name={name}
                    value={String(restaurant[name as keyof Restaurant] || fallback)}
                    onChange={(event) => onRestaurantChange({ ...restaurant, [name]: event.target.value })}
                  />
                </div>
              </label>
            ))}
            <SelectField label="Font" name="font_family" value={restaurant.font_family} onChange={(value) => onRestaurantChange({ ...restaurant, font_family: value })} options={["Cormorant Garamond", "Inter", "Georgia", "Arial"]} />
            <SelectField label="Buttons" name="button_style" value={restaurant.button_style} onChange={(value) => onRestaurantChange({ ...restaurant, button_style: value })} options={["pill", "soft", "square", "bold"]} />
            <SelectField label="Menu style" name="menu_style" value={restaurant.menu_style} onChange={(value) => onRestaurantChange({ ...restaurant, menu_style: value })} options={["list", "cards"]} />
            <SelectField label="Gallery style" name="gallery_style" value={restaurant.gallery_style} onChange={(value) => onRestaurantChange({ ...restaurant, gallery_style: value })} options={["grid", "filmstrip"]} />
            <input type="hidden" name="homepage_style" value={restaurant.homepage_style || ""} />
          </div>
        </section>
      </div>

      <div className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
        <DesignPreview restaurant={restaurant} primary={primary} secondary={secondary} background={background} text={text} heroImage={heroImage} />
        <HelperCard title="Design tip">
          <p>Use one confident main color, readable text, and real food photos. The fastest way to make the site feel expensive is a strong hero image plus a simple palette.</p>
        </HelperCard>
        <SavePanel saveState={saveState} label="Save and publish design" />
      </div>
    </form>
  );
}

function SelectField({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select className={inputClass} name={name} value={value || ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">Default</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function DesignPreview({
  restaurant,
  primary,
  secondary,
  background,
  text,
  heroImage,
}: {
  restaurant: Restaurant;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  heroImage: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-white shadow-xl">
      <div className="border-b px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Live style preview</p>
      </div>
      <div style={{ background, color: text, fontFamily: restaurant.font_family || undefined }}>
        <div
          className="relative min-h-[460px] bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(90deg, ${text}dd, transparent), url(${heroImage})` }}
        >
          <div className="p-6 text-white">
            <div className="flex justify-between gap-4 text-sm"><b>{restaurant.name}</b><span>Menu - Gallery - Contact</span></div>
            <div className="mt-24 max-w-sm">
              <p className="text-xs font-bold uppercase tracking-[.25em]" style={{ color: secondary }}>{restaurant.city || "Your city"}</p>
              <h3 className="mt-3 text-5xl font-semibold leading-none">{restaurant.tagline || restaurant.name}</h3>
              <p className="mt-4 text-sm leading-6 text-white/80">{restaurant.description || "Add a description to preview the hero section."}</p>
              <button type="button" className={`mt-6 px-6 py-3 font-semibold text-white ${restaurant.button_style === "square" ? "" : restaurant.button_style === "soft" ? "rounded-xl" : "rounded-full"}`} style={{ background: primary }}>
                View menu
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MenuEditor({
  restaurant,
  editingItem,
  menuCount,
  onAddCategory,
  onDeleteCategory,
  onAddItem,
  onSaveItem,
  onEditItem,
  onCancelEdit,
  onDeleteItem,
}: {
  restaurant: Restaurant;
  editingItem: MenuItem | null;
  menuCount: number;
  onAddCategory: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteCategory: (categoryId: number) => void;
  onAddItem: (event: FormEvent<HTMLFormElement>) => void;
  onSaveItem: (event: FormEvent<HTMLFormElement>) => void;
  onEditItem: (item: MenuItem) => void;
  onCancelEdit: () => void;
  onDeleteItem: (itemId: number) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <div className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
        <section className={cardClass}>
          <SectionHeader icon={UtensilsCrossed} title="Menu builder" description="Create categories, add dishes, mark allergens, and keep unavailable items visible to staff." />
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-4"><b className="block text-2xl">{restaurant.categories.length}</b><span className="text-slate-500">Categories</span></div>
            <div className="rounded-xl bg-slate-50 p-4"><b className="block text-2xl">{menuCount}</b><span className="text-slate-500">Items</span></div>
          </div>
        </section>

        <form onSubmit={onAddCategory} className={cardClass}>
          <h3 className="font-semibold">Add category</h3>
          <p className="mt-1 text-sm text-slate-500">Examples: Starters, Pizza, Lunch menu, Desserts.</p>
          <input className={inputClass} name="name" placeholder="Category name" required />
          <input className={inputClass} name="description" placeholder="Short description" />
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"><Plus size={16} /> Add category</button>
        </form>
      </div>

      <div className="space-y-6">
        <MenuItemForm
          restaurant={restaurant}
          editingItem={editingItem}
          onSubmit={editingItem ? onSaveItem : onAddItem}
          onCancelEdit={onCancelEdit}
        />

        {restaurant.categories.length === 0 ? (
          <EmptyState title="No menu categories yet" description="Add your first category, then create menu items inside it." />
        ) : (
          restaurant.categories.map((category) => (
            <section key={category.id} className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">{category.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{category.description || "No description yet."}</p>
                </div>
                <button onClick={() => onDeleteCategory(category.id)} className="rounded-xl border p-3 text-red-600" aria-label={`Delete ${category.name}`}>
                  <Trash2 size={18} />
                </button>
              </div>

              {category.items.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed p-6 text-sm text-slate-500">No items in this category yet.</div>
              ) : (
                <div className="mt-5 grid gap-3">
                  {category.items.map((item) => (
                    <article key={item.id} className="grid gap-4 rounded-2xl border bg-slate-50/60 p-4 md:grid-cols-[96px_1fr_auto]">
                      {item.image_url ? <img src={item.image_url} alt={item.name} className="h-24 w-24 rounded-xl object-cover" /> : <div className="grid h-24 w-24 place-items-center rounded-xl bg-white text-slate-300"><ImageIcon size={22} /></div>}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{item.name}</h3>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700">{money(item.price)}</span>
                          {!item.is_available && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">Unavailable</span>}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{item.description || "No description yet."}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                          {item.is_vegan && <Badge icon={Leaf} label="Vegan" />}
                          {item.is_vegetarian && <Badge label="Vegetarian" />}
                          {item.is_halal && <Badge label="Halal" />}
                          {item.allergens && <Badge label={`Allergens: ${item.allergens}`} />}
                        </div>
                      </div>
                      <div className="flex gap-2 md:flex-col">
                        <button onClick={() => onEditItem(item)} className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold">Edit</button>
                        <button onClick={() => onDeleteItem(item.id)} className="rounded-xl border bg-white p-2 text-red-600" aria-label={`Delete ${item.name}`}><Trash2 size={16} /></button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function MenuItemForm({
  restaurant,
  editingItem,
  onSubmit,
  onCancelEdit,
}: {
  restaurant: Restaurant;
  editingItem: MenuItem | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
}) {
  return (
    <form key={editingItem?.id || "new"} onSubmit={onSubmit} className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader icon={Plus} title={editingItem ? "Edit menu item" : "Add menu item"} description="Menu descriptions should be short, specific, and easy for customers to scan." />
        {editingItem && <button type="button" onClick={onCancelEdit} className="rounded-xl border p-2 text-slate-500" aria-label="Cancel edit"><X size={18} /></button>}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Category
          <select className={inputClass} name="category_id" required defaultValue={editingItem?.category_id || ""}>
            <option value="">Choose category</option>
            {restaurant.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <Field label="Item name" name="name" defaultValue={editingItem?.name || ""} required />
        <Field label="Price" name="price" type="number" step=".01" min="0" defaultValue={editingItem?.price || ""} required />
        <Field label="Allergens" name="allergens" defaultValue={editingItem?.allergens || ""} helper="Example: gluten, milk, nuts" />
        <label className="text-sm font-medium md:col-span-2">
          Food image URL
          <input className={inputClass} name="image_url" defaultValue={editingItem?.image_url || ""} placeholder="Paste a food image URL, or upload photos under Images." />
        </label>
        <label className="text-sm font-medium md:col-span-2">
          Description
          <textarea className={textareaClass} name="description" defaultValue={editingItem?.description || ""} placeholder="Ingredients, texture, portion, spice level, or serving style." />
        </label>
        <div className="flex flex-wrap gap-4 text-sm md:col-span-2">
          <label className="flex items-center gap-2"><input type="checkbox" name="is_available" defaultChecked={editingItem?.is_available ?? true} />Available today</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="is_vegan" defaultChecked={editingItem?.is_vegan || false} />Vegan</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="is_vegetarian" defaultChecked={editingItem?.is_vegetarian || false} />Vegetarian</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="is_halal" defaultChecked={editingItem?.is_halal || false} />Halal</label>
        </div>
      </div>
      <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white">
        <Save size={16} /> {editingItem ? "Save menu item" : "Add menu item"}
      </button>
    </form>
  );
}

function Badge({ label, icon: Icon }: { label: string; icon?: LucideIcon }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
      {Icon && <Icon size={12} />} {label}
    </span>
  );
}

function ImagesEditor({
  restaurant,
  heroImage,
  logo,
  onUploadImage,
  onDeleteImage,
}: {
  restaurant: Restaurant;
  heroImage: string;
  logo: string;
  onUploadImage: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteImage: (imageId: number) => void;
}) {
  const gallery = restaurant.images.filter((image) => ["gallery", "food"].includes(image.image_type));
  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <div className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
        <form onSubmit={onUploadImage} className="rounded-2xl border-2 border-dashed border-orange-200 bg-white p-6 text-center shadow-sm">
          <Upload className="mx-auto text-orange-600" />
          <h2 className="mt-3 text-xl font-semibold">Upload restaurant image</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Use a strong hero image, a readable logo, and real food or interior photos.</p>
          <div className="mt-5 grid gap-3">
            <input name="file" type="file" accept="image/*" required className="rounded-xl border p-3 text-sm" />
            <select name="image_type" className="rounded-xl border px-4 py-3 text-sm">
              <option value="gallery">Gallery photo</option>
              <option value="hero">Hero image</option>
              <option value="logo">Logo</option>
              <option value="food">Food photo</option>
            </select>
            <input name="alt_text" placeholder="Image description" className="rounded-xl border px-4 py-3 text-sm" />
          </div>
          <button className="mt-4 w-full rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white">Upload image</button>
        </form>

        <HelperCard title="Photo checklist">
          <ul className="list-disc space-y-1 pl-4">
            <li>Hero: wide, bright, shows the restaurant or signature food.</li>
            <li>Logo: square or transparent works best.</li>
            <li>Gallery: 6 to 9 real photos makes the site feel trustworthy.</li>
          </ul>
        </HelperCard>
      </div>

      <div className="space-y-6">
        <section className={cardClass}>
          <SectionHeader icon={Camera} title="Current brand images" description="These photos power the public website hero, logo, menu, and gallery." />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ImagePreview title="Hero image" image={heroImage} fallback="Upload a hero image to make the website feel premium." />
            <ImagePreview title="Logo" image={logo} fallback="Upload a logo so the site looks branded." compact />
          </div>
        </section>

        <section className={cardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeader icon={ImageIcon} title="Gallery" description="Manage customer-facing photos used throughout the restaurant website." />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{gallery.length} photos</span>
          </div>
          {restaurant.images.length === 0 ? (
            <EmptyState title="No images uploaded yet" description="Upload a hero image and a few gallery photos before showing the demo to a restaurant owner." />
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {restaurant.images.map((image) => (
                <ImageCard key={image.id} image={image} restaurantName={restaurant.name} onDelete={() => onDeleteImage(image.id)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ImagePreview({ title, image, fallback, compact = false }: { title: string; image: string; fallback: string; compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-slate-50">
      {image ? <img src={image} alt="" className={`${compact ? "h-44" : "h-56"} w-full object-cover`} /> : <div className={`${compact ? "h-44" : "h-56"} grid place-items-center p-6 text-center text-sm text-slate-400`}>{fallback}</div>}
      <div className="p-4"><p className="font-semibold">{title}</p></div>
    </div>
  );
}

function ImageCard({ image, restaurantName, onDelete }: { image: RestaurantImage; restaurantName: string; onDelete: () => void }) {
  return (
    <article className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <img src={image.url} alt={image.alt_text || restaurantName} className="h-48 w-full object-cover" />
      <div className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="font-semibold capitalize">{image.image_type}</p>
          <p className="text-xs text-slate-500">{image.alt_text || "No description"}</p>
        </div>
        <button onClick={onDelete} className="rounded-xl border p-2 text-red-600" aria-label="Delete image"><Trash2 size={18} /></button>
      </div>
    </article>
  );
}

function ChatbotEditor({
  documents,
  conversations,
  restaurant,
  onUploadDocument,
}: {
  documents: Document[];
  conversations: Conversation[];
  restaurant: Restaurant;
  onUploadDocument: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const unanswered = conversations.reduce((sum, conversation) => sum + conversation.messages.filter((message) => message.is_unanswered).length, 0);
  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <div className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
        <section className={cardClass}>
          <SectionHeader icon={Bot} title="AI employee setup" description="The assistant answers from this restaurant's profile, menu, opening hours, and uploaded documents." />
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-4"><b className="block text-2xl">{documents.length}</b><span className="text-slate-500">Documents</span></div>
            <div className="rounded-xl bg-slate-50 p-4"><b className="block text-2xl">{unanswered}</b><span className="text-slate-500">AI gaps</span></div>
          </div>
        </section>

        <form onSubmit={onUploadDocument} className={cardClass}>
          <h3 className="font-semibold">Add knowledge</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">Upload PDF or TXT files for allergen details, catering policies, delivery rules, or FAQs.</p>
          <input className="mt-4 w-full rounded-xl border p-3 text-sm" name="file" type="file" accept=".pdf,.txt" required />
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"><FileText size={16} /> Process document</button>
        </form>
      </div>

      <div className="space-y-6">
        <section className={cardClass}>
          <SectionHeader icon={CheckCircle2} title="Automatic knowledge" description="These sources are already synchronized into the assistant when you save restaurant details or menu items." />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <KnowledgeSource title="Restaurant profile" ready={Boolean(restaurant.description && restaurant.phone && restaurant.address)} />
            <KnowledgeSource title="Opening hours" ready={restaurant.opening_hours !== "{}"} />
            <KnowledgeSource title="Menu items" ready={restaurant.categories.some((category) => category.items.length > 0)} />
          </div>
        </section>

        <section className={cardClass}>
          <SectionHeader icon={FileText} title="Uploaded documents" description="Documents extend the assistant with restaurant-specific details that do not fit the menu or profile." />
          {documents.length === 0 ? (
            <EmptyState title="No documents uploaded yet" description="Add allergen sheets, FAQ files, catering menus, or reservation policies to make the AI more useful." />
          ) : (
            <div className="mt-5 divide-y">
              {documents.map((doc) => (
                <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <span className="font-medium">{doc.filename}</span>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{doc.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={cardClass}>
          <SectionHeader icon={Sparkles} title="Customer questions" description="Review real questions to discover missing menu, allergen, or policy information." />
          <div className="mt-5 space-y-4">
            {conversations.length === 0 ? (
              <EmptyState title="No conversations yet" description="Customer chats will appear here after visitors use the AI assistant." />
            ) : (
              conversations.map((conversation) => (
                <article key={conversation.id} className="rounded-xl border p-4">
                  <p className="text-xs text-slate-400">{new Date(conversation.created_at).toLocaleString()}</p>
                  <div className="mt-3 space-y-2">
                    {conversation.messages.map((message, index) => (
                      <p key={message.id || index} className={`text-sm leading-6 ${message.is_unanswered ? "rounded-lg bg-red-50 p-2 text-red-800" : ""}`}>
                        <b className="capitalize">{message.role}:</b> {message.content}
                      </p>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function KnowledgeSource({ title, ready }: { title: string; ready: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${ready ? "border-green-100 bg-green-50 text-green-800" : "border-amber-100 bg-amber-50 text-amber-800"}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-xs">{ready ? "Ready" : "Needs more data"}</p>
    </div>
  );
}

function ReservationsEditor({
  reservations,
  onUpdateStatus,
}: {
  reservations: ContactRequest[];
  onUpdateStatus: (reservationId: number, value: string) => void;
}) {
  return (
    <section className={cardClass}>
      <SectionHeader icon={Clock3} title="Reservations and contact requests" description="Review incoming table requests and keep their status current." />
      <div className="mt-5 space-y-4">
        {reservations.length === 0 ? (
          <EmptyState title="No reservation requests yet" description="Requests from the public restaurant website will appear here." />
        ) : (
          reservations.map((reservation) => (
            <article key={reservation.id} className="grid gap-4 rounded-xl border p-4 md:grid-cols-[1fr_auto]">
              <div>
                <p className="font-semibold">{reservation.name} - {reservation.party_size || "?"} guests</p>
                <p className="mt-1 text-sm text-slate-500">{reservation.requested_at || "No requested time"} - {reservation.email} - {reservation.phone}</p>
                {reservation.message && <p className="mt-3 text-sm leading-6">{reservation.message}</p>}
              </div>
              <select value={reservation.status} onChange={(event) => onUpdateStatus(reservation.id, event.target.value)} className="h-fit rounded-lg border px-3 py-2 text-sm">
                <option value="new">New</option>
                <option value="confirmed">Confirmed</option>
                <option value="declined">Declined</option>
                <option value="completed">Completed</option>
              </select>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed bg-slate-50/70 p-8 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
