"use client";

import {
  Building2,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { adminRequest } from "@/lib/api";
import { getToken, logout } from "@/lib/auth";
import type { RestaurantOverview, User } from "@/lib/types";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [previewSlug, setPreviewSlug] = useState("bella-napoli");

  useEffect(() => {
    const token = getToken();
    if (!token) return router.replace("/admin/login");
    Promise.all([
      adminRequest<User>("/auth/me", token),
      adminRequest<RestaurantOverview[]>("/admin/restaurants-overview", token),
    ])
      .then(([userData, restaurants]) => {
        setUser(userData);
        if (restaurants[0]?.slug) setPreviewSlug(restaurants[0].slug);
      })
      .catch(() => logout());
  }, [router]);

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] text-slate-500">
        <div className="rounded-2xl border bg-white px-6 py-5 shadow-sm">Opening your workspace...</div>
      </main>
    );
  }

  const links = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/restaurants", label: "Restaurants", icon: Building2 },
    ...(user.role === "SUPER_ADMIN"
      ? [
          { href: "/admin/restaurants/new", label: "New restaurant", icon: PlusCircle },
          { href: "/admin/users", label: "Users", icon: Users },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-[#111827] p-5 text-white shadow-2xl lg:block">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-display text-2xl font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500 text-white"><Sparkles size={18} /></span>
          RestaurantAI
        </Link>
        <p className="mt-2 text-xs text-slate-400">Website + AI employee + ordering</p>
        <nav className="mt-9 space-y-1">
          {links.map((item) => {
            const active =
              pathname === item.href ||
              (item.href === "/admin/restaurants" &&
                pathname.startsWith("/admin/restaurants/") &&
                pathname !== "/admin/restaurants/new");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  active ? "bg-white text-slate-900 shadow-lg" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="truncate text-sm font-medium">{user.name || user.email}</p>
          <p className="mt-1 text-xs text-slate-400">{user.role.replace("_", " ")}</p>
          <button onClick={logout} className="mt-3 flex items-center gap-2 text-xs text-slate-300 hover:text-white">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-black/5 bg-white/90 px-5 backdrop-blur lg:px-8">
          <div className="lg:hidden">
            <Link href="/admin/dashboard" className="font-display text-xl font-semibold">RestaurantAI</Link>
          </div>
          <p className="hidden text-sm text-slate-500 lg:block">Manage every restaurant without touching code.</p>
          <Link
            href={`/restaurants/${previewSlug}`}
            target="_blank"
            className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
          >
            View website <ExternalLink size={15} />
          </Link>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b bg-white px-4 py-2 lg:hidden">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                pathname === item.href ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              <item.icon size={14} /> {item.label}
            </Link>
          ))}
        </nav>

        <main className="mx-auto max-w-7xl p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
