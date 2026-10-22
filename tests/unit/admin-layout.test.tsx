import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * Defense in depth: app/admin/layout.tsx re-checks the admin role on every
 * request, independently of the middleware.
 */

const session = vi.hoisted(() => ({
  user: null as { id: string } | null,
  profile: null as { role: string } | null,
}));

const redirect = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: session.user } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: session.profile, error: null }),
        }),
      }),
    }),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
  usePathname: () => "/admin/leads",
}));

import AdminLayout from "@/app/admin/layout";

beforeEach(() => {
  session.user = null;
  session.profile = null;
  redirect.mockClear();
});

describe("AdminLayout authorization", () => {
  it("renders admin pages for an authenticated administrator", async () => {
    session.user = { id: "admin-1" };
    session.profile = { role: "admin" };

    const layout = await AdminLayout({ children: <p>Leads content</p> });
    render(layout);

    expect(screen.getByText("ProConnect Admin")).toBeTruthy();
    expect(screen.getByText("Leads content")).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects a logged-out user to login and preserves the admin destination", async () => {
    session.user = null;

    await expect(AdminLayout({ children: <p>Leads</p> })).rejects.toThrow(
      "NEXT_REDIRECT:/login?next=%2Fadmin%2Fleads"
    );
    expect(redirect).toHaveBeenCalledWith("/login?next=%2Fadmin%2Fleads");
  });

  it("redirects an authenticated non-admin to /dashboard", async () => {
    session.user = { id: "customer-1" };
    session.profile = { role: "customer" };

    await expect(AdminLayout({ children: <p>Leads</p> })).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard"
    );
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects an authenticated professional to /dashboard", async () => {
    session.user = { id: "pro-1" };
    session.profile = { role: "professional" };

    await expect(AdminLayout({ children: <p>Leads</p> })).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard"
    );
  });
});
