"use client";

import {
  AlertTriangle,
  Bot,
  Building2,
  CalendarDays,
  ChefHat,
  CircleHelp,
  Clock3,
  DollarSign,
  Image as ImageIcon,
  type LucideIcon,
  Menu,
  Paintbrush,
  Plus,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import AdminShell from "@/components/admin/AdminShell";
import RestaurantOverviewCard from "@/components/admin/RestaurantOverviewCard";
import SetupProgress from "@/components/admin/SetupProgress";
import { adminRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ContactRequest, Conversation, DashboardStats, Restaurant, RestaurantOrder, RestaurantOverview, User } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantOverview[]>([]);
  const [ownerRestaurant, setOwnerRestaurant] = useState<Restaurant | null>(null);
  const [ownerOrders, setOwnerOrders] = useState<RestaurantOrder[]>([]);
  const [ownerReservations, setOwnerReservations] = useState<ContactRequest[]>([]);
  const [ownerConversations, setOwnerConversations] = useState<Conversation[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [me, setMe] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    Promise.all([
      adminRequest<DashboardStats>("/admin/dashboard", token),
      adminRequest<RestaurantOverview[]>("/admin/restaurants-overview", token),
      adminRequest<User>("/auth/me", token),
    ])
      .then(([statsData, restaurantData, userData]) => {
        setStats(statsData);
        setRestaurants(restaurantData);
        setMe(userData);
        const restaurant = restaurantData[0];
        if (userData.role === "RESTAURANT_OWNER" && restaurant) {
          setOperationsLoading(true);
          Promise.all([
            adminRequest<Restaurant>(`/admin/restaurants/${restaurant.id}`, token),
            adminRequest<RestaurantOrder[]>(`/admin/restaurants/${restaurant.id}/orders`, token),
            adminRequest<ContactRequest[]>(`/admin/restaurants/${restaurant.id}/reservations`, token),
            adminRequest<Conversation[]>(`/admin/restaurants/${restaurant.id}/conversations`, token),
          ])
            .then(([restaurantDetails, orders, reservations, conversations]) => {
              setOwnerRestaurant(restaurantDetails);
              setOwnerOrders(orders);
              setOwnerReservations(reservations);
              setOwnerConversations(conversations);
            })
            .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load restaurant operations."))
            .finally(() => setOperationsLoading(false));
        }
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load dashboard."));
  }, []);

  if (error) {
    return (
      <AdminShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">{error}</div>
      </AdminShell>
    );
  }

  if (!me || !stats) {
    return (
      <AdminShell>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-white/75" />)}
        </div>
      </AdminShell>
    );
  }

  if (me.role === "RESTAURANT_OWNER") {
    const restaurant = restaurants[0];
    const insights = restaurant ? buildOwnerInsights(ownerRestaurant, ownerOrders, ownerReservations, ownerConversations) : null;
    const healthScore = restaurant ? businessHealthScore(restaurant, insights) : 0;
    const ownerCards = restaurant
      ? [
          ["Health score", `${healthScore}%`, Sparkles, healthScore >= 85 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"],
          ["Today revenue", formatCurrency(insights?.todayRevenue ?? 0), DollarSign, "bg-emerald-50 text-emerald-700"],
          ["Today's orders", insights?.todayOrders ?? stats.new_orders, ShoppingBag, "bg-pink-50 text-pink-700"],
          ["Reservations", insights?.activeReservations ?? restaurant.new_reservations, CalendarDays, "bg-blue-50 text-blue-700"],
          ["AI gaps", insights?.unansweredMessages ?? restaurant.unanswered_count, CircleHelp, "bg-red-50 text-red-700"],
        ] as const
      : [];
    const quickActions = [
      ["Manage live orders", "orders", ShoppingBag],
      ["Update opening hours", "edit", Clock3],
      ["Edit menu", "menu", Menu],
      ["Upload a photo", "images", ImageIcon],
      ["Change website design", "design", Paintbrush],
      ["Review AI questions", "chatbot", Bot],
      ["Manage reservations", "reservations", CalendarDays],
      ["View customers", "customers", Users],
    ] as const;

    return (
      <AdminShell>
        <DashboardHero
          eyebrow="Owner workspace"
          title={restaurant ? restaurant.name : "Your restaurant"}
          description="The important work for today: keep the website polished, answer customers, and move orders forward."
        />

        {!restaurant ? (
          <EmptyState title="No restaurant assigned" description="A platform admin needs to assign a restaurant to this owner account before the dashboard can show operations." />
        ) : (
          <>
            {operationsLoading && (
              <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4 text-sm font-semibold text-orange-800">
                Loading today&apos;s restaurant activity...
              </div>
            )}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {ownerCards.map(([label, value, Icon, color]) => <StatCard key={label} label={label} value={value} icon={Icon} color={color} />)}
            </div>

            {insights && (
              <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
                <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold">Today&apos;s business pulse</h2>
                      <p className="mt-1 text-sm text-slate-500">Revenue, order demand, and reservations pulled from live restaurant activity.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      Avg order {formatCurrency(insights.averageOrderValue)}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MiniMetric label="Open orders" value={insights.openOrders} />
                    <MiniMetric label="Ready today" value={insights.readyOrders} />
                    <MiniMetric label="Customers seen" value={insights.customerCount} />
                  </div>

                  <div className="mt-6">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate-400"><ChefHat size={16} /> Best-selling dishes</h3>
                    {insights.bestSellers.length === 0 ? (
                      <EmptyState title="No sales data yet" description="When orders come in, the most popular dishes will appear here for fast menu decisions." />
                    ) : (
                      <div className="mt-3 space-y-3">
                        {insights.bestSellers.map((item, index) => (
                          <div key={item.name} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-50 text-sm font-bold text-orange-700">{index + 1}</span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold">{item.name}</p>
                                <p className="text-xs text-slate-500">{item.quantity} sold</p>
                              </div>
                            </div>
                            <p className="shrink-0 font-semibold">{formatCurrency(item.revenue)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-blue-50 p-2 text-blue-700"><CalendarDays size={20} /></span>
                    <div>
                      <h2 className="text-2xl font-semibold">Reservations and AI</h2>
                      <p className="mt-1 text-sm text-slate-500">What staff should review before service.</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {insights.reservationStatuses.map((status) => <MiniMetric key={status.label} label={status.label} value={status.value} />)}
                  </div>

                  <div className="mt-6 rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 font-semibold"><Sparkles size={17} className="text-orange-600" /> AI customer questions</div>
                    {insights.aiQuestions.length === 0 ? (
                      <p className="mt-2 text-sm leading-6 text-slate-500">No unanswered customer questions right now. The AI knowledge base looks calm.</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {insights.aiQuestions.map((question) => (
                          <p key={question} className="rounded-lg bg-white p-3 text-sm leading-6 text-slate-600 shadow-sm">{question}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 rounded-xl border border-orange-100 bg-orange-50 p-4">
                    <div className="flex items-center gap-2 font-semibold text-orange-950"><Sparkles size={17} /> Today's recommendations</div>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-orange-950">
                      {dailyRecommendations(restaurant, insights).map((item) => <li key={item}>- {item}</li>)}
                    </ul>
                  </div>
                </section>
              </div>
            )}

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
              <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold">Website readiness</h2>
                    <p className="mt-1 text-sm text-slate-500">Complete these items before showing customers the site.</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${restaurant.is_published ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {restaurant.is_published ? "Website live" : "Draft"}
                  </span>
                </div>
                <div className="mt-5"><SetupProgress checklist={restaurant.checklist} percent={restaurant.setup_percent} /></div>
                {insights && (
                  <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 font-semibold text-amber-900"><AlertTriangle size={17} /> Sales-readiness warnings</div>
                    {insights.warnings.length === 0 ? (
                      <p className="mt-2 text-sm text-amber-800">No obvious setup gaps. This restaurant is ready for a polished owner demo.</p>
                    ) : (
                      <ul className="mt-3 space-y-2 text-sm text-amber-900">
                        {insights.warnings.map((warning) => <li key={warning}>- {warning}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold">Quick actions</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {quickActions.map(([label, path, Icon]) => (
                    <Link key={path} href={`/admin/restaurants/${restaurant.id}/${path}`} className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition hover:border-slate-400 hover:bg-slate-50">
                      <span className="flex items-center gap-3"><Icon size={17} className="text-orange-600" />{label}</span>
                      <span className="text-slate-300">→</span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </AdminShell>
    );
  }

  const cards = [
    ["Restaurants", stats.restaurants, Building2, "bg-blue-50 text-blue-700"],
    ["Owners", stats.owners, Users, "bg-violet-50 text-violet-700"],
    ["Reservations", stats.reservations, CalendarDays, "bg-emerald-50 text-emerald-700"],
    ["AI conversations", stats.conversations, Bot, "bg-orange-50 text-orange-700"],
    ["Needs an answer", stats.unanswered, CircleHelp, "bg-red-50 text-red-700"],
    ["New orders", stats.new_orders, ShoppingBag, "bg-pink-50 text-pink-700"],
  ] as const;

  const attention = [...restaurants].sort((a, b) => {
    const aScore = a.setup_percent - a.new_orders * 10 - a.unanswered_count * 8 - a.new_reservations * 4;
    const bScore = b.setup_percent - b.new_orders * 10 - b.unanswered_count * 8 - b.new_reservations * 4;
    return aScore - bScore;
  });
  const readiness = buildTenantReadiness(restaurants);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <DashboardHero
          eyebrow="Business overview"
          title="RestaurantAI control center"
          description="A clean operating view for launching restaurants, spotting support gaps, and keeping demos presentation-ready."
        />
        <Link href="/admin/restaurants/new" className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          <Plus size={17} /> Create restaurant
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(([label, value, Icon, color]) => <StatCard key={label} label={label} value={value} icon={Icon} color={color} />)}
      </div>

      <section className="mt-8 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Tenant readiness</h2>
            <p className="mt-1 text-sm text-slate-500">Which restaurants are ready to sell, incomplete, inactive, or blocked by missing setup.</p>
          </div>
          <Link href="/admin/restaurants?status=incomplete" className="text-sm font-semibold text-orange-600">Open restaurant list</Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MiniMetric label="Ready tenants" value={readiness.ready} />
          <MiniMetric label="Incomplete" value={readiness.incomplete} />
          <MiniMetric label="Inactive/draft" value={readiness.inactive} />
          <MiniMetric label="Missing owner" value={readiness.missingOwner} />
          <MiniMetric label="Needs help" value={readiness.needsHelp} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <ReadinessWarning label="Photos or logo" value={readiness.missingPhotos} />
          <ReadinessWarning label="Menu or hours" value={readiness.missingMenuOrHours} />
          <ReadinessWarning label="AI knowledge" value={readiness.missingAi} />
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Restaurants needing attention</h2>
            <p className="mt-1 text-sm text-slate-500">Prioritized by setup progress, new orders, reservations, and unanswered AI questions.</p>
          </div>
          <Link href="/admin/restaurants" className="text-sm font-semibold text-orange-600">View all restaurants</Link>
        </div>

        {attention.length === 0 ? (
          <EmptyState title="No restaurants yet" description="Create the first restaurant to start building a sellable demo." />
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {attention.slice(0, 3).map((restaurant) => <RestaurantOverviewCard key={restaurant.id} restaurant={restaurant} />)}
          </div>
        )}
      </section>
    </AdminShell>
  );
}

function DashboardHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-orange-600">{eyebrow}</p>
      <h1 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-slate-500">{description}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex rounded-xl p-2.5 ${color}`}><Icon size={20} /></span>
        <TrendingUp size={16} className="text-slate-300" />
      </div>
      <p className="mt-5 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
    </div>
  );
}

function ReadinessWarning({ label, value }: { label: string; value: number }) {
  return (
    <div className={`rounded-xl border p-4 ${value > 0 ? "border-amber-100 bg-amber-50 text-amber-900" : "border-green-100 bg-green-50 text-green-800"}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm font-semibold">{label} warnings</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed bg-white/70 p-8 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function buildTenantReadiness(restaurants: RestaurantOverview[]) {
  return {
    ready: restaurants.filter((restaurant) => restaurant.setup_percent >= 90 && restaurant.is_published).length,
    incomplete: restaurants.filter((restaurant) => restaurant.setup_percent < 90).length,
    inactive: restaurants.filter((restaurant) => !restaurant.is_published).length,
    missingOwner: restaurants.filter((restaurant) => !restaurant.owner_name && !restaurant.owner_email).length,
    needsHelp: restaurants.filter((restaurant) => restaurant.new_orders > 0 || restaurant.new_reservations > 0 || restaurant.unanswered_count > 0).length,
    missingPhotos: restaurants.filter((restaurant) => !restaurant.hero_image && restaurant.image_count === 0).length,
    missingMenuOrHours: restaurants.filter((restaurant) => restaurant.menu_items === 0 || !restaurant.checklist.opening_hours).length,
    missingAi: restaurants.filter((restaurant) => !restaurant.checklist.chatbot || restaurant.unanswered_count > 0).length,
  };
}

function businessHealthScore(restaurant: RestaurantOverview, insights: OwnerInsights | null) {
  let score = restaurant.setup_percent;
  if (!restaurant.is_published) score -= 12;
  if (restaurant.unanswered_count > 0 || (insights?.unansweredMessages ?? 0) > 0) score -= 10;
  if (restaurant.new_orders > 0 || (insights?.openOrders ?? 0) > 0) score -= 4;
  if (!restaurant.owner_name && !restaurant.owner_email) score -= 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function dailyRecommendations(restaurant: RestaurantOverview, insights: OwnerInsights) {
  const recommendations = [];
  if (insights.openOrders > 0) recommendations.push(`Move ${insights.openOrders} open order${insights.openOrders === 1 ? "" : "s"} through the kitchen workflow.`);
  if (insights.unansweredMessages > 0) recommendations.push("Review unanswered AI questions and add missing knowledge.");
  if (insights.warnings.length > 0) recommendations.push(`Fix setup gaps: ${insights.warnings.slice(0, 2).join(", ")}.`);
  if (restaurant.new_reservations > 0) recommendations.push("Confirm or decline new reservation requests before service.");
  if (recommendations.length === 0) recommendations.push("Everything important looks calm. Check photos, menu availability, and today's specials before service.");
  return recommendations.slice(0, 4);
}

type OwnerInsights = {
  todayRevenue: number;
  todayOrders: number;
  averageOrderValue: number;
  openOrders: number;
  readyOrders: number;
  activeReservations: number;
  unansweredMessages: number;
  customerCount: number;
  bestSellers: { name: string; quantity: number; revenue: number }[];
  reservationStatuses: { label: string; value: number }[];
  aiQuestions: string[];
  warnings: string[];
};

function buildOwnerInsights(
  restaurant: Restaurant | null,
  orders: RestaurantOrder[],
  reservations: ContactRequest[],
  conversations: Conversation[],
): OwnerInsights {
  const today = new Date();
  const todayOrders = orders.filter((order) => isSameLocalDay(order.created_at, today) && order.status !== "REJECTED");
  const revenueOrders = todayOrders.filter((order) => !["REJECTED", "CANCELLED"].includes(order.status));
  const todayRevenue = revenueOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const averageOrderValue = revenueOrders.length === 0 ? 0 : todayRevenue / revenueOrders.length;
  const openStatuses = new Set(["NEW", "ACCEPTED", "PREPARING", "READY", "DELIVERING"]);
  const openOrders = orders.filter((order) => openStatuses.has(order.status)).length;
  const readyOrders = todayOrders.filter((order) => ["READY", "PICKED_UP", "DELIVERED", "COMPLETED"].includes(order.status)).length;
  const activeReservations = reservations.filter((reservation) => !["CANCELLED", "NO_SHOW", "COMPLETED"].includes(reservation.status.toUpperCase())).length;
  const reservationStatuses = [
    { label: "New", value: countReservations(reservations, "NEW") },
    { label: "Confirmed", value: countReservations(reservations, "CONFIRMED") },
    { label: "Today", value: reservations.filter((reservation) => isSameLocalDay(reservation.requested_at, today)).length },
  ];

  const bestSellerMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const order of orders.filter((order) => order.status !== "REJECTED")) {
    for (const item of order.items) {
      const current = bestSellerMap.get(item.item_name) ?? { name: item.item_name, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += Number(item.line_total || 0);
      bestSellerMap.set(item.item_name, current);
    }
  }
  const bestSellers = [...bestSellerMap.values()]
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 4);

  const customerKeys = new Set<string>();
  for (const order of orders) addCustomerKey(customerKeys, order.customer_email, order.customer_phone, order.customer_name);
  for (const reservation of reservations) addCustomerKey(customerKeys, reservation.email, reservation.phone, reservation.name);

  const unansweredMessages = conversations.reduce(
    (sum, conversation) => sum + conversation.messages.filter((message) => message.is_unanswered).length,
    0,
  );
  const aiQuestions = conversations
    .flatMap((conversation) => conversation.messages)
    .filter((message) => message.is_unanswered)
    .map((message) => trimSnippet(message.content))
    .filter(Boolean)
    .slice(0, 3);

  return {
    todayRevenue,
    todayOrders: todayOrders.length,
    averageOrderValue,
    openOrders,
    readyOrders,
    activeReservations,
    unansweredMessages,
    customerCount: customerKeys.size,
    bestSellers,
    reservationStatuses,
    aiQuestions,
    warnings: buildSetupWarnings(restaurant, unansweredMessages),
  };
}

function buildSetupWarnings(restaurant: Restaurant | null, unansweredMessages: number): string[] {
  if (!restaurant) return [];
  const menuItems = restaurant.categories.flatMap((category) => category.items);
  const warnings = [];
  if (!restaurant.hero_image && !restaurant.images.some((image) => image.image_type === "hero")) warnings.push("Add a strong hero photo before showing the website.");
  if (!restaurant.logo_url && !restaurant.images.some((image) => image.image_type === "logo")) warnings.push("Add a logo so the owner dashboard and website feel branded.");
  if (!restaurant.opening_hours?.trim()) warnings.push("Opening hours are missing.");
  if (menuItems.length === 0) warnings.push("The menu is empty.");
  if (menuItems.some((item) => !item.image_url)) warnings.push("Some dishes are missing photos.");
  if (menuItems.some((item) => !item.allergens?.trim())) warnings.push("Some dishes are missing allergen information.");
  if (unansweredMessages > 0) warnings.push("Review unanswered AI questions to improve the AI waiter.");
  return warnings.slice(0, 5);
}

function countReservations(reservations: ContactRequest[], status: string) {
  return reservations.filter((reservation) => reservation.status.toUpperCase() === status).length;
}

function addCustomerKey(keys: Set<string>, email: string, phone: string, name: string) {
  const key = email?.trim().toLowerCase() || phone?.trim() || name?.trim().toLowerCase();
  if (key) keys.add(key);
}

function isSameLocalDay(value: string, date: Date) {
  const parsed = new Date(value);
  return parsed.getFullYear() === date.getFullYear() && parsed.getMonth() === date.getMonth() && parsed.getDate() === date.getDate();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function trimSnippet(value: string) {
  return value.length > 130 ? `${value.slice(0, 127)}...` : value;
}
