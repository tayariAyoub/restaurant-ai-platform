import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RestaurantSite from "./RestaurantSite";
import { cartStorageKey } from "@/lib/cartStorage";
import { bellaNapoli, orderResponse } from "@/test/fixtures";
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

    expect(screen.getByRole("heading", { name: bellaNapoli.name })).toBeVisible();
    expect(screen.getByText(bellaNapoli.tagline)).toBeVisible();
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
    expect(screen.getByRole("button", { name: /open ai maitre d/i })).toBeVisible();
  });

  it("renders immersive theme sections for Ultraviolet Luxury restaurants", () => {
    renderWithUser(
      <RestaurantSite
        restaurant={{
          ...bellaNapoli,
          theme: bellaNapoli.theme
            ? {
                ...bellaNapoli.theme,
                key: "ultraviolet-luxury",
                name: "Ultraviolet Luxury",
                primary_color: "#b78cff",
                secondary_color: "#20d6d2",
                background_color: "#05030b",
                text_color: "#f7f2ff",
                homepage_style: "immersive",
                menu_style: "refined",
                gallery_style: "masonry",
              }
            : null,
          primary_color: "#b78cff",
          secondary_color: "#20d6d2",
          background_color: "#05030b",
          text_color: "#f7f2ff",
          homepage_style: "immersive",
          menu_style: "refined",
          gallery_style: "masonry",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: /a cinematic evening/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /private evenings and special tables/i })).toBeVisible();
    expect(screen.getAllByText(/AI Maitre d'/i).length).toBeGreaterThan(0);
  });

  it("adds items, updates quantity, removes items, and recalculates totals", async () => {
    const { user } = renderWithUser(<RestaurantSite restaurant={bellaNapoli} />);

    const margheritaCard = screen.getByRole("heading", { name: "Margherita" }).closest("article");
    expect(margheritaCard).not.toBeNull();
    const addMargherita = within(margheritaCard as HTMLElement).getByRole("button", { name: /add to order/i });

    await user.click(addMargherita);
    await user.click(addMargherita);
    await user.click(screen.getByRole("button", { name: /view order/i }));

    expect(screen.getByText(/payment is handled by the restaurant/i)).toBeVisible();
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

  it("clears the persisted cart only after a successful order", async () => {
    let resolveOrder!: (value: typeof orderResponse) => void;
    requestMock.mockReturnValueOnce(new Promise((resolve) => {
      resolveOrder = resolve;
    }));
    const { user } = renderWithUser(<RestaurantSite restaurant={bellaNapoli} />);
    const margheritaCard = screen.getByRole("heading", { name: "Margherita" }).closest("article");

    await user.click(within(margheritaCard as HTMLElement).getByRole("button", { name: /add to order/i }));
    await user.click(screen.getByRole("button", { name: /view order/i }));
    await user.type(screen.getAllByPlaceholderText(/your name/i).at(-1) as HTMLElement, "Giulia");
    await user.type(screen.getAllByPlaceholderText(/phone number/i).at(-1) as HTMLElement, "123456");
    await user.click(screen.getByRole("button", { name: /confirm order/i }));

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledWith(
        "/restaurants/bella-napoli/orders",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(screen.getByRole("button", { name: /confirming order/i })).toBeDisabled();

    resolveOrder(orderResponse);
    expect(await screen.findByText(/order received/i)).toBeVisible();
    expect(localStorage.getItem(cartStorageKey(bellaNapoli.slug))).toBeNull();
  });

  it("keeps the persisted cart when order submission fails", async () => {
    requestMock.mockRejectedValueOnce(new Error("Kitchen is closed"));
    const { user } = renderWithUser(<RestaurantSite restaurant={bellaNapoli} />);
    const margheritaCard = screen.getByRole("heading", { name: "Margherita" }).closest("article");

    await user.click(within(margheritaCard as HTMLElement).getByRole("button", { name: /add to order/i }));
    await user.click(screen.getByRole("button", { name: /view order/i }));
    await user.type(screen.getAllByPlaceholderText(/your name/i).at(-1) as HTMLElement, "Giulia");
    await user.type(screen.getAllByPlaceholderText(/phone number/i).at(-1) as HTMLElement, "123456");
    await user.click(screen.getByRole("button", { name: /confirm order/i }));

    expect(await screen.findByText("Kitchen is closed")).toBeVisible();
    expect(localStorage.getItem(cartStorageKey(bellaNapoli.slug))).toContain("\"itemId\":201");
  });

  it("ignores corrupted persisted cart JSON safely", async () => {
    localStorage.setItem(cartStorageKey(bellaNapoli.slug), "{not-valid-json");

    renderWithUser(<RestaurantSite restaurant={bellaNapoli} />);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /view order/i })).not.toBeInTheDocument();
    });
    expect(localStorage.getItem(cartStorageKey(bellaNapoli.slug))).toBeNull();
  });

  it("keeps the restaurant page usable at a mobile width", () => {
    window.innerWidth = 390;
    window.dispatchEvent(new Event("resize"));

    renderWithUser(<RestaurantSite restaurant={bellaNapoli} />);

    expect(screen.getByRole("heading", { name: bellaNapoli.name })).toBeVisible();
    expect(screen.getByRole("button", { name: /toggle menu/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /a menu that feels curated/i })).toBeVisible();
  });
});
