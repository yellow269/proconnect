import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * /auth/callback receives the OAuth ?next= destination and redirects the
 * user after the code exchange. It must apply the same same-origin
 * validation as the login form (shared resolvePostLoginPath).
 */

const exchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession: (...args: unknown[]) =>
        exchangeCodeForSession(...args),
    },
  }),
}));

import { GET } from "@/app/auth/callback/route";

function callbackUrl(params: Record<string, string>) {
  const search = new URLSearchParams(params);
  return `https://proconect.co.za/auth/callback?${search.toString()}`;
}

beforeEach(() => {
  exchangeCodeForSession.mockReset();
  exchangeCodeForSession.mockResolvedValue({ error: null });
});

describe("/auth/callback redirect validation", () => {
  it("redirects to the preserved admin destination after exchanging the code", async () => {
    const response = await GET(
      new Request(callbackUrl({ code: "oauth-code", next: "/admin" }))
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("oauth-code");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://proconect.co.za/admin"
    );
  });

  it("falls back to /dashboard when next is absent", async () => {
    const response = await GET(
      new Request(callbackUrl({ code: "oauth-code" }))
    );

    expect(response.headers.get("location")).toBe(
      "https://proconect.co.za/dashboard"
    );
  });

  it("refuses protocol-relative and external destinations", async () => {
    for (const bad of ["//evil.example", "https://evil.example", "///evil.example"]) {
      exchangeCodeForSession.mockClear();
      const response = await GET(
        new Request(callbackUrl({ code: "oauth-code", next: bad }))
      );

      expect(response.headers.get("location")).toBe(
        "https://proconect.co.za/dashboard"
      );
    }
  });

  it("refuses URL-parser bypasses that resolve off-origin", async () => {
    const bypasses = ["/\\evil.example", "/\t//evil.example", "/\n//evil.example"];
    for (const bad of bypasses) {
      const response = await GET(
        new Request(
          `https://proconect.co.za/auth/callback?code=oauth-code&next=${encodeURIComponent(bad)}`
        )
      );

      expect(response.headers.get("location")).toBe(
        "https://proconect.co.za/dashboard"
      );
    }
  });

  it("sends the user to login when the code exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "bad code" } });

    const response = await GET(
      new Request(callbackUrl({ code: "bad-code", next: "/admin" }))
    );

    expect(response.headers.get("location")).toBe(
      "https://proconect.co.za/login?error=Authentication%20failed"
    );
  });
});
