"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  Save,
  ShieldCheck,
  Sparkles,
  Upload,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/admin/AdminShell";
import request, { adminRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ChatResponse, Conversation, Restaurant } from "@/lib/types";

type Document = { id: number; filename: string; status: string; created_at: string };
type SaveState = "saved" | "saving" | "unsaved";
type ToastState = { type: "success" | "error"; message: string } | null;
type TestMessage = { role: "user" | "assistant"; content: string; sources?: string[]; unanswered?: boolean };

const cardClass = "rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6";
const inputClass = "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-500";
const textareaClass = `${inputClass} min-h-28`;

const quickQuestions = [
  "What should I order for a date night?",
  "Which dishes are vegetarian?",
  "What should I know about allergies?",
  "When are you open this weekend?",
  "Can I reserve a table?",
  "Can I order for pickup?",
];

export default function AiControlPanel({ restaurantId }: { restaurantId: number }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [testText, setTestText] = useState("");
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [toast, setToast] = useState<ToastState>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, [restaurantId]);

  const menuItems = useMemo(
    () => restaurant?.categories.flatMap((category) => category.items) ?? [],
    [restaurant],
  );
  const unansweredQuestions = useMemo(
    () => buildUnansweredQuestions(conversations),
    [conversations],
  );
  const readiness = useMemo(
    () => buildReadiness(restaurant, documents, unansweredQuestions.length),
    [restaurant, documents, unansweredQuestions.length],
  );

  async function load() {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const [restaurantData, documentData, conversationData] = await Promise.all([
        adminRequest<Restaurant>(`/admin/restaurants/${restaurantId}`, token),
        adminRequest<Document[]>(`/admin/restaurants/${restaurantId}/documents`, token),
        adminRequest<Conversation[]>(`/admin/restaurants/${restaurantId}/conversations`, token),
      ]);
      setRestaurant(restaurantData);
      setDocuments(documentData);
      setConversations(conversationData);
      setSaveState("saved");
      setTestMessages([
        {
          role: "assistant",
          content: restaurantData.ai_welcome_message
            || `Good evening. Ask ${restaurantData.ai_name || "AI Maitre d'"} a menu, allergy, hours, reservation, or ordering question.`,
        },
      ]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load AI settings.");
    } finally {
      setLoading(false);
    }
  }

  function updateRestaurant(values: Partial<Restaurant>) {
    setRestaurant((current) => (current ? { ...current, ...values } : current));
    setSaveState("unsaved");
    setToast(null);
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!restaurant) return;
    setSaveState("saving");
    setToast(null);
    try {
      const updated = await adminRequest<Restaurant>(`/admin/restaurants/${restaurant.id}`, getToken(), {
        method: "PUT",
        body: JSON.stringify(restaurantPayload(restaurant)),
      });
      setRestaurant(updated);
      setSaveState("saved");
      setToast({ type: "success", message: "AI settings saved." });
    } catch (saveError) {
      setSaveState("unsaved");
      setToast({
        type: "error",
        message: saveError instanceof Error ? saveError.message : "Could not save AI settings.",
      });
    }
  }

  async function runTest(event?: FormEvent<HTMLFormElement>, preset?: string) {
    event?.preventDefault();
    if (!restaurant) return;
    const message = (preset || testText).trim();
    if (!message || testing) return;
    setTesting(true);
    setTestText("");
    setTestMessages((current) => [...current, { role: "user", content: message }]);
    try {
      const response = await request<ChatResponse>(`/restaurants/${restaurant.slug}/chat`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setTestMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.answer,
          sources: response.sources,
          unanswered: response.unanswered,
        },
      ]);
      const conversationData = await adminRequest<Conversation[]>(
        `/admin/restaurants/${restaurant.id}/conversations`,
        getToken(),
      );
      setConversations(conversationData);
    } catch (testError) {
      const rateLimited = testError instanceof Error && /too many requests|rate limit|429/i.test(testError.message);
      setTestMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: rateLimited
            ? "The test endpoint is rate limited for a moment. Wait briefly, then test again."
            : "The AI test could not connect. Check backend logs or OpenAI configuration.",
          unanswered: true,
        },
      ]);
    } finally {
      setTesting(false);
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!restaurant) return;
    const form = event.currentTarget;
    setUploading(true);
    setToast(null);
    try {
      await adminRequest(`/admin/restaurants/${restaurant.id}/documents`, getToken(), {
        method: "POST",
        body: new FormData(form),
      });
      form.reset();
      setDocuments(await adminRequest<Document[]>(`/admin/restaurants/${restaurant.id}/documents`, getToken()));
      setToast({ type: "success", message: "Knowledge document processed." });
    } catch (uploadError) {
      setToast({
        type: "error",
        message: uploadError instanceof Error ? uploadError.message : "Could not process document.",
      });
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <div className="space-y-6">
          <div className="h-24 animate-pulse rounded-3xl bg-white/75" />
          <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
            <div className="h-[32rem] animate-pulse rounded-3xl bg-white/75" />
            <div className="h-[32rem] animate-pulse rounded-3xl bg-white/75" />
          </div>
        </div>
      </AdminShell>
    );
  }

  if (!restaurant || error) {
    return (
      <AdminShell>
        <MessageBanner type="error" message={error || "Restaurant not found."} />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-orange-600">AI control panel</p>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">{restaurant.name} AI Maitre d&apos;</h1>
            <p className="mt-3 max-w-3xl text-slate-500">
              Configure the public AI, test answers before guests see them, and review missing knowledge from real customer questions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SaveStatusBadge state={saveState} />
            <Link href={`/admin/builder/${restaurant.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold shadow-sm">
              <ArrowLeft size={16} /> Visual Builder
            </Link>
            <Link href={`/admin/builder/${restaurant.id}/menu`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold shadow-sm">
              <UtensilsCrossed size={16} /> Menu Builder
            </Link>
            <Link href={`/restaurants/${restaurant.slug}`} target="_blank" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm">
              <ExternalLink size={16} /> Open public site
            </Link>
          </div>
        </div>

        {toast && <MessageBanner type={toast.type} message={toast.message} />}

        <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/45">AI readiness</p>
                  <p className="mt-3 text-5xl font-semibold">{readiness.score}%</p>
                  <p className="mt-2 text-sm text-white/55">Grounded restaurant knowledge</p>
                </div>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10"><Bot size={26} /></span>
              </div>
              <div className="mt-5 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-orange-400" style={{ width: `${readiness.score}%` }} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Metric label="Menu facts" value={menuItems.length} />
                <Metric label="Documents" value={documents.length} />
                <Metric label="Conversations" value={conversations.length} />
                <Metric label="AI gaps" value={unansweredQuestions.length} />
              </div>
            </section>

            <section className={cardClass}>
              <SectionHeader icon={ShieldCheck} title="Knowledge sources" description="The AI uses these facts before answering guests." />
              <div className="mt-5 grid gap-3">
                {readiness.items.map((item) => (
                  <ReadinessItem key={item.title} item={item} />
                ))}
              </div>
            </section>

            <form onSubmit={uploadDocument} className={cardClass}>
              <SectionHeader icon={FileText} title="Add knowledge" description="Upload PDF or TXT facts for policies, allergens, private dining, catering, or FAQs." />
              <input className="mt-5 w-full rounded-2xl border p-3 text-sm" name="file" type="file" accept=".pdf,.txt" required />
              <button disabled={uploading} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading ? "Processing..." : "Process document"}
              </button>
            </form>
          </aside>

          <main className="space-y-6">
            <form onSubmit={saveSettings} className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <SectionHeader icon={Sparkles} title="AI settings" description="Control how the restaurant-owned AI appears and what it is allowed to answer." />
                <button disabled={saveState === "saving"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-wait disabled:opacity-60">
                  {saveState === "saving" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saveState === "saving" ? "Saving..." : "Save settings"}
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <ToggleCard
                  label="Public chatbot enabled"
                  description="Show or hide the AI Maitre d' on the public restaurant page."
                  checked={restaurant.chatbot_enabled}
                  onChange={(chatbot_enabled) => updateRestaurant({ chatbot_enabled })}
                />
                <Field label="AI name" value={restaurant.ai_name} placeholder="AI Maitre d'" onChange={(ai_name) => updateRestaurant({ ai_name })} />
                <Field label="Language preference" value={restaurant.ai_language} placeholder="English, German, French..." onChange={(ai_language) => updateRestaurant({ ai_language })} />
                <Field label="Tone / personality" value={restaurant.ai_tone} placeholder="Warm, precise, luxury hospitality..." onChange={(ai_tone) => updateRestaurant({ ai_tone })} />
                <TextArea label="Welcome message" value={restaurant.ai_welcome_message} placeholder="The first message guests see when opening chat." onChange={(ai_welcome_message) => updateRestaurant({ ai_welcome_message })} />
                <TextArea label="Allowed topics" value={restaurant.ai_allowed_topics} placeholder="Menu, allergens, reservations, opening hours, pickup, delivery..." onChange={(ai_allowed_topics) => updateRestaurant({ ai_allowed_topics })} />
                <TextArea label="Fallback message" value={restaurant.ai_fallback_message} placeholder="What the AI says when information is missing." onChange={(ai_fallback_message) => updateRestaurant({ ai_fallback_message })} />
                <TextArea label="Escalation / contact message" value={restaurant.ai_escalation_message} placeholder="What the AI says when guests should contact the restaurant." onChange={(ai_escalation_message) => updateRestaurant({ ai_escalation_message })} />
                <label className="text-sm font-medium md:col-span-2">
                  Safety instructions
                  <textarea
                    className={textareaClass}
                    value={restaurant.ai_safety_instructions}
                    placeholder="Never invent prices, allergens, opening hours, discounts, or availability."
                    onChange={(event) => updateRestaurant({ ai_safety_instructions: event.target.value })}
                  />
                </label>
              </div>
            </form>

            <section className={cardClass}>
              <SectionHeader icon={MessageSquare} title="Test before publishing" description="Ask customer-style questions and confirm the answer is grounded in restaurant data." />
              <div className="mt-5 rounded-3xl border border-slate-100 bg-[#f7f3ea] p-4">
                <div className="max-h-[440px] space-y-3 overflow-y-auto pr-1">
                  {testMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                        message.role === "user"
                          ? "ml-auto rounded-br-md bg-slate-950 text-white"
                          : message.unanswered
                            ? "rounded-bl-md border border-amber-100 bg-amber-50 text-amber-950"
                            : "rounded-bl-md border border-black/5 bg-white text-slate-700"
                      }`}
                    >
                      {message.content}
                      {message.sources && message.sources.length > 0 && (
                        <p className="mt-2 text-[11px] font-bold uppercase tracking-wider opacity-50">
                          Sources: {message.sources.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                  {testing && (
                    <div className="flex w-fit items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">
                      <Loader2 size={16} className="animate-spin" /> Checking restaurant knowledge...
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {quickQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => runTest(undefined, question)}
                      disabled={testing}
                      className="min-h-10 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm disabled:cursor-wait disabled:opacity-60"
                    >
                      {question}
                    </button>
                  ))}
                </div>
                <form onSubmit={runTest} className="mt-4 flex gap-2">
                  <input
                    value={testText}
                    onChange={(event) => setTestText(event.target.value)}
                    placeholder="Ask a test question..."
                    className="min-h-12 min-w-0 flex-1 rounded-full border px-4 py-3 text-base outline-none focus:border-slate-500 sm:text-sm"
                  />
                  <button disabled={!testText.trim() || testing} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50">
                    {testing ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                    Send
                  </button>
                </form>
              </div>
            </section>

            <section className={cardClass}>
              <SectionHeader icon={AlertTriangle} title="Unanswered questions" description="Use real fallbacks to identify missing knowledge before they cost trust." />
              {unansweredQuestions.length === 0 ? (
                <EmptyState title="No unanswered questions" description="No AI gaps are waiting right now. Keep reviewing this after menu or hours changes." />
              ) : (
                <div className="mt-5 space-y-3">
                  {unansweredQuestions.slice(0, 8).map((item) => (
                    <article key={`${item.conversationId}-${item.index}`} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Missing knowledge</p>
                          <p className="mt-2 font-semibold text-amber-950">{item.question}</p>
                          <p className="mt-2 text-sm leading-6 text-amber-900">{suggestKnowledge(item.question)}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-800">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className={cardClass}>
              <SectionHeader icon={FileText} title="Uploaded knowledge" description="Documents extend the AI beyond profile, opening hours, services, and menu facts." />
              {documents.length === 0 ? (
                <EmptyState title="No documents uploaded" description="Add an allergen sheet, FAQ, private dining policy, or delivery rules when those details matter." />
              ) : (
                <div className="mt-5 divide-y">
                  {documents.map((document) => (
                    <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                      <span className="font-medium">{document.filename}</span>
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{document.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </AdminShell>
  );
}

function restaurantPayload(restaurant: Restaurant) {
  const { id, owner, theme, categories, images, created_at, ...payload } = restaurant;
  return payload;
}

function buildUnansweredQuestions(conversations: Conversation[]) {
  return conversations.flatMap((conversation) =>
    conversation.messages
      .map((message, index) => {
        if (message.role !== "assistant" || !message.is_unanswered) return null;
        const previous = conversation.messages[index - 1];
        return {
          conversationId: conversation.id,
          index,
          question: previous?.role === "user" ? previous.content : message.content,
          createdAt: message.created_at || conversation.updated_at || conversation.created_at,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item)),
  );
}

function buildReadiness(restaurant: Restaurant | null, documents: Document[], unanswered: number) {
  const menuItems = restaurant?.categories.flatMap((category) => category.items) ?? [];
  const items = [
    {
      title: "Restaurant profile",
      description: "Name, story, address, phone, and email are available.",
      ready: Boolean(restaurant?.description && restaurant.phone && restaurant.address),
    },
    {
      title: "Opening hours",
      description: "Weekly schedule is available for hours questions.",
      ready: Boolean(restaurant?.opening_hours && restaurant.opening_hours !== "{}"),
    },
    {
      title: "Menu and prices",
      description: `${menuItems.length} menu items are available with prices.`,
      ready: menuItems.length > 0,
    },
    {
      title: "Allergen safety",
      description: "Menu allergens or uploaded documents support allergy questions.",
      ready: menuItems.some((item) => item.allergens) || documents.some((doc) => /allergen/i.test(doc.filename)),
    },
    {
      title: "Service modes",
      description: "Reservation, ordering, pickup, delivery, and dine-in settings are included.",
      ready: Boolean(restaurant?.reservations_enabled || restaurant?.ordering_enabled),
    },
    {
      title: "AI gaps",
      description: "Recent unanswered questions should be reviewed.",
      ready: unanswered === 0,
    },
  ];
  return {
    items,
    score: Math.round((items.filter((item) => item.ready).length / items.length) * 100),
  };
}

function suggestKnowledge(question: string) {
  if (/allerg|gluten|nut|milk|egg|vegan|vegetarian/i.test(question)) {
    return "Add exact allergen and dietary notes to the menu item, or upload an allergen sheet.";
  }
  if (/reserve|table|booking|cancel/i.test(question)) {
    return "Add reservation policy, booking limits, cancellation rules, and contact instructions.";
  }
  if (/open|hour|time|closed/i.test(question)) {
    return "Review opening hours and special holiday hours in restaurant information.";
  }
  if (/deliver|pickup|order/i.test(question)) {
    return "Add ordering, pickup, delivery, and service-mode details.";
  }
  return "Add a concise answer as restaurant information or upload a small FAQ document.";
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600"><Icon size={20} /></span>
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function Field({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input className={inputClass} value={value || ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <textarea className={textareaClass} value={value || ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ToggleCard({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-2xl border p-4 text-left transition ${checked ? "border-slate-950 bg-slate-950 text-white shadow-lg" : "border-slate-200 bg-slate-50 text-slate-700"}`}
      aria-pressed={checked}
    >
      <span className="flex items-center justify-between gap-4">
        <span className="font-semibold">{label}</span>
        <span className={`grid h-6 w-6 place-items-center rounded-full ${checked ? "bg-white text-slate-950" : "bg-white text-slate-300"}`}>
          <CheckCircle2 size={15} />
        </span>
      </span>
      <span className={`mt-2 block text-sm leading-6 ${checked ? "text-white/70" : "text-slate-500"}`}>{description}</span>
    </button>
  );
}

function ReadinessItem({ item }: { item: { title: string; description: string; ready: boolean } }) {
  return (
    <div className={`rounded-2xl border p-4 ${item.ready ? "border-green-100 bg-green-50 text-green-800" : "border-amber-100 bg-amber-50 text-amber-900"}`}>
      <p className="font-semibold">{item.title}</p>
      <p className="mt-1 text-xs leading-5 opacity-80">{item.description}</p>
      <p className="mt-3 text-xs font-bold uppercase tracking-wider">{item.ready ? "Ready" : "Needs attention"}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <b className="block text-2xl">{value}</b>
      <span className="text-xs text-white/55">{label}</span>
    </div>
  );
}

function SaveStatusBadge({ state }: { state: SaveState }) {
  const label = state === "saving" ? "Saving" : state === "unsaved" ? "Unsaved" : "Saved";
  const classes = state === "saved"
    ? "border-green-100 bg-green-50 text-green-700"
    : state === "saving"
      ? "border-amber-100 bg-amber-50 text-amber-800"
      : "border-orange-100 bg-orange-50 text-orange-800";
  return <span className={`inline-flex min-h-11 items-center rounded-xl border px-3 py-2 text-sm font-semibold ${classes}`}>{label}</span>;
}

function MessageBanner({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
      {message}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <p className="font-semibold text-slate-700">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
