"use client";

import { Bot, Clock3, Loader2, MessageCircle, Send, ShieldCheck, ShoppingBag, Sparkles, Utensils, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import request from "@/lib/api";
import type { Message } from "@/lib/types";

function welcomeMessage(restaurantName: string): Message {
  return {
    role: "assistant",
    content: `Good evening. I am the AI maitre d' for ${restaurantName}. Tell me your mood, occasion, appetite, allergies, or timing, and I will guide you through the menu like a careful member of the dining room team.`,
  };
}

export default function ChatWidget({
  slug,
  restaurantName = "Restaurant",
  primaryColor = "#c84b31",
  menuHighlights = [],
  dietaryPrompts = [],
}: {
  slug?: string;
  restaurantName?: string;
  primaryColor?: string;
  menuHighlights?: string[];
  dietaryPrompts?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [welcomeMessage(restaurantName)]);
  const [text, setText] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const starterGroups = buildStarterGroups(menuHighlights, dietaryPrompts);

  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  async function send(event?: FormEvent, preset?: string) {
    event?.preventDefault();
    const message = (preset || text).trim();
    if (!message || loading) return;
    setText("");
    setMessages((current) => [...current, { role: "user", content: message }]);
    setLoading(true);
    try {
      const response = await request<{ answer: string; conversation_id: string; unanswered?: boolean }>(slug ? `/restaurants/${slug}/chat` : "/chat", {
        method: "POST",
        body: JSON.stringify({ message, conversation_id: conversationId }),
      });
      setConversationId(response.conversation_id);
      setMessages((current) => [...current, { role: "assistant", content: response.answer, is_unanswered: response.unanswered }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I can't connect right now. Please call the restaurant for help.",
          is_unanswered: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:right-5">
      {open && (
        <div className="mb-4 flex h-[min(720px,84vh)] w-[min(450px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-2xl">
          <div className="relative overflow-hidden px-5 py-5 text-white" style={{ backgroundColor: primaryColor }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,.28),transparent_16rem)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/18 shadow-lg">
                  <Bot size={22} />
                </span>
                <div>
                  <p className="font-semibold leading-tight">{restaurantName} Maitre d'</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-white/80"><Sparkles size={12} /> Mood, pairings, reservations</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full bg-white/15 p-2 hover:bg-white/25">
                <X size={18} />
              </button>
            </div>
            <p className="relative mt-4 rounded-2xl bg-white/12 p-3 text-sm leading-6 text-white/85">
              Start with a craving, an allergy, a date-night plan, or a pickup time. I will suggest a thoughtful path through the restaurant.
            </p>
          </div>

          <div className="border-b bg-white px-4 py-3 text-xs leading-5 text-stone-500">
            <p className="flex items-start gap-2"><ShieldCheck size={15} className="mt-0.5 text-green-700" /> I answer only from restaurant knowledge. For allergies, please confirm with staff before ordering.</p>
          </div>

          <div className="grid grid-cols-3 border-b bg-white text-center text-[11px] font-bold text-stone-500">
            <button onClick={() => send(undefined, "Recommend a full meal for my mood tonight")} className="flex items-center justify-center gap-1 border-r px-2 py-3 hover:bg-stone-50">
              <Utensils size={14} /> Meal
            </button>
            <button onClick={() => send(undefined, "Help me build a pickup order")} className="flex items-center justify-center gap-1 border-r px-2 py-3 hover:bg-stone-50">
              <ShoppingBag size={14} /> Order
            </button>
            <button onClick={() => send(undefined, "Can I reserve a table?")} className="flex items-center justify-center gap-1 px-2 py-3 hover:bg-stone-50">
              <Clock3 size={14} /> Reserve
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f3ea] p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  message.role === "user"
                    ? "ml-auto rounded-br-md text-white"
                    : message.is_unanswered
                      ? "rounded-bl-md border border-amber-100 bg-amber-50 text-amber-950"
                      : "rounded-bl-md border border-black/5 bg-white text-stone-700"
                }`}
                style={message.role === "user" ? { backgroundColor: primaryColor } : undefined}
              >
                {message.content}
              </div>
            ))}

            {messages.length === 1 && (
              <div className="space-y-3 pt-1">
                {starterGroups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">{group.label}</p>
                    <div className="grid gap-2">
                      {group.questions.map((question) => (
                        <button
                          key={question}
                          onClick={() => send(undefined, question)}
                          className="rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-left text-xs font-semibold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:border-black/20"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex w-fit items-center gap-2 rounded-2xl rounded-bl-md border border-black/5 bg-white px-4 py-3 text-sm text-stone-500 shadow-sm">
                <Loader2 size={16} className="animate-spin" /> Checking menu, hours, and policies...
              </div>
            )}
            <div ref={bottom} />
          </div>

          <form onSubmit={(event) => send(event)} className="flex gap-2 border-t bg-white p-3">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={loading ? "AI maitre d' is checking..." : "Tell me your mood, allergies, occasion..."}
              className="min-w-0 flex-1 rounded-full border px-4 py-3 text-sm outline-none focus:border-stone-500"
              disabled={loading}
            />
            <button
              className="rounded-full p-3 text-white shadow-lg disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
              disabled={!text.trim() || loading}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="ml-auto flex h-16 w-16 items-center justify-center rounded-full text-white shadow-2xl transition hover:scale-105 hover:shadow-[0_22px_60px_rgba(0,0,0,.28)]"
        style={{ backgroundColor: primaryColor }}
        aria-label="Open AI assistant"
      >
        {open ? <X /> : <MessageCircle />}
      </button>
    </div>
  );
}

function buildStarterGroups(menuHighlights: string[], dietaryPrompts: string[]) {
  const highlighted = menuHighlights.slice(0, 3);
  const dishPrompts = highlighted.length > 0
    ? highlighted.map((dish) => `What pairs well with ${dish}?`)
    : ["What should I order?", "What is popular today?", "Suggest a full meal"];

  return [
    {
      label: "Recommendations",
      questions: ["I want something comforting tonight", "Plan a date-night order", ...dishPrompts].slice(0, 4),
    },
    {
      label: "Diet and allergies",
      questions: dietaryPrompts.length > 0 ? dietaryPrompts.slice(0, 4) : ["What is vegetarian?", "Any gluten-free options?", "What contains nuts?"],
    },
    {
      label: "Ordering and reservations",
      questions: ["Build a pickup order for two", "Guide me before I reserve", "What should I order before a movie?", "How does dine-in ordering work?"],
    },
  ];
}
