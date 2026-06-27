import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
});

Element.prototype.scrollIntoView = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
    React.createElement("a", { href: typeof href === "string" ? href : String(href), ...props }, children)
  ),
}));

export const routerPushMock = vi.fn();
export const routerReplaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
    replace: routerReplaceMock,
  }),
  usePathname: () => "/admin/login",
}));
