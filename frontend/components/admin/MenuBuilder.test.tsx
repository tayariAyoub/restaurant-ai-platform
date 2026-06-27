import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MenuBuilder from "./MenuBuilder";
import type { Category, MenuItem, Restaurant } from "@/lib/types";
import { bellaNapoli } from "@/test/fixtures";
import { renderWithUser } from "@/test/test-utils";

const adminRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/admin/AdminShell", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/auth", () => ({
  getToken: () => "token-123",
}));

vi.mock("@/lib/api", () => ({
  adminRequest: adminRequestMock,
}));

function cloneRestaurant(): Restaurant {
  return JSON.parse(JSON.stringify(bellaNapoli)) as Restaurant;
}

describe("menu builder", () => {
  let restaurant: Restaurant;
  let nextCategoryId: number;
  let nextItemId: number;

  beforeEach(() => {
    restaurant = cloneRestaurant();
    nextCategoryId = 1000;
    nextItemId = 2000;
    adminRequestMock.mockReset();
    adminRequestMock.mockImplementation((path: string, _token: string, options?: RequestInit) => {
      if (path === "/admin/restaurants/1" && !options) return Promise.resolve(restaurant);

      if (path === "/admin/restaurants/1/categories" && options?.method === "POST") {
        const payload = JSON.parse(String(options.body));
        const category: Category = { id: nextCategoryId++, items: [], ...payload };
        restaurant = { ...restaurant, categories: [...restaurant.categories, category] };
        return Promise.resolve(category);
      }

      const categoryUpdate = path.match(/^\/admin\/restaurants\/1\/categories\/(\d+)$/);
      if (categoryUpdate && options?.method === "PUT") {
        const categoryId = Number(categoryUpdate[1]);
        const payload = JSON.parse(String(options.body));
        restaurant = {
          ...restaurant,
          categories: restaurant.categories.map((category) =>
            category.id === categoryId ? { ...category, ...payload } : category,
          ),
        };
        return Promise.resolve(restaurant.categories.find((category) => category.id === categoryId));
      }
      if (categoryUpdate && options?.method === "DELETE") {
        const categoryId = Number(categoryUpdate[1]);
        restaurant = {
          ...restaurant,
          categories: restaurant.categories.filter((category) => category.id !== categoryId),
        };
        return Promise.resolve(undefined);
      }

      if (path === "/admin/restaurants/1/menu-items" && options?.method === "POST") {
        const payload = JSON.parse(String(options.body));
        const item: MenuItem = { id: nextItemId++, ...payload, price: String(payload.price) };
        restaurant = {
          ...restaurant,
          categories: restaurant.categories.map((category) =>
            category.id === payload.category_id ? { ...category, items: [...category.items, item] } : category,
          ),
        };
        return Promise.resolve(item);
      }

      const itemUpdate = path.match(/^\/admin\/restaurants\/1\/menu-items\/(\d+)$/);
      if (itemUpdate && options?.method === "PUT") {
        const itemId = Number(itemUpdate[1]);
        const payload = JSON.parse(String(options.body));
        const item: MenuItem = { id: itemId, ...payload, price: String(payload.price) };
        restaurant = {
          ...restaurant,
          categories: restaurant.categories.map((category) => ({
            ...category,
            items: category.id === payload.category_id
              ? category.items.map((current) => (current.id === itemId ? item : current))
              : category.items.filter((current) => current.id !== itemId),
          })),
        };
        return Promise.resolve(item);
      }

      return Promise.resolve({});
    });
  });

  it("renders categories, menu items, preview, and public site link", async () => {
    renderWithUser(<MenuBuilder restaurantId={1} />);

    expect(await screen.findByRole("heading", { name: /bella napoli menu/i })).toBeVisible();
    expect(screen.getAllByRole("heading", { name: "Wood-fired Pizza" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Margherita").length).toBeGreaterThan(0);
    expect(screen.getByText(/guest menu scan/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /open public site/i })).toHaveAttribute("href", "/restaurants/bella-napoli");
  });

  it("creates and edits a category through existing admin APIs", async () => {
    const { user } = renderWithUser(<MenuBuilder restaurantId={1} />);

    await screen.findByRole("heading", { name: /bella napoli menu/i });
    await user.type(screen.getByLabelText(/category name/i), "Desserts");
    await user.type(screen.getByLabelText(/category description/i), "Sweet finish");
    await user.click(screen.getByRole("button", { name: /create category/i }));

    await waitFor(() => {
      expect(adminRequestMock).toHaveBeenCalledWith(
        "/admin/restaurants/1/categories",
        "token-123",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"name":"Desserts"'),
        }),
      );
    });
    expect(await screen.findByText(/category created/i)).toBeVisible();
    expect(screen.getAllByRole("heading", { name: "Desserts" }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /edit category desserts/i }));
    await user.clear(screen.getByLabelText(/category name/i));
    await user.type(screen.getByLabelText(/category name/i), "Dolci");
    await user.click(screen.getByRole("button", { name: /save category/i }));

    await waitFor(() => {
      expect(adminRequestMock).toHaveBeenCalledWith(
        "/admin/restaurants/1/categories/1000",
        "token-123",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"name":"Dolci"'),
        }),
      );
    });
    expect(await screen.findByText(/category saved/i)).toBeVisible();
    expect(screen.getAllByRole("heading", { name: "Dolci" }).length).toBeGreaterThan(0);
  });

  it("creates a menu item with price, category, image URL, availability, and dietary fields", async () => {
    const { user } = renderWithUser(<MenuBuilder restaurantId={1} />);

    await screen.findByRole("heading", { name: /bella napoli menu/i });
    await user.type(screen.getByLabelText(/item name/i), "Tiramisu");
    await user.type(screen.getByLabelText(/price/i), "8.50");
    await user.type(screen.getByLabelText(/food image url/i), "https://images.example/tiramisu.jpg");
    await user.type(screen.getByLabelText(/allergens/i), "Milk, eggs");
    await user.click(screen.getByRole("button", { name: "Vegetarian" }));
    await user.click(screen.getByRole("button", { name: /create item/i }));

    await waitFor(() => {
      expect(adminRequestMock).toHaveBeenCalledWith(
        "/admin/restaurants/1/menu-items",
        "token-123",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"name":"Tiramisu"'),
        }),
      );
    });
    expect(await screen.findByText(/menu item created/i)).toBeVisible();
    expect(screen.getAllByText("Tiramisu").length).toBeGreaterThan(0);
  });

  it("shows food image preview fallback when the image URL is broken", async () => {
    const { user } = renderWithUser(<MenuBuilder restaurantId={1} />);

    await screen.findByRole("heading", { name: /bella napoli menu/i });
    await user.type(screen.getByLabelText(/food image url/i), "https://images.example/broken.jpg");

    const preview = screen
      .getAllByAltText("item image preview")
      .find((image) => image.getAttribute("src") === "https://images.example/broken.jpg");
    expect(preview).toBeDefined();
    expect(preview as HTMLElement).toBeVisible();

    fireEvent.error(preview as HTMLElement);

    expect(await screen.findByText(/image url could not load/i)).toBeVisible();
  });
});
