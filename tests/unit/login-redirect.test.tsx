import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * Regression test for the bug where logging in from /login?next=%2Fadmin
 * always sent the user to /dashboard, dropping the intended destination.
 */

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, back: vi.fn() }),
}));

const signInWithPassword = vi.fn();
const signInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: (...args: unknown[]) => signInWithPassword(...args),
      signInWithOAuth: (...args: unknown[]) => signInWithOAuth(...args),
    },
  })),
}));

import LoginPage from "@/app/(auth)/login/page";
import { AuthForm } from "@/components/auth/auth-form";
import { resolvePostLoginPath } from "@/lib/validation/auth";

beforeEach(() => {
  push.mockReset();
  refresh.mockReset();
  signInWithPassword.mockReset();
  signInWithPassword.mockResolvedValue({ error: null });
  signInWithOAuth.mockReset();
  signInWithOAuth.mockResolvedValue({ error: null });
});

function submitLogin() {
  render(<AuthForm mode="login" next="/admin" />);
  fireEvent.change(screen.getByPlaceholderText("Email address"), {
    target: { value: "admin@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("Password (8+ characters)"), {
    target: { value: "supersecret123" },
  });
  fireEvent.submit(screen.getByRole("button", { name: "Log in" }).closest("form")!);
}

describe("login page preserving the intended admin destination", () => {
  it("passes the next search param through to the auth form", async () => {
    const page = await LoginPage({
      searchParams: Promise.resolve({ next: "/admin" }),
    });

    // AuthShell children: [SearchParamsMessage, AuthForm, footer links]
    const children = (page as React.ReactElement<{ children: React.ReactElement[] }>)
      .props.children;
    const authForm = children.find(
      (child) => child.type === AuthForm
    ) as React.ReactElement<{ mode: string; next?: string }> | undefined;

    expect(authForm).toBeTruthy();
    expect(authForm!.props.next).toBe("/admin");
    expect(authForm!.props.mode).toBe("login");
  });

  it("redirects to the preserved destination after a successful login", async () => {
    submitLogin();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin"));
    expect(refresh).toHaveBeenCalled();
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "supersecret123",
    });
  });

  it("falls back to /dashboard when no destination was preserved", async () => {
    render(<AuthForm mode="login" />);
    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password (8+ characters)"), {
      target: { value: "supersecret123" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Log in" }).closest("form")!);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
  });

  it("refuses to treat external URLs as the post-login destination", () => {
    expect(resolvePostLoginPath("/admin")).toBe("/admin");
    expect(resolvePostLoginPath("/admin/leads")).toBe("/admin/leads");
    expect(resolvePostLoginPath(undefined)).toBe("/dashboard");
    expect(resolvePostLoginPath("//evil.example")).toBe("/dashboard");
    expect(resolvePostLoginPath("///evil.example")).toBe("/dashboard");
    expect(resolvePostLoginPath("https://evil.example")).toBe("/dashboard");
    expect(resolvePostLoginPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("rejects URL-parser bypasses that resolve off-origin", () => {
    // The WHATWG URL parser treats "\" as "/" and strips tab/CR/LF, so these
    // would otherwise resolve to https://evil.example despite starting with "/".
    expect(resolvePostLoginPath("/\\evil.example")).toBe("/dashboard");
    expect(resolvePostLoginPath("/\t//evil.example")).toBe("/dashboard");
    expect(resolvePostLoginPath("/\n//evil.example")).toBe("/dashboard");
    expect(resolvePostLoginPath("/\r//evil.example")).toBe("/dashboard");
    expect(resolvePostLoginPath("/\u0000admin")).toBe("/dashboard");
  });

  it("sends a sanitized destination through the OAuth callback URL", async () => {
    signInWithOAuth.mockResolvedValue({ error: null });

    render(<AuthForm mode="login" next="/admin" />);
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalled());
    const options = signInWithOAuth.mock.calls[0][0] as {
      options: { redirectTo: string };
    };
    expect(options.options.redirectTo).toBe(
      `${location.origin}/auth/callback?next=%2Fadmin`
    );
  });

  it("does not navigate on a failed login even when next is set", async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    render(<AuthForm mode="login" next="/admin" />);
    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password (8+ characters)"), {
      target: { value: "wrongpassword123" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Log in" }).closest("form")!);

    // The form maps raw Supabase errors to a user-friendly message.
    await waitFor(() =>
      expect(
        screen.getByText("Invalid email or password. Please check your credentials and try again.")
      ).toBeTruthy()
    );
    expect(push).not.toHaveBeenCalled();
  });
});
