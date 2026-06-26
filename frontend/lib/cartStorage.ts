import type { MenuItem } from "./types";

export type StoredCartLine = {
  item: MenuItem;
  quantity: number;
};

export type StoredCart = Record<number, StoredCartLine>;

type CartPayload = {
  version: 1;
  items: Array<{
    itemId: number;
    quantity: number;
  }>;
};

const CART_STORAGE_VERSION = 1;

function hasLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function storageScope(value: string | number) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function cartStorageKey(restaurantSlugOrId: string | number) {
  const scope = storageScope(restaurantSlugOrId) || "restaurant";
  return `restaurantai.cart.${scope}.v${CART_STORAGE_VERSION}`;
}

export function loadCart(restaurantSlugOrId: string | number, menuItems: MenuItem[]): StoredCart {
  if (!hasLocalStorage()) return {};
  const key = cartStorageKey(restaurantSlugOrId);
  const raw = window.localStorage.getItem(key);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Partial<CartPayload>;
    if (parsed.version !== CART_STORAGE_VERSION || !Array.isArray(parsed.items)) return {};

    const itemsById = new Map(menuItems.map((item) => [item.id, item]));
    return parsed.items.reduce<StoredCart>((cart, line) => {
      const item = itemsById.get(line.itemId);
      const quantity = Number(line.quantity);
      if (!item || !Number.isInteger(quantity) || quantity <= 0) return cart;
      return { ...cart, [item.id]: { item, quantity } };
    }, {});
  } catch {
    window.localStorage.removeItem(key);
    return {};
  }
}

export function saveCart(restaurantSlugOrId: string | number, cart: StoredCart) {
  if (!hasLocalStorage()) return;
  const key = cartStorageKey(restaurantSlugOrId);
  const items = Object.values(cart)
    .filter((line) => line.quantity > 0)
    .map((line) => ({ itemId: line.item.id, quantity: line.quantity }));

  if (items.length === 0) {
    window.localStorage.removeItem(key);
    return;
  }

  const payload: CartPayload = {
    version: CART_STORAGE_VERSION,
    items,
  };
  window.localStorage.setItem(key, JSON.stringify(payload));
}

export function clearCart(restaurantSlugOrId: string | number) {
  if (!hasLocalStorage()) return;
  window.localStorage.removeItem(cartStorageKey(restaurantSlugOrId));
}
