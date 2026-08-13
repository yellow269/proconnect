import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email, password, fullName, role } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const validRole = role === "professional" ? "professional" : "customer";

    // Step 1: Sign up the user (server-side)
    const supabase = await createClient();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: validRole },
      },
    });

    if (signUpError) {
      const msg = signUpError.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in instead." },
          { status: 409 }
        );
      }
      if (msg.includes("rate limit") || msg.includes("too many")) {
        return NextResponse.json(
          { error: "Too many registration attempts. Please wait a few minutes and try again." },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 400 });
    }

    if (!signUpData.user) {
      return NextResponse.json(
        { error: "Registration failed. Please try again." },
        { status: 500 }
      );
    }

    // Step 2: Auto-confirm the user (admin client)
    try {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(signUpData.user.id, { email_confirm: true });
    } catch {
      // Best-effort — if admin key is missing, user may need email confirmation
    }

    // Step 3: Sign in the user to get a session (server-side)
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Account created but can't auto-login — tell user to log in manually
      return NextResponse.json({
        success: true,
        message: "Account created. Please log in.",
        needsLogin: true,
      });
    }

    // Step 4: Return session tokens for the client to use
    return NextResponse.json({
      success: true,
      session: {
        access_token: sessionData.session?.access_token,
        refresh_token: sessionData.session?.refresh_token,
        expires_at: sessionData.session?.expires_at,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
