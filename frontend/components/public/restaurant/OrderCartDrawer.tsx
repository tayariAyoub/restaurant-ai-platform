import { Check, Loader2, Minus, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import type { Dispatch, FormEvent, SetStateAction } from "react";

import type { MenuItem, Restaurant, RestaurantOrder } from "@/lib/types";
import {
  estimateText,
  formatPrice,
  nextInstruction,
  orderSteps,
  orderTypeLabel,
  shortOrderNumber,
} from "./experience";

type CartLine = {
  item: MenuItem;
  quantity: number;
};

type OrderCartDrawerProps = {
  restaurant: Restaurant;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  cartLines: CartLine[];
  subtotal: number;
  orderType: RestaurantOrder["order_type"];
  setOrderType: Dispatch<SetStateAction<RestaurantOrder["order_type"]>>;
  orderStatus: string;
  orderSubmitting: boolean;
  completedOrder: RestaurantOrder | null;
  setCompletedOrder: (order: RestaurantOrder | null) => void;
  primary: string;
  buttonClass: string;
  changeCart: (item: MenuItem, change: number) => void;
  removeItem: (itemId: number) => void;
  submitOrder: (event: FormEvent<HTMLFormElement>) => void;
};

export default function OrderCartDrawer({
  restaurant,
  cartOpen,
  setCartOpen,
  cartLines,
  subtotal,
  orderType,
  setOrderType,
  orderStatus,
  orderSubmitting,
  completedOrder,
  setCompletedOrder,
  primary,
  buttonClass,
  changeCart,
  removeItem,
  submitOrder,
}: OrderCartDrawerProps) {
  if (!cartOpen) return null;

  const total = subtotal + (orderType === "DELIVERY" ? 3.5 : 0);
  const completedEstimate = completedOrder ? estimateText(completedOrder) : "";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="max-h-[calc(100svh-0.75rem)] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-[#fbfaf7] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-slate-900 shadow-2xl sm:max-h-[94vh] sm:rounded-[2rem] sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="luxury-kicker text-xs font-bold" style={{ color: primary }}>Online order</p>
            <h2 className="text-3xl font-semibold">Your selected dishes</h2>
          </div>
          <button onClick={() => { setCartOpen(false); setCompletedOrder(null); }} className="grid h-11 w-11 place-items-center rounded-full border bg-white" aria-label="Close cart"><X /></button>
        </div>

        {completedOrder ? (
          <div className="mt-8 overflow-hidden rounded-3xl border border-green-100 bg-green-50">
            <div className="p-6 text-center sm:p-8">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-700 text-white">
                <Check size={30} />
              </span>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-green-700">Order confirmed</p>
              <h3 className="mt-2 text-3xl font-bold">#{shortOrderNumber(completedOrder.public_id)}</h3>
              <p className="mt-2 text-sm leading-6 text-green-900">
                {restaurant.name} received your order. Keep this number handy if you call the restaurant.
              </p>
            </div>

            <div className="grid gap-3 border-y border-green-100 bg-white/80 p-4 text-sm sm:grid-cols-3">
              <SuccessMetric label="Total" value={formatPrice(completedOrder.total)} />
              <SuccessMetric label="Method" value={orderTypeLabel(completedOrder.order_type)} />
              <SuccessMetric label="Estimate" value={completedEstimate} />
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <OrderTimeline status={completedOrder.status} orderType={completedOrder.order_type} />
              <div className="rounded-2xl bg-white p-4 text-sm leading-6 text-slate-600">
                <p className="font-semibold text-slate-900">What happens next</p>
                <p className="mt-1">{nextInstruction(completedOrder.order_type)}</p>
                {restaurant.phone && (
                  <p className="mt-3">
                    Need help? Call {restaurant.name} at <a className="font-semibold underline" href={`tel:${restaurant.phone}`}>{restaurant.phone}</a>.
                  </p>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href={`/restaurants/${restaurant.slug}/orders/${completedOrder.public_id}`}
                  className="rounded-xl bg-green-800 px-5 py-3 text-center font-bold text-white"
                >
                  Track order
                </Link>
                <button onClick={() => { setCartOpen(false); setCompletedOrder(null); }} className="rounded-xl border border-green-200 bg-white px-5 py-3 font-bold text-green-900">
                  Back to menu
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={submitOrder}>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-500">
              {["Review", "Details", "Confirm"].map((step, index) => (
                <span key={step} className={`rounded-full px-3 py-2 ${index === 0 ? "text-white" : "bg-slate-100"}`} style={index === 0 ? { backgroundColor: primary } : undefined}>{step}</span>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              <p className="font-semibold">Payment is handled by the restaurant.</p>
              <p className="mt-1 opacity-75">You can pay at pickup, at the table, or on delivery depending on the restaurant's normal process.</p>
            </div>
            <div className="mt-6 space-y-3">
              {cartLines.map((line) => (
                <div key={line.item.id} className="grid gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-sm sm:flex sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{line.item.name}</p>
                    <p className="text-sm text-slate-500">{formatPrice(line.item.price)} each</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <button type="button" onClick={() => changeCart(line.item, -1)} className="grid h-11 w-11 place-items-center rounded-xl border bg-white" aria-label={`Remove one ${line.item.name}`}><Minus size={15} /></button>
                    <b className="min-w-8 text-center">{line.quantity}</b>
                    <button type="button" onClick={() => changeCart(line.item, 1)} className="grid h-11 w-11 place-items-center rounded-xl border bg-white" aria-label={`Add one ${line.item.name}`}><Plus size={15} /></button>
                    <button type="button" onClick={() => removeItem(line.item.id)} className="ml-auto grid h-11 w-11 place-items-center rounded-xl text-red-600 sm:ml-2" aria-label={`Remove ${line.item.name}`}><Trash2 size={17} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-sm font-bold">How would you like your order?</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  ["PICKUP", "Pickup"],
                  ["EAT_IN", "Dine in"],
                  ["DELIVERY", "Delivery"],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setOrderType(value as RestaurantOrder["order_type"])}
                    className={`luxury-button min-h-12 rounded-xl border px-2 py-3 text-sm font-bold ${orderType === value ? "text-white" : "bg-white"}`}
                    style={orderType === value ? { backgroundColor: primary } : undefined}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <input required name="customer_name" placeholder="Your name" autoComplete="name" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:text-sm" />
              <input required name="customer_phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Phone number" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:text-sm" />
              <input name="customer_email" type="email" inputMode="email" autoComplete="email" placeholder="Email (optional)" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:col-span-2 sm:text-sm" />
              {orderType === "DELIVERY" && (
                <>
                  <input required name="street" autoComplete="street-address" placeholder="Street and house number" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:col-span-2 sm:text-sm" />
                  <input required name="delivery_postal_code" inputMode="numeric" autoComplete="postal-code" placeholder="Postal code" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:text-sm" />
                  <input required name="delivery_city" autoComplete="address-level2" placeholder="City" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:text-sm" />
                  <input name="delivery_instructions" placeholder="Doorbell, floor, delivery instructions" className="min-h-12 rounded-xl border px-4 py-3 text-base sm:col-span-2 sm:text-sm" />
                </>
              )}
              <textarea name="notes" placeholder="Notes for the restaurant" className="min-h-24 rounded-xl border px-4 py-3 text-base sm:col-span-2 sm:text-sm" />
            </div>

            <div className="mt-6 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              {orderType === "DELIVERY" && <div className="flex justify-between"><span>Delivery fee</span><span>EUR 3.50</span></div>}
              <div className="flex justify-between text-xl font-bold"><span>Total</span><span>{formatPrice(total)}</span></div>
            </div>

            {orderStatus && <p className="mt-3 text-center text-sm text-slate-600" aria-live="polite">{orderStatus}</p>}
            <button disabled={cartLines.length === 0 || orderSubmitting} className={`luxury-button mt-5 flex w-full items-center justify-center gap-2 ${buttonClass} py-4 font-bold text-white disabled:opacity-50`} style={{ backgroundColor: primary }}>
              {orderSubmitting && <Loader2 size={18} className="animate-spin" />}
              {orderSubmitting ? "Confirming order..." : "Confirm order"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function SuccessMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-4 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}

function OrderTimeline({ status, orderType }: { status: string; orderType: RestaurantOrder["order_type"] }) {
  const steps = orderSteps(orderType);
  const currentIndex = Math.max(0, steps.findIndex((step) => step.statuses.includes(status)));
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="font-semibold text-slate-900">Status timeline</p>
      <div className="mt-4 space-y-3">
        {steps.map((step, index) => {
          const done = index <= currentIndex;
          return (
            <div key={step.label} className="flex gap-3">
              <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? "bg-green-700 text-white" : "bg-slate-100 text-slate-400"}`}>
                {index + 1}
              </span>
              <div>
                <p className={`font-semibold ${done ? "text-slate-950" : "text-slate-400"}`}>{step.label}</p>
                <p className="text-sm leading-6 text-slate-500">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
