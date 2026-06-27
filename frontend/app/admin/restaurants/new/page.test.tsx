import { screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NewRestaurantPage from "./page";
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

describe("restaurant onboarding wizard", () => {
  beforeEach(() => {
    localStorage.clear();
    adminRequestMock.mockReset();
    adminRequestMock.mockImplementation((path: string) => {
      if (path === "/admin/users") return Promise.resolve([]);
      if (path === "/admin/themes") return Promise.resolve(themes);
      return Promise.resolve({});
    });
  });

  it("renders a reassuring multi-step onboarding flow", async () => {
    renderWithUser(<NewRestaurantPage />);

    expect(await screen.findByRole("heading", { name: /publish a premium website in minutes/i })).toBeVisible();
    expect(screen.getByText(/In a few minutes your restaurant website will be ready/i)).toBeVisible();
    expect(screen.getByText(/13% complete/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /continue/i })).toBeVisible();
  });

  it("autosaves restaurant information while moving through the wizard", async () => {
    const { user } = renderWithUser(<NewRestaurantPage />);

    await user.click(await screen.findByRole("button", { name: /continue/i }));
    await user.type(screen.getByPlaceholderText("Bella Napoli"), "Bella Napoli");
    await user.type(screen.getByPlaceholderText("hello@restaurant.com"), "ciao@bella.example");
    await user.type(screen.getByPlaceholderText("Berlin"), "Berlin");

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(localStorage.getItem("restaurantai.onboarding.v1")).toContain("Bella Napoli");
    });
    expect(screen.getByText(/Brand and first impression/i)).toBeVisible();
  });
});
