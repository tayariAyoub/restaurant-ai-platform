"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { User } from "@/lib/types";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]); const [status, setStatus] = useState("");
  const load = () => adminRequest<User[]>("/admin/users", getToken()).then(setUsers);
  useEffect(() => { load(); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form)); try { await adminRequest("/admin/users", getToken(), { method: "POST", body: JSON.stringify(data) }); form.reset(); setStatus("Owner account created."); load(); } catch (e) { setStatus(e instanceof Error ? e.message : "Could not create account"); } }
  return <AdminShell><p className="text-sm font-semibold text-orange-600">Access</p><h1 className="mt-1 text-4xl font-semibold">Users & owners</h1><div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><form onSubmit={submit} className="h-fit space-y-4 rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold">Give owner access</h2><input className="w-full rounded-xl border px-4 py-3" name="name" placeholder="Owner name" required /><input className="w-full rounded-xl border px-4 py-3" name="email" type="email" placeholder="Email" required /><input className="w-full rounded-xl border px-4 py-3" name="password" type="password" minLength={8} placeholder="Temporary password" required /><input type="hidden" name="role" value="RESTAURANT_OWNER" /><button className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white">Create owner account</button>{status && <p className="text-sm text-slate-600">{status}</p>}</form><div className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold">All users</h2><div className="mt-4 divide-y">{users.map((user) => <div key={user.id} className="flex justify-between gap-4 py-4"><div><p className="font-medium">{user.name || "Unnamed user"}</p><p className="text-sm text-slate-500">{user.email}</p></div><span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{user.role.replace("_", " ")}</span></div>)}</div></div></div></AdminShell>;
}
