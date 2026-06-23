"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import request from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await request<{ access_token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      localStorage.setItem("restaurant_ai_token", response.access_token);
      router.push("/admin");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-tomato">RestaurantAI</p>
        <h1 className="mt-3 text-4xl font-semibold">Welcome back.</h1>
        <p className="mt-2 text-sm text-stone-500">Manage your website and assistant knowledge.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input className="w-full rounded-xl border px-4 py-3" name="email" type="email" placeholder="Email" required />
          <input className="w-full rounded-xl border px-4 py-3" name="password" type="password" placeholder="Password" required />
          <button disabled={loading} className="w-full rounded-xl bg-tomato py-3.5 font-semibold text-white disabled:opacity-60">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <p className="mt-6 rounded-xl bg-stone-100 p-3 text-xs text-stone-500">
          Use the admin or restaurant-owner credentials configured in your local environment.
        </p>
      </div>
    </main>
  );
}
