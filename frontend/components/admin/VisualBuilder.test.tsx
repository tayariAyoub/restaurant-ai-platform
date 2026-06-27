import { screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import VisualBuilder from "./VisualBuilder";
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

const superAdmin = {
  id: 1,
  email: "admin@example.com",
  name: "Admin",
  role: "SUPER_ADMIN" as const,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

const owner = {
  id: 2,
  email: "owner@example.com",
  name: "Owner",
  role: "RESTAURANT_OWNER" as const,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

const themes = [
  {
    id: 1,
    key: "italian-warm",
    name: "Italian Warm",
    description: "Warm Italian hospitality",
    primary_color: "#c84b31",
    secondary_color: "#6b7048",
    background_color: "#f7f3ea",
    text_color: "#1b1b18",
    font_family: "Cormorant Garamond",
    button_style: "pill",
    homepage_style: "story",
    menu_style: "cards",
    gallery_style: "grid",
  },
];

const restaurantOverview = [{
  id: bellaNapoli.id,
  owner_id: bellaNapoli.owner_id,
  theme_id: bellaNapoli.theme_id,
  name: bellaNapoli.name,
  slug: bellaNapoli.slug,
  city: bellaNapoli.city,
  email: bellaNapoli.email,
  hero_image: bellaNapoli.hero_image,
  is_published: bellaNapoli.is_published,
  created_at: bellaNapoli.created_at,
  owner_name: "Owner",
  owner_email: "owner@example.com",
  theme_name: "Italian Warm",
  menu_items: 3,
  image_count: 2,
  reservation_count: 0,
  new_reservations: 0,
  new_orders: 0,
  conversation_count: 0,
  unanswered_count: 0,
  setup_percent: 92,
  checklist: {
    information: true,
    opening_hours: true,
    branding: true,
    menu: true,
    design: true,
    chatbot: true,
  },
}];

describe("visual restaurant builder", () => {
  beforeEach(() => {
    adminRequestMock.mockReset();
    adminRequestMock.mockImplementation((path: string, _token: string, options?: RequestInit) => {
      if (path === "/auth/me") return Promise.resolve(superAdmin);
      if (path === "/admin/themes") return Promise.resolve(themes);
      if (path === "/admin/restaurants-overview") return Promise.resolve(restaurantOverview);
      if (path === "/admin/users") return Promise.resolve([owner]);
      if (path === "/admin/restaurants/1") return Promise.resolve(bellaNapoli);
      if (path === "/admin/restaurants" && options?.method === "POST") {
        const payload = JSON.parse(String(options.body));
        return Promise.resolve({ ...bellaNapoli, ...payload, id: 2, categories: [], images: [] });
      }
      if (path === "/admin/restaurants/1" && options?.method === "PUT") {
        const payload = JSON.parse(String(options.body));
        return Promise.resolve({ ...bellaNapoli, ...payload });
      }
      return Promise.resolve({});
    });
  });

  it("lists existing restaurant websites and exposes the create flow", async () => {
    renderWithUser(<VisualBuilder />);

    expect(await screen.findByRole("heading", { name: /build restaurant websites without touching code/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /create restaurant website/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: bellaNapoli.name })).toBeVisible();
    expect(screen.getByRole("link", { name: /edit/i })).toHaveAttribute("href", "/admin/builder/1");
  });

  it("creates a restaurant draft from visual builder fields", async () => {
    const { user } = renderWithUser(<VisualBuilder />);

    await user.click(await screen.findByRole("button", { name: /create restaurant website/i }));
    await user.type(screen.getByLabelText(/restaurant name/i), "Lumiere");
    await user.type(screen.getByLabelText(/city/i), "Paris");
    await user.type(screen.getByLabelText(/email/i), "hello@lumiere.example");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(adminRequestMock).toHaveBeenCalledWith(
        "/admin/restaurants",
        "token-123",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"slug":"lumiere"'),
        }),
      );
    });
    expect(await screen.findByText(/website saved/i)).toBeVisible();
  });

  it("updates service toggles for an existing restaurant", async () => {
    const { user } = renderWithUser(<VisualBuilder restaurantId={1} />);

    expect(await screen.findByDisplayValue(bellaNapoli.name)).toBeVisible();
    await user.click(screen.getByRole("button", { name: /services/i }));
    await user.click(screen.getByRole("button", { name: /online ordering/i }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(adminRequestMock).toHaveBeenCalledWith(
        "/admin/restaurants/1",
        "token-123",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"ordering_enabled":false'),
        }),
      );
    });
  });
});
