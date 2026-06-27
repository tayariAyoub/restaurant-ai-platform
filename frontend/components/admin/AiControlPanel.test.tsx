import { screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AiControlPanel from "./AiControlPanel";
import { bellaNapoli } from "@/test/fixtures";
import { renderWithUser } from "@/test/test-utils";
import type { Conversation, RestaurantFaq } from "@/lib/types";

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

function unansweredConversation(reviewed = false): Conversation {
  return {
    id: "conversation-1",
    restaurant_id: 1,
    visitor_name: "",
    visitor_email: "",
    is_test: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    messages: [
      {
        id: 1,
        role: "user",
        content: "Do you have nut-free desserts?",
        is_unanswered: false,
        is_reviewed: false,
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: 2,
        role: "assistant",
        content: "I do not have that detail yet.",
        is_unanswered: true,
        is_reviewed: reviewed,
        created_at: "2026-01-01T00:01:00Z",
      },
    ],
  };
}

describe("AiControlPanel", () => {
  let conversations: Conversation[];
  let faqs: RestaurantFaq[];

  beforeEach(() => {
    conversations = [unansweredConversation()];
    faqs = [
      {
        id: 10,
        restaurant_id: 1,
        question: "Can I reserve a table?",
        answer: "Yes, use the reservation form or call the restaurant.",
        is_active: true,
        sort_order: 0,
        source_message_id: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];
    adminRequestMock.mockReset();
    adminRequestMock.mockImplementation((path: string, _token: string, options?: RequestInit) => {
      if (path === "/admin/restaurants/1" && !options) return Promise.resolve(bellaNapoli);
      if (path === "/admin/restaurants/1/documents") return Promise.resolve([]);
      if (path === "/admin/restaurants/1/conversations") return Promise.resolve(conversations);
      if (path === "/admin/restaurants/1/faqs" && !options) return Promise.resolve(faqs);
      if (path === "/admin/restaurants/1" && options?.method === "PUT") {
        return Promise.resolve({ ...bellaNapoli, ...JSON.parse(String(options.body)) });
      }
      if (path === "/admin/restaurants/1/ai-test" && options?.method === "POST") {
        return Promise.resolve({
          answer: "Start with Margherita.",
          conversation_id: "conversation-test",
          unanswered: false,
          sources: ["menu"],
        });
      }
      if (path === "/admin/restaurants/1/faqs" && options?.method === "POST") {
        const payload = JSON.parse(String(options.body));
        const created: RestaurantFaq = {
          id: 11,
          restaurant_id: 1,
          source_message_id: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          ...payload,
        };
        faqs = [...faqs, created];
        return Promise.resolve(created);
      }
      if (path === "/admin/restaurants/1/messages/2/review" && options?.method === "PATCH") {
        conversations = [unansweredConversation(true)];
        return Promise.resolve(conversations[0].messages[1]);
      }
      if (path === "/admin/restaurants/1/messages/2/faq" && options?.method === "POST") {
        const payload = JSON.parse(String(options.body));
        const created: RestaurantFaq = {
          id: 12,
          restaurant_id: 1,
          source_message_id: 2,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          ...payload,
        };
        faqs = [...faqs, created];
        conversations = [unansweredConversation(true)];
        return Promise.resolve(created);
      }
      return Promise.resolve({});
    });
  });

  it("renders AI settings, FAQ knowledge, unanswered questions, and workspace links", async () => {
    renderWithUser(<AiControlPanel restaurantId={1} />);

    expect(await screen.findByRole("heading", { name: /bella napoli ai maitre d/i })).toBeVisible();
    expect(screen.getByLabelText(/ai name/i)).toHaveValue("Bella AI Maitre d'");
    expect(screen.getAllByText("Can I reserve a table?").length).toBeGreaterThan(0);
    expect(screen.getByText(/do you have nut-free desserts/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /menu builder/i })).toHaveAttribute("href", "/admin/builder/1/menu");
    expect(screen.getByRole("link", { name: /open public site/i })).toHaveAttribute("href", "/restaurants/bella-napoli");
  });

  it("saves AI settings through the existing restaurant update API", async () => {
    const { user } = renderWithUser(<AiControlPanel restaurantId={1} />);

    const nameInput = await screen.findByLabelText(/ai name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Bella Guide");
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(adminRequestMock).toHaveBeenCalledWith(
        "/admin/restaurants/1",
        "token-123",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"ai_name":"Bella Guide"'),
        }),
      );
    });
    expect(await screen.findByText(/ai settings saved/i)).toBeVisible();
  });

  it("runs an AI test through the protected admin test endpoint", async () => {
    const { user } = renderWithUser(<AiControlPanel restaurantId={1} />);

    await screen.findByRole("heading", { name: /bella napoli ai maitre d/i });
    await user.type(screen.getByPlaceholderText(/ask a test question/i), "What pizza should I order?");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    await waitFor(() => {
      expect(adminRequestMock).toHaveBeenCalledWith(
        "/admin/restaurants/1/ai-test",
        "token-123",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("What pizza should I order?"),
        }),
      );
    });
    expect(await screen.findByText("Start with Margherita.")).toBeVisible();
    expect(await screen.findByText(/sources: menu/i)).toBeVisible();
  });

  it("converts an unanswered customer question into FAQ knowledge", async () => {
    const { user } = renderWithUser(<AiControlPanel restaurantId={1} />);

    await screen.findByText(/do you have nut-free desserts/i);
    await user.type(screen.getByPlaceholderText(/write the exact restaurant-specific answer/i), "Please call us before ordering desserts with nut allergies.");
    await user.click(screen.getByRole("button", { name: /convert to faq/i }));

    await waitFor(() => {
      expect(adminRequestMock).toHaveBeenCalledWith(
        "/admin/restaurants/1/messages/2/faq",
        "token-123",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Please call us before ordering desserts"),
        }),
      );
    });
    expect(await screen.findByText(/question converted into faq knowledge/i)).toBeVisible();
    expect(await screen.findByText(/please call us before ordering desserts/i)).toBeVisible();
    expect(screen.queryByRole("button", { name: /convert to faq/i })).not.toBeInTheDocument();
  });
});
