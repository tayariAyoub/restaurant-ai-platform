import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
);

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import Home from "./page";

describe("public root page", () => {
  it("redirects to the route-split Bella Napoli restaurant site", () => {
    expect(() => Home()).toThrow("NEXT_REDIRECT:/restaurants/bella-napoli");
    expect(redirectMock).toHaveBeenCalledWith("/restaurants/bella-napoli");
  });
});
