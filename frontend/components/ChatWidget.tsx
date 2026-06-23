"use client";

import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import request from "@/lib/api";
import type { Message } from "@/lib/types";

const welcome: Message = {
  role: "assistant",
  content: "Ciao! Ask me about our menu, dietary options, opening hours, or what to order. I can guide you to add items from the menu.",
};

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
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [text, setText] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = text.trim();
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
      setMessages((current) => [
        ...current,
        { role: "assistant", content: response.answer },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I can’t connect right now. Please call the restaurant for help.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-4 flex h-[min(580px,75vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-black/10 bg-white shadow-soft">
          <div className="flex items-center justify-between bg-ink px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-tomato p-2"><Bot size={20} /></span>
              <div>
                <p className="font-semibold">{restaurantName} Assistant</p>
                <p className="text-xs text-stone-400">Restaurant answers, 24/7</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat"><X size={20} /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-stone-50 p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "ml-auto rounded-br-md text-white"
                    : "rounded-bl-md border bg-white text-stone-700"
                }`}
                style={message.role === "user" ? { backgroundColor: primaryColor } : undefined}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="w-fit rounded-2xl bg-white px-4 py-3 text-stone-500">
                <Loader2 size={18} className="animate-spin" />
              </div>
            )}
            <div ref={bottom} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t bg-white p-3">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Ask about the menu..."
              className="min-w-0 flex-1 rounded-full border px-4 py-3 text-sm"
            />
            <button
              className="rounded-full p-3 text-white disabled:opacity-50"
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
        className="ml-auto flex h-16 w-16 items-center justify-center rounded-full text-white shadow-soft transition hover:scale-105"
        style={{ backgroundColor: primaryColor }}
        aria-label="Open AI assistant"
      >
        {open ? <X /> : <MessageCircle />}
      </button>
    </div>
  );
}
