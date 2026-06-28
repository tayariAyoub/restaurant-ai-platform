"use client";

import {
  ArrowLeft,
  AlertCircle,
  Bot,
  CheckCircle2,
  Eye,
  ExternalLink,
  Globe2,
  Image as ImageIcon,
  LayoutTemplate,
  Link2,
  Loader2,
  Monitor,
  Palette,
  Save,
  Settings2,
  Smartphone,
  Sparkles,
  Store,
  Trash2,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { type MouseEvent, type ReactNode, useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/admin/AdminShell";
import { adminRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Restaurant, RestaurantImage, RestaurantOverview, Theme, User } from "@/lib/types";

type BuilderMode = "list" | "create" | "edit";
type BuilderSection = "basics" | "brand" | "content" | "services" | "preview";
type PreviewMode = "desktop" | "mobile";
type ToastState = { type: "success" | "error"; message: string } | null;

type BuilderDraft = {
  id?: number;
  owner_id: number | null;
  theme_id: number | null;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  story: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  google_maps_url: string;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  opening_hours: string;
  logo_url: string;
  hero_image: string;
  reservation_url: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  button_style: string;
  homepage_style: string;
  menu_style: string;
  gallery_style: string;
  reservations_enabled: boolean;
  ordering_enabled: boolean;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  dine_in_enabled: boolean;
  chatbot_enabled: boolean;
  ai_name: string;
  ai_welcome_message: string;
  ai_tone: string;
  ai_allowed_topics: string;
  ai_fallback_message: string;
  ai_escalation_message: string;
  ai_language: string;
  ai_safety_instructions: string;
  is_published: boolean;
  images: RestaurantImage[];
};

const sections: Array<{ id: BuilderSection; label: string; description: string }> = [
  { id: "basics", label: "Restaurant", description: "Name, contact, location" },
  { id: "brand", label: "Brand", description: "Theme, colors, hero" },
  { id: "content", label: "Story", description: "Copy, socials, hours" },
  { id: "services", label: "Services", description: "Reserve, order, chat" },
  { id: "preview", label: "Review", description: "Publish readiness" },
];

const days = [
  ["monday", "Monday"],
  ["tuesday", "Tuesday"],
  ["wednesday", "Wednesday"],
  ["thursday", "Thursday"],
  ["friday", "Friday"],
  ["saturday", "Saturday"],
  ["sunday", "Sunday"],
] as const;

const blankDraft: BuilderDraft = {
  owner_id: null,
  theme_id: null,
  name: "",
  slug: "",
  tagline: "",
  description: "",
  story: "",
  address: "",
  city: "",
  postal_code: "",
  phone: "",
  email: "",
  google_maps_url: "",
  facebook_url: "",
  instagram_url: "",
  tiktok_url: "",
  opening_hours: JSON.stringify({
    monday: "Closed",
    tuesday: "12:00 - 22:00",
    wednesday: "12:00 - 22:00",
    thursday: "12:00 - 22:00",
    friday: "12:00 - 23:00",
    saturday: "12:00 - 23:00",
    sunday: "12:00 - 21:00",
  }),
  logo_url: "",
  hero_image: "",
  reservation_url: "",
  primary_color: "#c6a15b",
  secondary_color: "#2c2925",
  background_color: "#11110f",
  text_color: "#f7f2e8",
  font_family: "Cormorant Garamond",
  button_style: "pill",
  homepage_style: "editorial",
  menu_style: "refined",
  gallery_style: "masonry",
  reservations_enabled: true,
  ordering_enabled: true,
  delivery_enabled: true,
  pickup_enabled: true,
  dine_in_enabled: true,
  chatbot_enabled: true,
  ai_name: "",
  ai_welcome_message: "",
  ai_tone: "",
  ai_allowed_topics: "",
  ai_fallback_message: "",
  ai_escalation_message: "",
  ai_language: "",
  ai_safety_instructions: "",
  is_published: false,
  images: [],
};

export default function VisualBuilder({ restaurantId }: { restaurantId?: number }) {
  const [mode, setMode] = useState<BuilderMode>(restaurantId ? "edit" : "list");
  const [section, setSection] = useState<BuilderSection>("basics");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [me, setMe] = useState<User | null>(null);
  const [owners, setOwners] = useState<User[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantOverview[]>([]);
  const [draft, setDraft] = useState<BuilderDraft>(blankDraft);
  const [savedSnapshot, setSavedSnapshot] = useState(() => serializeDraft(blankDraft));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadBuilder() {
      setLoading(true);
      setError("");
      try {
        const token = getToken();
        const [userData, themeData, overviewData] = await Promise.all([
          adminRequest<User>("/auth/me", token),
          adminRequest<Theme[]>("/admin/themes", token),
          adminRequest<RestaurantOverview[]>("/admin/restaurants-overview", token),
        ]);
        if (!mounted) return;

        setMe(userData);
        setThemes(themeData);
        setRestaurants(overviewData);

        if (userData.role === "SUPER_ADMIN") {
          const users = await adminRequest<User[]>("/admin/users", token);
          if (mounted) setOwners(users.filter((user) => user.role === "RESTAURANT_OWNER"));
        }

        if (restaurantId) {
          const restaurant = await adminRequest<Restaurant>(`/admin/restaurants/${restaurantId}`, token);
          if (!mounted) return;
          const loadedDraft = draftFromRestaurant(restaurant);
          setDraft(loadedDraft);
          setSavedSnapshot(serializeDraft(loadedDraft));
          setMode("edit");
        }
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "Could not load visual builder.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadBuilder();
    return () => {
      mounted = false;
    };
  }, [restaurantId]);

  const completion = useMemo(() => buildCompletion(draft), [draft]);
  const selectedTheme = themes.find((theme) => theme.id === draft.theme_id);
  const draftSnapshot = useMemo(() => serializeDraft(draft), [draft]);
  const hasUnsavedChanges = draftSnapshot !== savedSnapshot;
  const saveState = saving ? "saving" : hasUnsavedChanges ? "unsaved" : "saved";

  useEffect(() => {
    if (!hasUnsavedChanges || saving) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges, saving]);

  function startCreate() {
    const nextDraft = { ...blankDraft, images: [] };
    setDraft(nextDraft);
    setSavedSnapshot(serializeDraft(nextDraft));
    setMode("create");
    setSection("basics");
    setToast(null);
    setValidationErrors([]);
    setError("");
  }

  function updateDraft(values: Partial<BuilderDraft>) {
    setToast(null);
    setValidationErrors([]);
    setDraft((current) => {
      const next = { ...current, ...values };
      if ("name" in values && (!current.slug || current.slug === slugify(current.name))) {
        next.slug = slugify(values.name || "");
      }
      return next;
    });
  }

  function applyTheme(theme: Theme) {
    updateDraft({
      theme_id: theme.id,
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
  }

  function updateHours(day: string, value: string) {
    const hours = parseHours(draft.opening_hours);
    updateDraft({ opening_hours: JSON.stringify({ ...hours, [day]: value }) });
  }

  async function saveDraft(options: { publish?: boolean } = {}) {
    setError("");
    setToast(null);

    const errors = validateDraft(draft);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setSection("basics");
      return;
    }
    setValidationErrors([]);

    setSaving(true);
    try {
      const token = getToken();
      const payload = payloadFromDraft({
        ...draft,
        slug: slugify(draft.slug || draft.name),
        is_published: options.publish ?? draft.is_published,
      });
      const saved =
        mode === "create"
          ? await adminRequest<Restaurant>("/admin/restaurants", token, {
              method: "POST",
              body: JSON.stringify(payload),
            })
          : await adminRequest<Restaurant>(`/admin/restaurants/${draft.id}`, token, {
              method: "PUT",
              body: JSON.stringify(payload),
            });

      const nextDraft = draftFromRestaurant(saved);
      setDraft(nextDraft);
      setSavedSnapshot(serializeDraft(nextDraft));
      setMode("edit");
      setToast({
        type: "success",
        message: options.publish ? "Website published. Open the public site to review the launch." : "Website saved.",
      });
      setRestaurants(await adminRequest<RestaurantOverview[]>("/admin/restaurants-overview", token));
    } catch (saveError) {
      setToast({
        type: "error",
        message: saveError instanceof Error ? saveError.message : "Could not save restaurant website.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function addGalleryImage(url: string, altText: string) {
    if (!draft.id) {
      setToast({ type: "error", message: "Save the restaurant before adding gallery images." });
      return;
    }
    setSaving(true);
    setToast(null);
    try {
      const token = getToken();
      await adminRequest<RestaurantImage>(`/admin/restaurants/${draft.id}/image-url`, token, {
        method: "POST",
        body: JSON.stringify({ image_type: "gallery", url, alt_text: altText }),
      });
      const updated = await adminRequest<Restaurant>(`/admin/restaurants/${draft.id}`, token);
      setDraft((current) => ({ ...current, images: updated.images }));
      setToast({ type: "success", message: "Gallery image URL added." });
    } catch (galleryError) {
      setToast({
        type: "error",
        message: galleryError instanceof Error ? galleryError.message : "Could not add gallery image URL.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function clearGalleryImage(imageId: number) {
    if (!draft.id) return;
    setSaving(true);
    setToast(null);
    try {
      const token = getToken();
      await adminRequest(`/admin/restaurants/${draft.id}/images/${imageId}`, token, { method: "DELETE" });
      const updated = await adminRequest<Restaurant>(`/admin/restaurants/${draft.id}`, token);
      setDraft((current) => ({ ...current, images: updated.images }));
      setToast({ type: "success", message: "Gallery image removed." });
    } catch (galleryError) {
      setToast({
        type: "error",
        message: galleryError instanceof Error ? galleryError.message : "Could not remove gallery image.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <BuilderSkeleton />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-orange-600">Visual website builder</p>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
              Build restaurant websites without touching code.
            </h1>
            <p className="mt-3 max-w-3xl text-slate-500">
              Create, polish, preview, and publish a premium restaurant website from the fields already used by RestaurantAI.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {mode !== "list" && <SaveStatusBadge state={saveState} />}
            {mode !== "list" && (
              <GuardedLink
                href="/admin/builder"
                hasUnsavedChanges={hasUnsavedChanges}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold shadow-sm"
              >
                <ArrowLeft size={16} /> Back to restaurants
              </GuardedLink>
            )}
            {draft.id && (
              <GuardedLink
                href={`/admin/builder/${draft.id}/menu`}
                hasUnsavedChanges={hasUnsavedChanges}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold shadow-sm"
              >
                <UtensilsCrossed size={16} /> Menu Builder
              </GuardedLink>
            )}
            {draft.id && (
              <GuardedLink
                href={`/admin/builder/${draft.id}/ai`}
                hasUnsavedChanges={hasUnsavedChanges}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold shadow-sm"
              >
                <Bot size={16} /> AI Settings
              </GuardedLink>
            )}
            {draft.slug && (
              <GuardedLink
                href={`/restaurants/${draft.slug}`}
                hasUnsavedChanges={hasUnsavedChanges}
                target="_blank"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm"
              >
                <ExternalLink size={16} /> Open public site
              </GuardedLink>
            )}
          </div>
        </div>

        {error && <MessageBanner type="error" message={error} />}
        {toast && <MessageBanner type={toast.type} message={toast.message} />}
        {validationErrors.length > 0 && <ValidationBanner errors={validationErrors} />}

        {mode === "list" ? (
          <BuilderLanding
            me={me}
            restaurants={restaurants}
            onCreate={startCreate}
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[260px_1fr_360px]">
            <aside className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm xl:sticky xl:top-24 xl:self-start">
              <div className="rounded-2xl bg-slate-950 p-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Progress</p>
                  <SaveStatusDot state={saveState} />
                </div>
                <p className="mt-2 text-3xl font-semibold">{completion.score}%</p>
                <p className="mt-1 text-xs text-white/50">Launch readiness</p>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-orange-400" style={{ width: `${completion.score}%` }} />
                </div>
              </div>
              <nav className="mt-4 space-y-2">
                {sections.map((item, index) => {
                  const matchingItems = completion.items.filter((completionItem) => completionItem.section === item.id);
                  const sectionReady = matchingItems.length > 0 && matchingItems.every((completionItem) => completionItem.done);
                  return (
                  <button
                    key={item.id}
                    onClick={() => setSection(item.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      section === item.id ? "bg-slate-950 text-white shadow-lg" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      section === item.id ? "bg-white text-slate-950" : sectionReady ? "bg-green-100 text-green-700" : "bg-white text-slate-400"
                    }`}>
                      {sectionReady ? <CheckCircle2 size={15} /> : index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className={`mt-1 block text-xs ${section === item.id ? "text-white/55" : "text-slate-400"}`}>{item.description}</span>
                    </span>
                  </button>
                  );
                })}
              </nav>
            </aside>

            <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-7">
              <BuilderForm
                section={section}
                draft={draft}
                me={me}
                owners={owners}
                themes={themes}
                selectedTheme={selectedTheme}
                completion={completion}
                onChange={updateDraft}
                onApplyTheme={applyTheme}
                onHoursChange={updateHours}
                onSectionChange={setSection}
                onAddGalleryImage={addGalleryImage}
                onClearGalleryImage={clearGalleryImage}
                saving={saving}
              />
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
                <button
                  onClick={() => saveDraft()}
                  disabled={saving || !hasUnsavedChanges}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl border bg-white px-5 py-3 text-sm font-semibold shadow-sm disabled:opacity-60"
                >
                  {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                  {saving ? "Saving..." : hasUnsavedChanges ? "Save changes" : "Saved"}
                </button>
                <button
                  onClick={() => saveDraft({ publish: true })}
                  disabled={saving}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
                >
                  {saving ? <Loader2 size={17} className="animate-spin" /> : <Globe2 size={17} />}
                  {saving ? "Publishing..." : "Publish website"}
                </button>
              </div>
            </section>

            <aside className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm xl:sticky xl:top-24 xl:self-start">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Live preview</p>
                  <p className="text-sm font-semibold text-slate-700">First impression</p>
                </div>
                <div className="flex rounded-xl border bg-slate-50 p-1">
                  <button
                    onClick={() => setPreviewMode("desktop")}
                    className={`grid h-9 w-9 place-items-center rounded-lg ${previewMode === "desktop" ? "bg-white shadow-sm" : "text-slate-400"}`}
                    aria-label="Desktop preview"
                  >
                    <Monitor size={16} />
                  </button>
                  <button
                    onClick={() => setPreviewMode("mobile")}
                    className={`grid h-9 w-9 place-items-center rounded-lg ${previewMode === "mobile" ? "bg-white shadow-sm" : "text-slate-400"}`}
                    aria-label="Mobile preview"
                  >
                    <Smartphone size={16} />
                  </button>
                </div>
              </div>
              <WebsitePreview draft={draft} previewMode={previewMode} />
            </aside>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function BuilderLanding({
  me,
  restaurants,
  onCreate,
}: {
  me: User | null;
  restaurants: RestaurantOverview[];
  onCreate: () => void;
}) {
  const canCreate = me?.role === "SUPER_ADMIN";

  return (
    <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <section className="rounded-3xl border border-black/5 bg-slate-950 p-6 text-white shadow-2xl sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500">
          <LayoutTemplate size={24} />
        </div>
        <h2 className="mt-6 text-3xl font-semibold">A calmer way to launch restaurant websites.</h2>
        <p className="mt-3 leading-7 text-white/62">
          Start with the restaurant identity, choose a premium theme, review services, then preview the public website before publishing.
        </p>
        <div className="mt-6 grid gap-3 text-sm text-white/80">
          {["One restaurant per build", "Uses existing public website fields", "Preview before publishing"].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-orange-300" /> {item}
            </span>
          ))}
        </div>
        {canCreate ? (
          <button
            onClick={onCreate}
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg"
          >
            <Sparkles size={17} /> Create restaurant website
          </button>
        ) : (
          <p className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/70">
            Ask a platform admin to create new restaurant websites. Assigned restaurants can still be edited from the list.
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Existing restaurant websites</h2>
            <p className="mt-1 text-sm text-slate-500">Open a restaurant to edit its visual identity and public settings.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4">
          {restaurants.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
              No restaurants yet. Create the first website to begin.
            </div>
          ) : (
            restaurants.map((restaurant) => (
              <article key={restaurant.id} className="grid gap-4 rounded-2xl border border-black/5 bg-slate-50 p-4 sm:grid-cols-[112px_1fr_auto] sm:items-center">
                <div className="h-28 overflow-hidden rounded-xl bg-slate-200">
                  {restaurant.hero_image ? (
                    <img src={restaurant.hero_image} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-400">
                      <ImageIcon size={24} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold">{restaurant.name}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${restaurant.is_published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"}`}>
                      {restaurant.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{restaurant.city || "No city"} / {restaurant.theme_name || "No theme"}</p>
                  <div className="mt-3 h-2 rounded-full bg-white">
                    <div className="h-2 rounded-full bg-orange-500" style={{ width: `${restaurant.setup_percent}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{restaurant.setup_percent}% ready</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Link href={`/admin/builder/${restaurant.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                    <Palette size={16} /> Edit
                  </Link>
                  <Link href={`/admin/builder/${restaurant.id}/menu`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold">
                    <UtensilsCrossed size={16} /> Menu
                  </Link>
                  <Link href={`/admin/builder/${restaurant.id}/ai`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold">
                    <Bot size={16} /> AI
                  </Link>
                  <Link href={`/restaurants/${restaurant.slug}`} target="_blank" className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold">
                    <Eye size={16} /> View
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function GuardedLink({
  href,
  hasUnsavedChanges,
  className,
  target,
  children,
}: {
  href: string;
  hasUnsavedChanges: boolean;
  className: string;
  target?: string;
  children: ReactNode;
}) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!hasUnsavedChanges) return;
    const shouldLeave = window.confirm("You have unsaved changes. Leave this page anyway?");
    if (!shouldLeave) event.preventDefault();
  }

  return (
    <Link href={href} target={target} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}

function SaveStatusBadge({ state }: { state: "saved" | "saving" | "unsaved" }) {
  const copy = {
    saved: ["Saved", "bg-green-50 text-green-700 border-green-100"],
    saving: ["Saving", "bg-amber-50 text-amber-800 border-amber-100"],
    unsaved: ["Unsaved", "bg-orange-50 text-orange-800 border-orange-100"],
  }[state];

  return (
    <span className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${copy[1]}`}>
      <SaveStatusDot state={state} /> {copy[0]}
    </span>
  );
}

function SaveStatusDot({ state }: { state: "saved" | "saving" | "unsaved" }) {
  return (
    <span
      className={`h-2.5 w-2.5 rounded-full ${
        state === "saved" ? "bg-green-500" : state === "saving" ? "animate-pulse bg-amber-500" : "bg-orange-500"
      }`}
      aria-hidden="true"
    />
  );
}

function MessageBanner({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold ${
        type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{message}</span>
    </div>
  );
}

function ValidationBanner({ errors }: { errors: string[] }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <div className="flex items-center gap-2 font-semibold">
        <AlertCircle size={18} /> Please fix these details before saving.
      </div>
      <ul className="mt-3 space-y-1">
        {errors.map((error) => (
          <li key={error}>- {error}</li>
        ))}
      </ul>
    </div>
  );
}

function BuilderForm({
  section,
  draft,
  me,
  owners,
  themes,
  selectedTheme,
  completion,
  onChange,
  onApplyTheme,
  onHoursChange,
  onSectionChange,
  onAddGalleryImage,
  onClearGalleryImage,
  saving,
}: {
  section: BuilderSection;
  draft: BuilderDraft;
  me: User | null;
  owners: User[];
  themes: Theme[];
  selectedTheme?: Theme;
  completion: ReturnType<typeof buildCompletion>;
  onChange: (values: Partial<BuilderDraft>) => void;
  onApplyTheme: (theme: Theme) => void;
  onHoursChange: (day: string, value: string) => void;
  onSectionChange: (section: BuilderSection) => void;
  onAddGalleryImage: (url: string, altText: string) => Promise<void>;
  onClearGalleryImage: (imageId: number) => Promise<void>;
  saving: boolean;
}) {
  if (section === "basics") {
    return (
      <div>
        <SectionHeader icon={Store} title="Restaurant information" copy="Set the identity and contact details customers need to trust the restaurant." />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Restaurant name" value={draft.name} placeholder="Bella Napoli" onChange={(name) => onChange({ name })} required />
          <Field label="Website slug" value={draft.slug} placeholder="bella-napoli" onChange={(slug) => onChange({ slug: slugify(slug) })} required />
          <Field label="Cuisine / promise" value={draft.tagline} placeholder="Authentic Italian dining" onChange={(tagline) => onChange({ tagline })} />
          <Field label="City" value={draft.city} placeholder="Aachen" onChange={(city) => onChange({ city })} required />
          <Field label="Email" type="email" value={draft.email} placeholder="hello@restaurant.com" onChange={(email) => onChange({ email })} required />
          <Field label="Phone" type="tel" value={draft.phone} placeholder="+49 ..." onChange={(phone) => onChange({ phone })} />
          <Field label="Address" value={draft.address} placeholder="Street and house number" onChange={(address) => onChange({ address })} />
          <Field label="Postal code" value={draft.postal_code} placeholder="52062" onChange={(postal_code) => onChange({ postal_code })} />
          <Field label="Reservation URL" value={draft.reservation_url} placeholder="https://..." onChange={(reservation_url) => onChange({ reservation_url })} />
          <Field label="Google Maps URL" value={draft.google_maps_url} placeholder="https://maps.google.com/..." onChange={(google_maps_url) => onChange({ google_maps_url })} />
          {me?.role === "SUPER_ADMIN" && (
            <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
              Restaurant owner
              <select
                value={draft.owner_id ?? ""}
                onChange={(event) => onChange({ owner_id: event.target.value ? Number(event.target.value) : null })}
                className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-normal text-slate-900 sm:text-sm"
              >
                <option value="">No owner assigned yet</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>{owner.name || owner.email}</option>
                ))}
              </select>
            </label>
          )}
          <TextArea label="Restaurant description" value={draft.description} placeholder="A warm, ingredient-led restaurant..." onChange={(description) => onChange({ description })} />
        </div>
      </div>
    );
  }

  if (section === "brand") {
    return (
      <div>
        <SectionHeader icon={Palette} title="Brand and visual identity" copy="Choose a premium mood, then adjust colors and images for the restaurant." />
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {themes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              active={draft.theme_id === theme.id}
              onSelect={() => onApplyTheme(theme)}
            />
          ))}
        </div>

        <div className="mt-7 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm font-semibold">Selected theme: {selectedTheme?.name || "Custom premium theme"}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ColorField label="Primary" value={draft.primary_color} onChange={(primary_color) => onChange({ primary_color })} />
            <ColorField label="Secondary" value={draft.secondary_color} onChange={(secondary_color) => onChange({ secondary_color })} />
            <ColorField label="Background" value={draft.background_color} onChange={(background_color) => onChange({ background_color })} />
            <ColorField label="Text" value={draft.text_color} onChange={(text_color) => onChange({ text_color })} />
            <ImageUrlField
              label="Logo URL"
              value={draft.logo_url}
              preview="logo"
              placeholder="https://..."
              fallbackText="Logo preview"
              onChange={(logo_url) => onChange({ logo_url })}
              onClear={() => onChange({ logo_url: "" })}
            />
            <ImageUrlField
              label="Hero image URL"
              value={draft.hero_image}
              preview="hero"
              placeholder="https://..."
              fallbackText="Hero preview"
              onChange={(hero_image) => onChange({ hero_image })}
              onClear={() => onChange({ hero_image: "" })}
            />
          </div>
          <GalleryUrlManager
            draft={draft}
            saving={saving}
            onAddGalleryImage={onAddGalleryImage}
            onClearGalleryImage={onClearGalleryImage}
          />
        </div>
      </div>
    );
  }

  if (section === "content") {
    const hours = parseHours(draft.opening_hours);

    return (
      <div>
        <SectionHeader icon={Link2} title="Story, socials, and opening hours" copy="Write owner-friendly content that makes the public website feel personal and trustworthy." />
        <div className="mt-6 grid gap-4">
          <TextArea label="Restaurant story" value={draft.story} placeholder="Tell guests what makes this restaurant special..." onChange={(story) => onChange({ story })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Instagram" value={draft.instagram_url} placeholder="https://instagram.com/..." onChange={(instagram_url) => onChange({ instagram_url })} />
            <Field label="Facebook" value={draft.facebook_url} placeholder="https://facebook.com/..." onChange={(facebook_url) => onChange({ facebook_url })} />
            <Field label="TikTok" value={draft.tiktok_url} placeholder="https://tiktok.com/@..." onChange={(tiktok_url) => onChange({ tiktok_url })} />
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="font-semibold">Opening hours</p>
            <p className="mt-1 text-sm text-slate-500">Use simple text for now, for example: 12:00 - 22:00 or Closed.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {days.map(([day, label]) => (
                <Field
                  key={day}
                  label={label}
                  value={hours[day] || ""}
                  placeholder="12:00 - 22:00"
                  onChange={(value) => onHoursChange(day, value)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === "services") {
    return (
      <div>
        <SectionHeader icon={Settings2} title="Public website services" copy="Control what customers can do on the restaurant page without changing code." />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ToggleCard label="Reservation requests" description="Show reservation calls-to-action and the table request form." checked={draft.reservations_enabled} onChange={(reservations_enabled) => onChange({ reservations_enabled })} />
          <ToggleCard label="Online ordering" description="Show add-to-order controls, cart, and order drawer." checked={draft.ordering_enabled} onChange={(ordering_enabled) => onChange({ ordering_enabled })} />
          <ToggleCard label="Pickup" description="Allow customers to choose pickup when ordering." checked={draft.pickup_enabled} disabled={!draft.ordering_enabled} onChange={(pickup_enabled) => onChange({ pickup_enabled })} />
          <ToggleCard label="Dine-in" description="Allow customers to place a dine-in order." checked={draft.dine_in_enabled} disabled={!draft.ordering_enabled} onChange={(dine_in_enabled) => onChange({ dine_in_enabled })} />
          <ToggleCard label="Delivery" description="Allow customers to choose delivery when ordering." checked={draft.delivery_enabled} disabled={!draft.ordering_enabled} onChange={(delivery_enabled) => onChange({ delivery_enabled })} />
          <ToggleCard label="AI Maitre d'" description="Show the public chat widget as a premium menu guide." checked={draft.chatbot_enabled} onChange={(chatbot_enabled) => onChange({ chatbot_enabled })} />
        </div>
        {draft.id && (
          <GuardedLink
            href={`/admin/builder/${draft.id}/ai`}
            hasUnsavedChanges={false}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm"
          >
            <Bot size={16} /> Configure AI settings and test answers
          </GuardedLink>
        )}
      </div>
    );
  }

  return (
    <div>
      <SectionHeader icon={CheckCircle2} title="Review and publish" copy="Check the essentials before making the restaurant website official." />
      <div className="mt-6 grid gap-3">
        {completion.items.map((item) => (
          <button
            key={item.label}
            onClick={() => onSectionChange(item.section)}
            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left"
          >
            <span>
              <span className="block font-semibold">{item.label}</span>
              <span className="mt-1 block text-sm text-slate-500">{item.description}</span>
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.done ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"}`}>
              {item.done ? "Ready" : "Needs work"}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm leading-6 text-orange-950">
        Publishing makes the restaurant website available at <b>/restaurants/{draft.slug || "restaurant-slug"}</b>. You can unpublish it again by turning off the published state and saving.
      </div>
      <ToggleCard label="Published" description="When enabled, this restaurant is meant to be visible as a public website." checked={draft.is_published} onChange={(is_published) => onChange({ is_published })} />
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  copy,
}: {
  icon: LucideIcon;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white">
        <Icon size={22} />
      </span>
      <div>
        <h2 className="text-3xl font-semibold">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{copy}</p>
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  active,
  onSelect,
}: {
  theme: Theme;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`group overflow-hidden rounded-3xl border text-left transition hover:-translate-y-0.5 hover:shadow-xl ${
        active ? "border-slate-950 bg-slate-950 text-white shadow-2xl" : "border-slate-200 bg-white"
      }`}
    >
      <div
        className="h-24"
        style={{
          background: `linear-gradient(135deg, ${theme.primary_color}, ${theme.secondary_color} 52%, ${theme.background_color})`,
        }}
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${active ? "text-white/45" : "text-slate-400"}`}>
              {themeMood(theme)}
            </p>
            <p className="mt-1 text-lg font-semibold">{theme.name}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-white text-slate-950" : "bg-slate-100 text-slate-500"}`}>
            {active ? "Selected" : "Select"}
          </span>
        </div>
        <p className={`mt-3 min-h-12 text-sm leading-6 ${active ? "text-white/62" : "text-slate-500"}`}>
          {theme.description || themeDescriptor(theme)}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {[theme.primary_color, theme.secondary_color, theme.background_color, theme.text_color].map((color) => (
              <span key={color} className="h-6 w-6 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: color }} />
            ))}
          </div>
          <span className={`text-xs font-semibold ${active ? "text-white/55" : "text-slate-400"}`}>
            {theme.menu_style || "menu"} / {theme.gallery_style || "gallery"}
          </span>
        </div>
      </div>
    </button>
  );
}

function ImageUrlField({
  label,
  value,
  preview,
  fallbackText,
  placeholder,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  preview: "logo" | "hero";
  fallbackText: string;
  placeholder: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const inputId = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-input`;

  useEffect(() => {
    setBroken(false);
  }, [value]);

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-semibold text-slate-700">{label}</label>
        {value && (
          <button type="button" onClick={onClear} className="text-xs font-semibold text-red-600" aria-label={`Clear ${label}`}>
            Clear
          </button>
        )}
      </div>
      <ImagePreview
        src={value}
        broken={broken}
        onBroken={() => setBroken(true)}
        fallbackText={broken ? "Image URL could not load" : fallbackText}
        variant={preview}
      />
      <input
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-normal text-slate-900 shadow-sm outline-none transition focus:border-slate-400 sm:text-sm"
      />
    </div>
  );
}

function GalleryUrlManager({
  draft,
  saving,
  onAddGalleryImage,
  onClearGalleryImage,
}: {
  draft: BuilderDraft;
  saving: boolean;
  onAddGalleryImage: (url: string, altText: string) => Promise<void>;
  onClearGalleryImage: (imageId: number) => Promise<void>;
}) {
  const [url, setUrl] = useState("");
  const [altText, setAltText] = useState("");
  const galleryImages = draft.images.filter((image) => ["gallery", "food"].includes(image.image_type));

  async function submitGalleryUrl() {
    if (!url.trim()) return;
    await onAddGalleryImage(url.trim(), altText.trim());
    setUrl("");
    setAltText("");
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Gallery URLs</p>
          <p className="mt-1 text-sm text-slate-500">Add polished gallery images by URL for now. Uploads stay in the image manager.</p>
        </div>
        {draft.id && (
          <Link href={`/admin/restaurants/${draft.id}/images`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold">
            <ImageIcon size={15} /> Image manager
          </Link>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Gallery image URL" value={url} placeholder="https://..." onChange={setUrl} />
        <Field label="Alt text" value={altText} placeholder={draft.name || "Dining room"} onChange={setAltText} />
      </div>
      <button
        type="button"
        onClick={submitGalleryUrl}
        disabled={saving || !draft.id || !url.trim()}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
        Add gallery URL
      </button>
      {!draft.id && <p className="mt-2 text-xs text-slate-500">Save the restaurant before adding gallery images.</p>}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {galleryImages.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-5 text-sm text-slate-500 sm:col-span-3">
            No gallery images yet. Add a URL after the restaurant is saved.
          </div>
        ) : (
          galleryImages.map((image) => (
            <GalleryImageCard key={image.id} image={image} saving={saving} onClear={() => onClearGalleryImage(image.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function GalleryImageCard({
  image,
  saving,
  onClear,
}: {
  image: RestaurantImage;
  saving: boolean;
  onClear: () => void;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
      <ImagePreview
        src={image.url}
        broken={broken}
        onBroken={() => setBroken(true)}
        fallbackText="Gallery image could not load"
        variant="gallery"
      />
      <div className="flex items-center justify-between gap-2 p-3">
        <p className="truncate text-xs font-semibold text-slate-500">{image.alt_text || image.url}</p>
        <button
          type="button"
          onClick={onClear}
          disabled={saving}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-red-600 shadow-sm disabled:opacity-45"
          aria-label={`Clear gallery image ${image.id}`}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function ImagePreview({
  src,
  broken,
  onBroken,
  fallbackText,
  variant,
}: {
  src: string;
  broken: boolean;
  onBroken: () => void;
  fallbackText: string;
  variant: "logo" | "hero" | "gallery";
}) {
  const sizeClass =
    variant === "logo"
      ? "h-28"
      : variant === "hero"
        ? "h-44"
        : "h-32";

  if (!src || broken) {
    return (
      <div className={`${sizeClass} grid place-items-center rounded-xl border border-dashed bg-slate-50 text-center text-xs font-semibold text-slate-400`}>
        <span>
          <ImageIcon className="mx-auto mb-2" size={20} />
          {fallbackText}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${variant} preview`}
      onError={onBroken}
      className={`${sizeClass} w-full rounded-xl object-cover`}
      loading="lazy"
      decoding="async"
    />
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-orange-600">*</span>}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-normal text-slate-900 shadow-sm outline-none transition focus:border-slate-400 sm:text-sm"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-32 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-normal leading-7 text-slate-900 shadow-sm outline-none transition focus:border-slate-400 sm:text-sm"
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <span className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
        <input type="color" value={safeColor(value)} onChange={(event) => onChange(event.target.value)} className="h-8 w-10 rounded border-0 bg-transparent p-0" />
        <input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-normal outline-none" />
      </span>
    </label>
  );
}

function ToggleCard({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex items-start justify-between gap-4 rounded-2xl border p-4 text-left transition ${
        checked ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-900"
      } disabled:cursor-not-allowed disabled:opacity-45`}
    >
      <span>
        <span className="block font-semibold">{label}</span>
        <span className={`mt-1 block text-sm leading-6 ${checked ? "text-white/62" : "text-slate-500"}`}>{description}</span>
      </span>
      <span className={`mt-1 h-6 w-11 shrink-0 rounded-full p-1 ${checked ? "bg-orange-400" : "bg-slate-200"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

function WebsitePreview({ draft, previewMode }: { draft: BuilderDraft; previewMode: PreviewMode }) {
  const serviceLine = [
    draft.reservations_enabled && "Reserve",
    draft.ordering_enabled && "Order",
    draft.chatbot_enabled && "AI Maitre d'",
  ].filter(Boolean).join(" / ");

  return (
    <div className={`mx-auto overflow-hidden rounded-[1.75rem] border border-black/10 shadow-2xl ${previewMode === "mobile" ? "max-w-[285px]" : "w-full"}`}>
      <div
        className="relative min-h-80 bg-cover bg-center p-5 text-white"
        style={{
          backgroundColor: draft.background_color || "#11110f",
          backgroundImage: draft.hero_image
            ? `linear-gradient(135deg, rgba(0,0,0,.78), rgba(0,0,0,.28)), url(${draft.hero_image})`
            : "linear-gradient(135deg, rgba(0,0,0,.92), rgba(30,25,18,.72))",
        }}
      >
        <div className="flex items-center gap-3">
          {draft.logo_url ? (
            <img src={draft.logo_url} alt="" className="h-11 w-11 rounded-full border border-white/35 object-cover" loading="lazy" decoding="async" />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/35 bg-white/15">
              <Store size={18} />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold">{draft.name || "Restaurant name"}</p>
            <p className="truncate text-xs text-white/58">{draft.city || "City"} / {serviceLine || "Menu and contact"}</p>
          </div>
        </div>
        <div className="absolute inset-x-5 bottom-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/50">{draft.tagline || "Premium restaurant website"}</p>
          <h3 className="mt-2 text-4xl font-semibold leading-none">{draft.name || "Your restaurant"}</h3>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/75">{draft.description || "A polished first impression for guests before they reserve, order, or visit."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {draft.reservations_enabled && <span className="rounded-full px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: draft.primary_color || "#c6a15b" }}>Reserve</span>}
            {draft.ordering_enabled && <span className="rounded-full border border-white/35 bg-white/10 px-3 py-2 text-xs font-bold">View menu</span>}
          </div>
        </div>
      </div>
      <div className="space-y-3 bg-white p-4 text-slate-900">
        <div className="rounded-2xl border border-slate-100 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Signature menu</p>
          <p className="mt-2 font-semibold">Premium menu cards inherit this brand style.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <PreviewPill label="Theme" value={draft.homepage_style || "editorial"} />
          <PreviewPill label="Menu" value={draft.menu_style || "refined"} />
        </div>
      </div>
    </div>
  );
}

function PreviewPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 truncate font-semibold capitalize">{value}</p>
    </div>
  );
}

function BuilderSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-3xl bg-white/75" />
      <div className="grid gap-6 xl:grid-cols-[260px_1fr_360px]">
        <div className="h-96 animate-pulse rounded-3xl bg-white/75" />
        <div className="h-[34rem] animate-pulse rounded-3xl bg-white/75" />
        <div className="h-[34rem] animate-pulse rounded-3xl bg-white/75" />
      </div>
    </div>
  );
}

function draftFromRestaurant(restaurant: Restaurant): BuilderDraft {
  return {
    id: restaurant.id,
    owner_id: restaurant.owner_id,
    theme_id: restaurant.theme_id,
    name: restaurant.name || "",
    slug: restaurant.slug || "",
    tagline: restaurant.tagline || "",
    description: restaurant.description || "",
    story: restaurant.story || "",
    address: restaurant.address || "",
    city: restaurant.city || "",
    postal_code: restaurant.postal_code || "",
    phone: restaurant.phone || "",
    email: restaurant.email || "",
    google_maps_url: restaurant.google_maps_url || "",
    facebook_url: restaurant.facebook_url || "",
    instagram_url: restaurant.instagram_url || "",
    tiktok_url: restaurant.tiktok_url || "",
    opening_hours: restaurant.opening_hours || "{}",
    logo_url: restaurant.logo_url || "",
    hero_image: restaurant.hero_image || "",
    reservation_url: restaurant.reservation_url || "",
    primary_color: restaurant.primary_color || "#c6a15b",
    secondary_color: restaurant.secondary_color || "#2c2925",
    background_color: restaurant.background_color || "#11110f",
    text_color: restaurant.text_color || "#f7f2e8",
    font_family: restaurant.font_family || "Cormorant Garamond",
    button_style: restaurant.button_style || "pill",
    homepage_style: restaurant.homepage_style || "editorial",
    menu_style: restaurant.menu_style || "refined",
    gallery_style: restaurant.gallery_style || "masonry",
    reservations_enabled: restaurant.reservations_enabled !== false,
    ordering_enabled: restaurant.ordering_enabled !== false,
    delivery_enabled: restaurant.delivery_enabled !== false,
    pickup_enabled: restaurant.pickup_enabled !== false,
    dine_in_enabled: restaurant.dine_in_enabled !== false,
    chatbot_enabled: restaurant.chatbot_enabled !== false,
    ai_name: restaurant.ai_name || "",
    ai_welcome_message: restaurant.ai_welcome_message || "",
    ai_tone: restaurant.ai_tone || "",
    ai_allowed_topics: restaurant.ai_allowed_topics || "",
    ai_fallback_message: restaurant.ai_fallback_message || "",
    ai_escalation_message: restaurant.ai_escalation_message || "",
    ai_language: restaurant.ai_language || "",
    ai_safety_instructions: restaurant.ai_safety_instructions || "",
    is_published: restaurant.is_published,
    images: restaurant.images || [],
  };
}

function payloadFromDraft(draft: BuilderDraft) {
  return {
    owner_id: draft.owner_id,
    theme_id: draft.theme_id,
    name: draft.name.trim(),
    slug: slugify(draft.slug || draft.name),
    tagline: draft.tagline,
    description: draft.description,
    story: draft.story,
    address: draft.address,
    city: draft.city,
    postal_code: draft.postal_code,
    phone: draft.phone,
    email: draft.email.trim(),
    google_maps_url: draft.google_maps_url,
    facebook_url: draft.facebook_url,
    instagram_url: draft.instagram_url,
    tiktok_url: draft.tiktok_url,
    opening_hours: draft.opening_hours,
    logo_url: draft.logo_url,
    hero_image: draft.hero_image,
    reservation_url: draft.reservation_url,
    primary_color: draft.primary_color,
    secondary_color: draft.secondary_color,
    background_color: draft.background_color,
    text_color: draft.text_color,
    font_family: draft.font_family,
    button_style: draft.button_style,
    homepage_style: draft.homepage_style,
    menu_style: draft.menu_style,
    gallery_style: draft.gallery_style,
    reservations_enabled: draft.reservations_enabled,
    ordering_enabled: draft.ordering_enabled,
    delivery_enabled: draft.ordering_enabled && draft.delivery_enabled,
    pickup_enabled: draft.ordering_enabled && draft.pickup_enabled,
    dine_in_enabled: draft.ordering_enabled && draft.dine_in_enabled,
    chatbot_enabled: draft.chatbot_enabled,
    ai_name: draft.ai_name,
    ai_welcome_message: draft.ai_welcome_message,
    ai_tone: draft.ai_tone,
    ai_allowed_topics: draft.ai_allowed_topics,
    ai_fallback_message: draft.ai_fallback_message,
    ai_escalation_message: draft.ai_escalation_message,
    ai_language: draft.ai_language,
    ai_safety_instructions: draft.ai_safety_instructions,
    is_published: draft.is_published,
  };
}

function validateDraft(draft: BuilderDraft) {
  const errors: string[] = [];
  if (!draft.name.trim()) errors.push("Restaurant name is required.");
  if (!draft.email.trim()) errors.push("Restaurant email is required.");
  if (!draft.city.trim()) errors.push("City is required.");
  if (!slugify(draft.slug || draft.name)) errors.push("A website slug is required.");
  if (draft.ordering_enabled && !draft.pickup_enabled && !draft.dine_in_enabled && !draft.delivery_enabled) {
    errors.push("At least one order mode must be enabled when online ordering is enabled.");
  }
  return errors;
}

function parseHours(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value || "{}");
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function safeColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#c6a15b";
}

function serializeDraft(draft: BuilderDraft) {
  return JSON.stringify(payloadFromDraft(draft));
}

function themeMood(theme: Theme) {
  const value = `${theme.key} ${theme.name}`.toLowerCase();
  if (value.includes("ultraviolet") || value.includes("cinematic") || value.includes("immersive")) return "Cinematic nocturne";
  if (value.includes("italian")) return "Italian warmth";
  if (value.includes("japanese") || value.includes("sushi")) return "Japanese minimal";
  if (value.includes("vegan")) return "Plant-led natural";
  if (value.includes("cafe")) return "Cafe comfort";
  if (value.includes("steak")) return "Fire and cellar";
  if (value.includes("elegant") || value.includes("fine") || value.includes("gold")) return "Quiet luxury";
  return "Premium restaurant mood";
}

function themeDescriptor(theme: Theme) {
  if (theme.homepage_style || theme.menu_style || theme.gallery_style) {
    return `${theme.homepage_style || "editorial"} homepage, ${theme.menu_style || "refined"} menu, ${theme.gallery_style || "gallery"} gallery.`;
  }
  return "A polished visual system for a restaurant website.";
}

function buildCompletion(draft: BuilderDraft) {
  const items = [
    {
      label: "Restaurant identity",
      description: "Name, slug, email, and city are present.",
      section: "basics" as const,
      done: Boolean(draft.name && draft.slug && draft.email && draft.city),
    },
    {
      label: "Customer contact",
      description: "Phone or address helps customers trust the restaurant.",
      section: "basics" as const,
      done: Boolean(draft.phone || draft.address),
    },
    {
      label: "Brand assets",
      description: "Theme and hero image create the public first impression.",
      section: "brand" as const,
      done: Boolean(draft.theme_id || draft.primary_color) && Boolean(draft.hero_image),
    },
    {
      label: "Restaurant story",
      description: "Description or story gives the website emotional context.",
      section: "content" as const,
      done: Boolean(draft.description || draft.story),
    },
    {
      label: "Service choices",
      description: "Reservations, ordering, and AI Maitre d' settings are reviewed.",
      section: "services" as const,
      done: draft.reservations_enabled || draft.ordering_enabled || draft.chatbot_enabled,
    },
  ];
  const score = Math.round((items.filter((item) => item.done).length / items.length) * 100);
  return { items, score };
}
