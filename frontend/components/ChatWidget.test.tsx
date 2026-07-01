import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ChatWidget from "./ChatWidget";
import { renderWithUser } from "@/test/test-utils";

const requestMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  default: requestMock,
}));

describe("ChatWidget", () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it("opens and enables send only for a valid message", async () => {
    const { user } = renderWithUser(<ChatWidget slug="bella-napoli" restaurantName="Bella Napoli" />);

    await user.click(screen.getByRole("button", { name: /open ai maitre d/i }));

    expect(screen.getByText(/Bella Napoli AI Maitre d'/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/tell me your mood/i), "What should I order?");
    expect(screen.getByRole("button", { name: /send message/i })).toBeEnabled();
  });

  it("hides the floating launcher while open and closes from the panel header", async () => {
    const { user } = renderWithUser(<ChatWidget slug="bella-napoli" restaurantName="Bella Napoli" />);

    const launcher = screen.getByRole("button", { name: /open ai maitre d/i });
    expect(launcher).toBeVisible();

    await user.click(launcher);

    expect(screen.getByText(/Bella Napoli AI Maitre d'/i)).toBeVisible();
    expect(screen.queryByRole("button", { name: /open ai maitre d/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /close chat/i })).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /close chat/i }));

    expect(screen.queryByText(/Bella Napoli AI Maitre d'/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open ai maitre d/i })).toBeVisible();
  });

  it("shows loading state, sources, and renders a successful response", async () => {
    let resolveResponse: (value: unknown) => void = () => undefined;
    requestMock.mockReturnValue(
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
    );
    const { user } = renderWithUser(<ChatWidget slug="bella-napoli" restaurantName="Bella Napoli" />);

    await user.click(screen.getByRole("button", { name: /open ai maitre d/i }));
    await user.type(screen.getByPlaceholderText(/tell me your mood/i), "Plan dinner");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByText(/reviewing menu, hours, and policies/i)).toBeVisible();

    resolveResponse({
      answer: "Start with burrata, then Margherita.",
      conversation_id: "chat-1",
      sources: ["menu"],
    });

    expect(await screen.findByText("Start with burrata, then Margherita.")).toBeVisible();
    expect(await screen.findByText(/sources: menu/i)).toBeVisible();
  });

  it("shows an error message when chat fails", async () => {
    requestMock.mockRejectedValue(new Error("Network failed"));
    const { user } = renderWithUser(<ChatWidget slug="bella-napoli" restaurantName="Bella Napoli" />);

    await user.click(screen.getByRole("button", { name: /open ai maitre d/i }));
    await user.type(screen.getByPlaceholderText(/tell me your mood/i), "Help");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/please call the restaurant/i)).toBeVisible();
    });
  });

  it("shows a friendlier message when chat is rate limited", async () => {
    requestMock.mockRejectedValue(new Error("Too many requests. Please wait a moment and try again."));
    const { user } = renderWithUser(<ChatWidget slug="bella-napoli" restaurantName="Bella Napoli" />);

    await user.click(screen.getByRole("button", { name: /open ai maitre d/i }));
    await user.type(screen.getByPlaceholderText(/tell me your mood/i), "Help");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/taking a short pause/i)).toBeVisible();
    });
  });
});
