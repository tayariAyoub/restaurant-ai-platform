"use client";

import { FormEvent, useState } from "react";

import PublicShell from "@/components/PublicShell";
import request from "@/lib/api";

const inputClass = "w-full rounded-xl border border-black/15 bg-white px-4 py-3";

export default function ContactPage() {
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Sending…");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      await request("/contact", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          party_size: payload.party_size ? Number(payload.party_size) : null,
        }),
      });
      event.currentTarget.reset();
      setStatus("Thank you — we’ll contact you shortly to confirm.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send request.");
    }
  }

  return (
    <PublicShell>
      {(restaurant) => (
        <main>
          <section className="bg-ink px-6 pb-20 pt-36 text-center text-white">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-orange-300">Come by</p>
            <h1 className="mt-4 text-6xl font-semibold">Visit &amp; reserve</h1>
          </section>
          <section className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <h2 className="text-4xl font-semibold">Find us</h2>
              <div className="mt-7 space-y-6 text-stone-600">
                <div><p className="font-semibold text-ink">Address</p><p>{restaurant.address}<br />{restaurant.postal_code} {restaurant.city}</p></div>
                <div><p className="font-semibold text-ink">Contact</p><p>{restaurant.phone}<br />{restaurant.email}</p></div>
                <div><p className="font-semibold text-ink">Opening hours</p><p className="whitespace-pre-line leading-7">{restaurant.opening_hours}</p></div>
              </div>
            </div>
            <form id="reservation" onSubmit={submit} className="rounded-3xl bg-white p-7 shadow-soft sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-tomato">Request a table</p>
              <h2 className="mt-3 text-4xl font-semibold">We’ll save you a seat.</h2>
              <p className="mt-2 text-sm text-stone-500">Requests are confirmed by our team by phone or email.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <input className={inputClass} name="name" placeholder="Your name" required />
                <input className={inputClass} name="email" type="email" placeholder="Email address" required />
                <input className={inputClass} name="phone" placeholder="Phone number" />
                <input className={inputClass} name="party_size" type="number" min="1" max="100" placeholder="Guests" />
                <input className={`${inputClass} sm:col-span-2`} name="requested_at" type="datetime-local" />
                <textarea className={`${inputClass} min-h-28 sm:col-span-2`} name="message" placeholder="Anything we should know?" />
              </div>
              <button className="mt-5 w-full rounded-xl bg-tomato px-6 py-4 font-semibold text-white hover:bg-red-700">
                Send reservation request
              </button>
              {status && <p className="mt-4 text-center text-sm text-stone-600">{status}</p>}
            </form>
          </section>
        </main>
      )}
    </PublicShell>
  );
}

