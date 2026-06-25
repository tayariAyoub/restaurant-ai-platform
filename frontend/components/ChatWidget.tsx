"use client";

import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import request from "@/lib/api";
import type { Message } from "@/lib/types";

const starterQuestions = ["What should I order?", "Any vegetarian options?", "When are you open?"];

function welcomeMessage(restaurantName: string): Message {
  return {
    role: "assistant",
    content: `Welcome to ${restaurantName}. I can help with menu questions, allergens, opening hours, recommendations, and ordering.`,
  };
}

export default function ChatWidget({
  slug,
  restaurantName = "Restaurant",
  primaryColor = "#c84b31",
}: {
  slug?: string;
  restaurantName?: string;
  primaryColor?: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [welcomeMessage(restaurantName)]);
  const [text, setText] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  async function send(event?: FormEvent, preset?: string) {
    event?.preventDefault();
    const message = (preset || text).trim();
    if (!message || loading) return;
    setText("");
    setMessages((current) => [...current, { role: "user", content: message }]);
    setLoading(true);
    try {
      const response = await request<{ answer: string; conversation_id: string }>(slug ? `/restaurants/${slug}/chat` : "/chat", {
        method: "POST",
        body: JSON.stringify({ message, conversation_id: conversationId }),
      });
      setConversationId(response.conversation_id);
      setMessages((current) => [...current, { role: "assistant", content: response.answer }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I can't connect right now. Please call the restaurant for help.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:right-5">
      {open && (
        <div className="mb-4 flex h-[min(620px,78vh)] w-[min(410px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl">
          <div className="relative overflow-hidden px-5 py-5 text-white" style={{ backgroundColor: primaryColor }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,.28),transparent_16rem)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/18 shadow-lg">
                  <Bot size={22} />
                </span>
                <div>
                  <p className="font-semibold leading-tight">{restaurantName} Assistant</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-white/78"><Sparkles size={12} /> Restaurant-trained answers</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full bg-white/15 p-2 hover:bg-white/25">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f3ea] p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  message.role === "user"
                    ? "ml-auto rounded-br-md text-white"
                    : "rounded-bl-md border border-black/5 bg-white text-stone-700"
                }`}
                style={message.role === "user" ? { backgroundColor: primaryColor } : undefined}
              >
                {message.content}
              </div>
            ))}

            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {starterQuestions.map((question) => (
                  <button
                    key={question}
                    onClick={() => send(undefined, question)}
                    className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:border-black/20"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex w-fit items-center gap-2 rounded-2xl rounded-bl-md border border-black/5 bg-white px-4 py-3 text-sm text-stone-500 shadow-sm">
                <Loader2 size={16} className="animate-spin" /> Checking restaurant knowledge...
              </div>
            )}
            <div ref={bottom} />
          </div>

          <form onSubmit={(event) => send(event)} className="flex gap-2 border-t bg-white p-3">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Ask about menu, allergens, hours..."
              className="min-w-0 flex-1 rounded-full border px-4 py-3 text-sm"
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
        className="ml-auto flex h-16 w-16 items-center justify-center rounded-full text-white shadow-2xl transition hover:scale-105"
        style={{ backgroundColor: primaryColor }}
        aria-label="Open AI assistant"
      >
        {open ? <X /> : <MessageCircle />}
      </button>
    </div>
  );
}
