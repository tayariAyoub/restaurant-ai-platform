import {
  ChefHat,
  Flame,
  Leaf,
  Sparkles,
  Wine,
  type LucideIcon,
} from "lucide-react";

import type { RestaurantThemeIdentity } from "@/lib/restaurantTheme";
import type { MenuItem, Restaurant, RestaurantOrder } from "@/lib/types";

export type StoryMoment = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
};

export function parseOpeningHours(openingHours: string) {
  try {
    return JSON.parse(openingHours) as Record<string, string>;
  } catch {
    return { hours: openingHours };
  }
}

export function buildDietaryPrompts(items: MenuItem[]) {
  const prompts = [];
  if (items.some((item) => item.is_vegan)) prompts.push("Show me vegan options");
  if (items.some((item) => item.is_vegetarian)) prompts.push("What is vegetarian?");
  if (items.some((item) => item.is_halal)) prompts.push("Which dishes are halal?");
  if (items.some((item) => item.allergens)) prompts.push("Help me avoid allergens");
  return prompts.length > 0 ? prompts : ["Help me choose for allergies"];
}

export function buildStoryMoments(
  restaurant: Restaurant,
  featuredItems: MenuItem[],
  personality: RestaurantThemeIdentity["personality"],
): StoryMoment[] {
  const firstDish = featuredItems[0]?.name || "the first plate";
  const secondDish = featuredItems[1]?.name || "the seasonal special";
  return [
    {
      icon: Sparkles,
      label: personality.name,
      value: "A dining mood you understand before you arrive.",
      detail: personality.description,
    },
    {
      icon: ChefHat,
      label: "Chef's note",
      value: `${firstDish} is a natural place to begin.`,
      detail: "Signature plates are surfaced early so guests feel guided instead of forced to scan a long list.",
    },
    {
      icon: Leaf,
      label: "Seasonal rhythm",
      value: `${secondDish} can become tonight's highlight.`,
      detail: "The page gives the kitchen room to express craft, seasonality, and table-side hospitality.",
    },
    {
      icon: Flame,
      label: "Kitchen story",
      value: restaurant.story
        ? "The restaurant already has a story worth surfacing."
        : "Add a kitchen note to make the room feel alive.",
      detail: "Designed for wood-fired ovens, omakase pacing, local produce, hand-shaped pasta, dry-aged beef, or any memorable ritual.",
    },
    {
      icon: Wine,
      label: "Pairing cue",
      value: "Guests can ask for pairings, allergies, timing, and occasion-based guidance.",
      detail: "The AI Maître d' supports the restaurant's hospitality instead of replacing the dining room.",
    },
  ];
}

export function dishExperienceLabel(item: MenuItem, index: number) {
  if (index === 0) return "Signature";
  if (index === 1) return "Most loved";
  if (item.description?.toLowerCase().includes("season")) return "Seasonal";
  if (item.is_vegan || item.is_vegetarian) return "Plant friendly";
  return "Tonight";
}

export function pairingSuggestion(item: MenuItem) {
  const description = `${item.name} ${item.description}`.toLowerCase();
  if (description.includes("spicy") || description.includes("chili")) {
    return "Pair with something bright, cold, or citrus-led to keep the heat elegant.";
  }
  if (description.includes("beef") || description.includes("steak")) {
    return "Ask for a bold red wine or a roasted side to make this feel like the center of the table.";
  }
  if (description.includes("fish") || description.includes("sea")) {
    return "A crisp white wine, fresh salad, or citrus-forward starter will keep the plate lifted.";
  }
  if (item.is_vegan || item.is_vegetarian) {
    return "A fresh starter keeps this plant-forward choice bright and balanced.";
  }
  return "Ask for a pairing based on your mood, appetite, and table plans.";
}

export function matchesMenuFilters(
  item: MenuItem,
  query: string,
  filter: "all" | "vegan" | "vegetarian" | "halal",
) {
  const haystack = `${item.name} ${item.description} ${item.allergens}`.toLowerCase();
  const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
  const matchesFilter =
    filter === "all" ||
    (filter === "vegan" && item.is_vegan) ||
    (filter === "vegetarian" && (item.is_vegetarian || item.is_vegan)) ||
    (filter === "halal" && item.is_halal);
  return matchesQuery && matchesFilter;
}

export function orderSteps(orderType: RestaurantOrder["order_type"]) {
  if (orderType === "DELIVERY") {
    return [
      { label: "Order received", description: "The restaurant has your order.", statuses: ["NEW"] },
      { label: "Preparing", description: "The kitchen is working on it.", statuses: ["ACCEPTED", "PREPARING"] },
      { label: "On the way", description: "Delivery is heading to you.", statuses: ["READY", "DELIVERING"] },
      { label: "Delivered", description: "Enjoy your meal.", statuses: ["DELIVERED", "COMPLETED"] },
    ];
  }
  return [
    { label: "Order received", description: "The restaurant has your order.", statuses: ["NEW"] },
    { label: "Preparing", description: "The kitchen is working on it.", statuses: ["ACCEPTED", "PREPARING"] },
    {
      label: orderType === "EAT_IN" ? "Ready for your table" : "Ready for pickup",
      description: "Staff will have it ready shortly.",
      statuses: ["READY"],
    },
    { label: "Completed", description: "Thanks for ordering.", statuses: ["PICKED_UP", "COMPLETED"] },
  ];
}

export function estimateText(order: RestaurantOrder) {
  if (order.estimated_minutes) return `${order.estimated_minutes} min`;
  if (order.order_type === "DELIVERY") return "35-50 min";
  if (order.order_type === "EAT_IN") return "15-25 min";
  return "20-30 min";
}

export function orderTypeLabel(orderType: RestaurantOrder["order_type"]) {
  return orderType === "EAT_IN" ? "Dine in" : orderType.charAt(0) + orderType.slice(1).toLowerCase();
}

export function nextInstruction(orderType: RestaurantOrder["order_type"]) {
  if (orderType === "DELIVERY") {
    return "Watch this tracking page for status changes. The restaurant may call if they need delivery details.";
  }
  if (orderType === "EAT_IN") {
    return "Arrive at the restaurant and mention your order number to staff.";
  }
  return "Come to the restaurant around the estimated pickup time and mention your order number.";
}

export function shortOrderNumber(publicId: string) {
  return publicId.split("-")[0].toUpperCase();
}

export function formatPrice(value: string | number) {
  return `EUR ${Number(value).toFixed(2)}`;
}
