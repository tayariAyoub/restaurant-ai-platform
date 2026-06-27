import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RestaurantSite from "./RestaurantSite";
import { bellaNapoli } from "@/test/fixtures";
import { renderWithUser } from "@/test/test-utils";

const requestMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  default: requestMock,
}));

describe("restaurant page", () => {
  beforeEach(() => {
    localStorage.clear();
    requestMock.mockReset();
  });

  it("renders restaurant information, menu, gallery, tags, sold-out state, and chatbot trigger", async () => {
    renderWithUser(<RestaurantSite restaurant={bellaNapoli} />);

    expect(screen.getByRole("heading", { name: bellaNapoli.tagline })).toBeVisible();
    expect(screen.getByRole("heading", { name: /a menu that feels curated/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Antipasti" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Wood-fired Pizza" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Margherita" })).toBeVisible();
    expect(screen.getByText("Sold out tonight")).toBeVisible();
    expect(screen.getByRole("button", { name: /unavailable today/i })).toBeDisabled();
    expect(screen.getAllByText("Vegetarian").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Halal").length).toBeGreaterThan(0);
    expect(screen.getByText("Vegan")).toBeVisible();
    expect(screen.getAllByAltText("Dining room")[0]).toBeVisible();
    expect(screen.getByRole("button", { name: /open ai maitre d'/i })).toBeVisible();
  });

  it("adds items, updates quantity, removes items, and recalculates totals", async () => {
    const { user } = renderWithUser(<RestaurantSite restaurant={bellaNapoli} />);

    const margheritaCard = screen.getByRole("heading", { name: "Margherita" }).closest("article");
    expect(margheritaCard).not.toBeNull();
    const addMargherita = within(margheritaCard as HTMLElement).getByRole("button", { name: /add to order/i });

    await user.click(addMargherita);
    await user.click(addMargherita);
    await user.click(screen.getByRole("button", { name: /view order/i }));

    expect(screen.getAllByText("EUR 25.00").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /remove one margherita/i }));
    expect(screen.getAllByText("EUR 12.50").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /^remove margherita$/i }));
    await waitFor(() => {
      expect(screen.queryByText("Margherita", { selector: "p" })).not.toBeInTheDocument();
    });
  });

  it("persists cart contents after remounting the page", async () => {
    const firstRender = renderWithUser(<RestaurantSite restaurant={bellaNapoli} />);
    const margheritaCard = screen.getByRole("heading", { name: "Margherita" }).closest("article");
    const addMargherita = within(margheritaCard as HTMLElement).getByRole("button", { name: /add to order/i });

    await firstRender.user.click(addMargherita);
    expect(screen.getByRole("button", { name: /view order/i })).toBeVisible();

    firstRender.unmount();
    renderWithUser(<RestaurantSite restaurant={bellaNapoli} />);

    expect(await screen.findByRole("button", { name: /view order/i })).toBeVisible();
    expect(screen.getByText(/1 item/i)).toBeVisible();
  });

  it("keeps the restaurant page usable at a mobile width", () => {
    window.innerWidth = 390;
    window.dispatchEvent(new Event("resize"));

    renderWithUser(<RestaurantSite restaurant={bellaNapoli} />);

    expect(screen.getByRole("heading", { name: bellaNapoli.tagline })).toBeVisible();
    expect(screen.getByRole("button", { name: /toggle menu/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /a menu that feels curated/i })).toBeVisible();
  });
});
