import {
  Bot,
  Image as ImageIcon,
  Menu,
  Paintbrush,
  Settings,
  CalendarDays,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";

export default function RestaurantNav({ id, active }: { id: number; active: string }) {
  const links = [
    ["edit", "Information", Settings],
    ["design", "Design", Paintbrush],
    ["menu", "Menu", Menu],
    ["images", "Images", ImageIcon],
    ["chatbot", "AI Chatbot", Bot],
    ["reservations", "Reservations", CalendarDays],
    ["orders", "Orders", ShoppingBag],
  ] as const;
  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border bg-white p-2">
      {links.map(([path, label, Icon]) => (
        <Link
          key={path}
          href={`/admin/restaurants/${id}/${path}`}
          className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${active === path ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
        >
          <Icon size={16} /> {label}
        </Link>
      ))}
    </nav>
  );
}
