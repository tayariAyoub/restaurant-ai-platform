import { screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AiControlPanel from "./AiControlPanel";
import { bellaNapoli } from "@/test/fixtures";
import { renderWithUser } from "@/test/test-utils";

const adminRequestMock = vi.hoisted(() => vi.fn());
const requestMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/admin/AdminShell", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/auth", () => ({
  getToken: () => "token-123",
}));

vi.mock("@/lib/api", () => ({
  default: requestMock,
  adminRequest: adminRequestMock,
}));

const conversations = [
  {
    id: "conversation-1",
    restaurant_id: 1,
    visitor_name: "",
    visitor_email: "",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    messages: [
      {
        id: 1,
        role: "user" as const,
        content: "Do you have nut-free desserts?",
        is_unanswered: false,
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: 2,
        role: "assistant" as const,
        content: "I do not have that detail yet.",
        is_unanswered: true,
        created_at: "2026-01-01T00:01:00Z",
      },
    ],
  },
];

describe("AiControlPanel", () => {
  beforeEach(() => {
    adminRequestMock.mockReset();
    requestMock.mockReset();
    adminRequestMock.mockImplementation((path: string, _token: string, options?: RequestInit) => {
      if (path === "/admin/restaurants/1" && !options) return Promise.resolve(bellaNapoli);
      if (path === "/admin/restaurants/1/documents") return Promise.resolve([]);
      if (path === "/admin/restaurants/1/conversations") return Promise.resolve(conversations);
      if (path === "/admin/restaurants/1" && options?.method === "PUT") {
        return Promise.resolve({ ...bellaNapoli, ...JSON.parse(String(options.body)) });
      }
      return Promise.resolve({});
    });
  });

  it("renders AI settings, readiness, unanswered questions, and workspace links", async () => {
    renderWithUser(<AiControlPanel restaurantId={1} />);

    expect(await screen.findByRole("heading", { name: /bella napoli ai maitre d/i })).toBeVisible();
    expect(screen.getByLabelText(/ai name/i)).toHaveValue("Bella AI Maitre d'");
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

  it("runs an AI test without calling real OpenAI from the frontend", async () => {
    requestMock.mockResolvedValue({
      answer: "Start with Margherita.",
      conversation_id: "conversation-test",
      unanswered: false,
      sources: ["menu"],
    });
    const { user } = renderWithUser(<AiControlPanel restaurantId={1} />);

    await screen.findByRole("heading", { name: /bella napoli ai maitre d/i });
    await user.type(screen.getByPlaceholderText(/ask a test question/i), "What pizza should I order?");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledWith(
        "/restaurants/bella-napoli/chat",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("What pizza should I order?"),
        }),
      );
    });
    expect(await screen.findByText("Start with Margherita.")).toBeVisible();
    expect(await screen.findByText(/sources: menu/i)).toBeVisible();
  });
});
