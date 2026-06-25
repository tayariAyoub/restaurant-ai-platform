"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import request from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    <main className="grid min-h-screen place-items-center bg-[#111827] p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">RestaurantAI</p>
        <h1 className="mt-3 text-4xl font-semibold">Welcome back.</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">Manage restaurant websites, orders, reservations, and AI employee knowledge.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input className="w-full rounded-xl border px-4 py-3" name="email" type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <input className="w-full rounded-xl border px-4 py-3" name="password" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button disabled={loading} className="w-full rounded-xl bg-orange-600 py-3.5 font-semibold text-white shadow-lg disabled:opacity-60">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 rounded-xl bg-stone-100 p-3 text-xs leading-5 text-stone-600">
          <p className="font-semibold text-stone-800">Demo accounts</p>
          <div className="mt-3 grid gap-2">
            <button type="button" onClick={() => { setEmail("owner@restaurantai.com"); setPassword("owner12345"); }} className="rounded-lg bg-white px-3 py-2 text-left shadow-sm">
              Restaurant owner: owner@restaurantai.com / owner12345
            </button>
            <button type="button" onClick={() => { setEmail("admin@restaurantai.com"); setPassword("admin12345"); }} className="rounded-lg bg-white px-3 py-2 text-left shadow-sm">
              Super admin: admin@restaurantai.com / admin12345
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
