"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emailSchema, loginSchema, registerSchema, resetSchema } from "@/lib/validation/auth";

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid email or password")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  if (m.includes("email not confirmed")) {
    return "Please confirm your email address before logging in. Check your inbox for the confirmation link.";
  }
  if (m.includes("user not found")) {
    return "No account found with this email. Please register first.";
  }
  if (m.includes("too many requests") || m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (m.includes("signup disabled")) {
    return "Registration is temporarily disabled. Please try again later.";
  }
  if (m.includes("email provider disabled") || m.includes("email logins are disabled")) {
    return "Email login is not enabled. Please contact support.";
  }
  if (m.includes("already registered") || m.includes("already exists")) {
    return "An account with this email already exists. Please log in instead.";
  }
  if (m.includes("email address is invalid")) {
    return "Please enter a valid email address.";
  }
  if (m.includes("password should be at least")) {
    return "Password must be at least 8 characters long.";
  }
  if (m.includes("unable to validate email address")) {
    return "Please enter a valid email address.";
  }
  if (m.includes("password") && m.includes("match")) {
    return "Passwords do not match.";
  }
  if (m.includes("new password")) {
    return "Password reset link has expired or is invalid. Please request a new one.";
  }
  if (m.includes("network") || m.includes("fetch") || m.includes("connection")) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }
  return "We\u2019re having trouble connecting to the login service. Please try again later.";
}

export function AuthForm({ mode }: { mode: "login" | "register" | "forgot" | "reset" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  async function submit(formData: FormData) {
    // Prevent double-submit
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError("");

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const fullName = String(formData.get("fullName") ?? "");
    const role = String(formData.get("role") ?? "customer");

    const parsed =
      mode === "login"
        ? loginSchema.safeParse({ email, password })
        : mode === "register"
          ? registerSchema.safeParse({ email, password, confirmPassword, fullName, role })
          : mode === "forgot"
            ? emailSchema.safeParse({ email })
            : resetSchema.safeParse({ password, confirmPassword });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      setLoading(false);
      submitting.current = false;
      return;
    }

    const supabase = createClient();

    try {
      if (mode === "login") {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) {
          setError(friendlyError(loginError.message));
          setLoading(false);
          submitting.current = false;
          return;
        }
        router.push("/dashboard");
        router.refresh();
      } else if (mode === "register") {
        // Single API call handles signup + confirm + login
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, fullName, role }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(friendlyError(data.error || "Registration failed"));
          setLoading(false);
          submitting.current = false;
          return;
        }

        // Set session from API response
        if (data.session?.access_token && data.session?.refresh_token) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          router.push("/dashboard");
          router.refresh();
        } else {
          // Account created but cannot auto-login (email confirmation needed)
          setError(
            data.error ||
              "Account created. Please check your email for a confirmation link before logging in."
          );
          setLoading(false);
          submitting.current = false;
        }
      } else if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/reset-password`,
        });
        if (resetError) {
          setError(friendlyError(resetError.message));
          setLoading(false);
          submitting.current = false;
          return;
        }
        router.push("/login?message=Check your email for the password reset link.");
      } else if (mode === "reset") {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
          setError(friendlyError(updateError.message));
          setLoading(false);
          submitting.current = false;
          return;
        }
        router.push("/login?message=Password updated successfully. Please log in.");
        router.refresh();
      }
    } catch {
      setError("Unable to connect to the server. Please check your internet connection.");
      setLoading(false);
      submitting.current = false;
    }
  }

  async function google() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <form action={submit} className="space-y-4">
      {mode === "register" && (
        <>
          <Input name="fullName" placeholder="Full name" required minLength={2} />
          <select
            name="role"
            className="h-11 w-full rounded-xl border bg-transparent px-3 text-sm dark:border-slate-700"
          >
            <option value="customer">I need a service</option>
            <option value="professional">I offer services</option>
          </select>
        </>
      )}

      {mode !== "reset" && (
        <Input
          name="email"
          type="email"
          placeholder="Email address"
          required
          autoComplete="email"
        />
      )}

      {mode !== "forgot" && (
        <Input
          name="password"
          type="password"
          placeholder="Password (8+ characters)"
          minLength={8}
          maxLength={72}
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      )}

      {(mode === "register" || mode === "reset") && (
        <Input
          name="confirmPassword"
          type="password"
          placeholder="Confirm password"
          minLength={8}
          maxLength={72}
          required
          autoComplete="new-password"
        />
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <Button className="w-full" disabled={loading}>
        {loading
          ? "Please wait\u2026"
          : ({ login: "Log in", register: "Create account", forgot: "Send reset link", reset: "Update password" }[mode])}
      </Button>

      {(mode === "login" || mode === "register") && (
        <>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            OR
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>
          <Button type="button" variant="secondary" className="w-full" onClick={google}>
            Continue with Google
          </Button>
        </>
      )}
    </form>
  );
}
