"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { User } from "@/lib/types";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setUsers(await adminRequest<User[]>("/admin/users", getToken()));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      await adminRequest("/admin/users", getToken(), { method: "POST", body: JSON.stringify(data) });
      form.reset();
      setStatus("Owner account created.");
      load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create account.");
    }
  }

  return (
    <AdminShell>
      <p className="text-sm font-semibold text-orange-600">Access</p>
      <h1 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">Users and owners</h1>
      <p className="mt-2 max-w-2xl text-slate-500">Create owner accounts for restaurants and review who can access the platform.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Give owner access</h2>
          <p className="text-sm leading-6 text-slate-500">Use a temporary password and ask the owner to replace it before production launch.</p>
          <input className="w-full rounded-xl border px-4 py-3" name="name" placeholder="Owner name" required />
          <input className="w-full rounded-xl border px-4 py-3" name="email" type="email" placeholder="Email" required />
          <input className="w-full rounded-xl border px-4 py-3" name="password" type="password" minLength={8} placeholder="Temporary password" required />
          <input type="hidden" name="role" value="RESTAURANT_OWNER" />
          <button className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white">Create owner account</button>
          {status && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{status}</p>}
        </form>

        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">All users</h2>
          <div className="mt-4 divide-y">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-16 animate-pulse py-4" />)
            ) : users.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No users found.</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-medium">{user.name || "Unnamed user"}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{user.role.replace("_", " ")}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
