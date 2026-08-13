"use client";

import { useState } from "react";
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
  if (m.includes("too many requests") || m.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (m.includes("signup disabled")) {
    return "Registration is temporarily disabled. Please try again later.";
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
  return "Something went wrong. Please try again.";
}

export function AuthForm({ mode }: { mode: "login" | "register" | "forgot" | "reset" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
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
      return;
    }

    const supabase = createClient();
    let result: { error: { message: string } | null };

    try {
      if (mode === "login") {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else if (mode === "register") {
        // Use server-side registration with auto-confirm
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, fullName, role }),
        });
        const data = await res.json();
        if (!res.ok) {
          result = { error: { message: data.error || "Registration failed" } };
        } else {
          // Registration succeeded — auto-login
          result = await supabase.auth.signInWithPassword({ email, password });
        }
      } else if (mode === "forgot") {
        result = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/reset-password`,
        });
      } else {
        result = await supabase.auth.updateUser({ password });
      }
    } catch {
      setLoading(false);
      setError("Unable to connect to the server. Please check your internet connection.");
      return;
    }

    if (result.error) {
      setError(friendlyError(result.error.message));
      setLoading(false);
      return;
    }

    if (mode === "forgot") {
      router.push("/login?message=Check your email");
    } else if (mode === "register") {
      // Registration + auto-login succeeded — go to dashboard
      router.push("/dashboard");
    } else if (mode === "reset") {
      router.push("/login?message=Password updated successfully");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
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
            <option value="customer">I need work done</option>
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
          ? "Please wait…"
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
