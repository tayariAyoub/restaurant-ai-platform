import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "./page";
import { routerPushMock } from "@/test/setup";
import { renderWithUser } from "@/test/test-utils";

const requestMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  default: requestMock,
}));

describe("admin login", () => {
  beforeEach(() => {
    localStorage.clear();
    requestMock.mockReset();
    routerPushMock.mockReset();
  });

  it("renders the login form and demo account helpers", () => {
    renderWithUser(<LoginPage />);

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    expect(screen.getByPlaceholderText("Email")).toBeVisible();
    expect(screen.getByPlaceholderText("Password")).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeVisible();
    expect(screen.getByRole("button", { name: /restaurant owner/i })).toBeVisible();
  });

  it("does not submit when required fields are empty", async () => {
    const { user } = renderWithUser(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(requestMock).not.toHaveBeenCalled();
  });

  it("shows loading state and stores token on success", async () => {
    let resolveLogin: (value: unknown) => void = () => undefined;
    requestMock.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );
    const { user } = renderWithUser(<LoginPage />);

    await user.type(screen.getByPlaceholderText("Email"), "owner@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "owner-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();

    resolveLogin({ access_token: "token-123" });

    await waitFor(() => {
      expect(localStorage.getItem("restaurant_ai_token")).toBe("token-123");
      expect(routerPushMock).toHaveBeenCalledWith("/admin");
    });
  });

  it("shows an error state when login fails", async () => {
    requestMock.mockRejectedValue(new Error("Invalid email or password"));
    const { user } = renderWithUser(<LoginPage />);

    await user.type(screen.getByPlaceholderText("Email"), "owner@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid email or password")).toBeVisible();
    expect(localStorage.getItem("restaurant_ai_token")).toBeNull();
  });
});
