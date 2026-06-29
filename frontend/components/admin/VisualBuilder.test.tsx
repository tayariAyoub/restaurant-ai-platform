import { fireEvent, screen, waitFor } from "@testing-library/react";
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
  {
    id: 2,
    key: "japanese",
    name: "Japanese Minimal",
    description: "Quiet sushi counter precision",
    primary_color: "#111111",
    secondary_color: "#b23a31",
    background_color: "#fafafa",
    text_color: "#171717",
    font_family: "Inter",
    button_style: "square",
    homepage_style: "minimal",
    menu_style: "minimal",
    gallery_style: "filmstrip",
  },
  {
    id: 3,
    key: "ultraviolet-luxury",
    name: "Ultraviolet Luxury",
    description: "Dark cinematic fine dining",
    primary_color: "#b78cff",
    secondary_color: "#20d6d2",
    background_color: "#05030b",
    text_color: "#f7f2ff",
    font_family: "Cormorant Garamond",
    button_style: "pill",
    homepage_style: "immersive",
    menu_style: "refined",
    gallery_style: "masonry",
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
      if (path === "/admin/restaurants/1/image-url" && options?.method === "POST") {
        const payload = JSON.parse(String(options.body));
        return Promise.resolve({ id: 99, restaurant_id: 1, sort_order: 2, created_at: "2026-01-01T00:00:00Z", ...payload });
      }
      if (path === "/admin/restaurants/1/loading-video" && options?.method === "POST") {
        return Promise.resolve({
          ...bellaNapoli,
          loading_video_url: "/uploads/1/videos/loading.mp4",
          loading_video_filename: "loading.mp4",
          loading_video_size_bytes: 11,
        });
      }
      if (path === "/admin/restaurants/1/loading-video" && options?.method === "DELETE") {
        return Promise.resolve({
          ...bellaNapoli,
          loading_video_url: "",
          loading_video_filename: "",
          loading_video_size_bytes: 0,
        });
      }
      if (path.startsWith("/admin/restaurants/1/images/") && options?.method === "DELETE") return Promise.resolve(undefined);
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

  it("shows unsaved state, applies a premium theme, and saves it", async () => {
    const { user } = renderWithUser(<VisualBuilder restaurantId={1} />);

    expect(await screen.findByDisplayValue(bellaNapoli.name)).toBeVisible();
    expect(screen.getAllByText("Saved").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /brand/i }));
    await user.click(screen.getByRole("button", { name: /japanese minimal/i }));

    expect(screen.getByText("Unsaved")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(adminRequestMock).toHaveBeenCalledWith(
        "/admin/restaurants/1",
        "token-123",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"theme_id":2'),
        }),
      );
    });
    expect(await screen.findByText(/website saved/i)).toBeVisible();
  });

  it("uses the shared public theme registry for the live preview and persisted theme payload", async () => {
    const { user } = renderWithUser(<VisualBuilder restaurantId={1} />);

    expect(await screen.findByDisplayValue(bellaNapoli.name)).toBeVisible();
    await user.click(screen.getByRole("button", { name: /brand/i }));
    await user.click(screen.getByRole("button", { name: /ultraviolet luxury/i }));

    expect(screen.getByText("Cinematic nocturne")).toBeVisible();
    expect(screen.getByText(/A cinematic evening, staged around taste/i)).toBeVisible();
    expect(screen.getAllByText("Ultraviolet Luxury", { selector: "p" }).length).toBeGreaterThan(1);

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(adminRequestMock).toHaveBeenCalledWith(
        "/admin/restaurants/1",
        "token-123",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"theme_id":3'),
        }),
      );
    });

    const saveCall = adminRequestMock.mock.calls.find(
      ([path, , options]) => path === "/admin/restaurants/1" && options?.method === "PUT",
    );
    expect(saveCall).toBeDefined();
    const payload = JSON.parse(String(saveCall?.[2]?.body));
    expect(payload).toMatchObject({
      theme_id: 3,
      primary_color: "#b78cff",
      secondary_color: "#20d6d2",
      background_color: "#05030b",
      text_color: "#f7f2ff",
      homepage_style: "immersive",
      menu_style: "refined",
      gallery_style: "masonry",
    });
  });

  it("shows image previews, broken-image fallback, and clear controls", async () => {
    const { user } = renderWithUser(<VisualBuilder restaurantId={1} />);

    expect(await screen.findByDisplayValue(bellaNapoli.name)).toBeVisible();
    await user.click(screen.getByRole("button", { name: /brand/i }));

    const heroPreview = screen.getByAltText("hero preview");
    expect(heroPreview).toBeVisible();

    fireEvent.error(heroPreview);

    expect(await screen.findByText(/image url could not load/i)).toBeVisible();
    await user.click(screen.getByRole("button", { name: /clear hero image url/i }));
    expect(screen.getByLabelText(/hero image url/i)).toHaveValue("");
    expect(screen.getByText("Unsaved")).toBeVisible();
  });

  it("uploads, previews, and removes the loading video from the brand section", async () => {
    const { user } = renderWithUser(<VisualBuilder restaurantId={1} />);

    expect(await screen.findByDisplayValue(bellaNapoli.name)).toBeVisible();
    await user.click(screen.getByRole("button", { name: /brand/i }));

    expect(screen.getByText("Loading Experience")).toBeVisible();
    expect(screen.getByText(/premium static loader will be used/i)).toBeVisible();

    const file = new File(["video-bytes"], "loading.mp4", { type: "video/mp4" });
    await user.upload(screen.getByLabelText(/upload loading video/i), file);

    await waitFor(() => {
      expect(adminRequestMock).toHaveBeenCalledWith(
        "/admin/restaurants/1/loading-video",
        "token-123",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        }),
      );
    });
    expect(await screen.findByLabelText(/loading video preview/i)).toHaveAttribute("src", "/uploads/1/videos/loading.mp4");
    expect(screen.getByText("loading.mp4")).toBeVisible();
    expect(screen.getByText("11 B")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /remove/i }));

    await waitFor(() => {
      expect(adminRequestMock).toHaveBeenCalledWith(
        "/admin/restaurants/1/loading-video",
        "token-123",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    expect(await screen.findByText(/premium static loader will be used/i)).toBeVisible();
  });

  it("rejects invalid loading video files before upload", async () => {
    const { user } = renderWithUser(<VisualBuilder restaurantId={1} />);

    expect(await screen.findByDisplayValue(bellaNapoli.name)).toBeVisible();
    await user.click(screen.getByRole("button", { name: /brand/i }));

    const invalidFile = new File(["not-video"], "loading.mov", { type: "video/mp4" });
    await user.upload(screen.getByLabelText(/upload loading video/i), invalidFile);

    expect(await screen.findByText(/upload an mp4 loading video/i)).toBeVisible();
    expect(adminRequestMock).not.toHaveBeenCalledWith(
      "/admin/restaurants/1/loading-video",
      "token-123",
      expect.anything(),
    );
  });

  it("warns before leaving with unsaved changes", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { user } = renderWithUser(<VisualBuilder restaurantId={1} />);

    const nameField = await screen.findByDisplayValue(bellaNapoli.name);
    await user.type(nameField, " Updated");
    await user.click(screen.getByRole("link", { name: /back to restaurants/i }));

    expect(confirmSpy).toHaveBeenCalledWith("You have unsaved changes. Leave this page anyway?");
    confirmSpy.mockRestore();
  });

  it("disables save actions while saving", async () => {
    let resolveSave!: (value: typeof bellaNapoli) => void;
    adminRequestMock.mockImplementation((path: string, _token: string, options?: RequestInit) => {
      if (path === "/auth/me") return Promise.resolve(superAdmin);
      if (path === "/admin/themes") return Promise.resolve(themes);
      if (path === "/admin/restaurants-overview") return Promise.resolve(restaurantOverview);
      if (path === "/admin/users") return Promise.resolve([owner]);
      if (path === "/admin/restaurants/1" && !options) return Promise.resolve(bellaNapoli);
      if (path === "/admin/restaurants/1" && options?.method === "PUT") {
        return new Promise((resolve) => {
          resolveSave = resolve;
        });
      }
      return Promise.resolve({});
    });
    const { user } = renderWithUser(<VisualBuilder restaurantId={1} />);

    const nameField = await screen.findByDisplayValue(bellaNapoli.name);
    await user.type(nameField, " Updated");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    resolveSave(bellaNapoli);
    expect(await screen.findByText(/website saved/i)).toBeVisible();
  });
});
