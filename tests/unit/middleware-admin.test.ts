import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * @vitest-environment node
 *
 * Route protection for /admin lives in middleware.ts.
 *
 * Covers:
 *  1. an authenticated administrator opening /admin is allowed through
 *  2. a logged-out user is redirected to /login and the intended
 *     destination is preserved in ?next=
 *  3. an authenticated non-admin is denied access and sent to /dashboard
 */

const session = vi.hoisted(() => ({
  user: null as { id: string } | null,
  profile: null as { role: string } | null,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: session.user } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: session.profile,
            error: session.profile ? null : { message: "not found" },
          }),
        }),
        // used by the /messages subscription gate (not exercised here)
        or: () => ({
          in: () => ({
            limit: () => ({
              single: async () => ({ data: null, error: { message: "no rows" } }),
            }),
          }),
        }),
      }),
    }),
  }),
}));

import { middleware } from "@/middleware";

function adminRequest(path: string) {
  return new NextRequest(`https://proconect.co.za${path}`);
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  session.user = null;
  session.profile = null;
});

describe("middleware /admin protection", () => {
  it("lets an authenticated administrator through to /admin", async () => {
    session.user = { id: "admin-1" };
    session.profile = { role: "admin" };

    const response = await middleware(adminRequest("/admin"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBe(200);
  });

  it("redirects a logged-out user to /login and preserves /admin as next", async () => {
    session.user = null;

    const response = await middleware(adminRequest("/admin"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://proconect.co.za/login?next=%2Fadmin"
    );
  });

  it("preserves the intended admin destination for nested admin pages too", async () => {
    session.user = null;

    const response = await middleware(adminRequest("/admin/leads"));

    expect(response.headers.get("location")).toBe(
      "https://proconect.co.za/login?next=%2Fadmin%2Fleads"
    );
  });

  it("denies an authenticated non-admin and redirects to /dashboard", async () => {
    session.user = { id: "customer-1" };
    session.profile = { role: "customer" };

    const response = await middleware(adminRequest("/admin"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://proconect.co.za/dashboard"
    );
  });

  it("also denies authenticated professionals", async () => {
    session.user = { id: "pro-1" };
    session.profile = { role: "professional" };

    const response = await middleware(adminRequest("/admin"));

    expect(response.headers.get("location")).toBe(
      "https://proconect.co.za/dashboard"
    );
  });
});
