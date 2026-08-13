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

    // Step 1: Sign up the user
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
      return NextResponse.json(
        { error: "Registration failed. Please try again." },
        { status: 400 }
      );
    }

    if (!signUpData.user) {
      return NextResponse.json(
        { error: "Registration failed. Please try again." },
        { status: 500 }
      );
    }

    // Step 2: Auto-confirm the user using admin client
    let confirmed = false;
    try {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(signUpData.user.id, {
        email_confirm: true,
      });
      confirmed = true;
    } catch {
      // Admin client unavailable — email confirmation required
    }

    if (!confirmed) {
      // Could not auto-confirm. Try to sign in anyway in case
      // the Supabase project has auto-confirm enabled.
      const { data: sessionData } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (sessionData?.session) {
        return NextResponse.json({
          success: true,
          session: {
            access_token: sessionData.session.access_token,
            refresh_token: sessionData.session.refresh_token,
            expires_at: sessionData.session.expires_at,
          },
        });
      }

      return NextResponse.json(
        {
          error:
            "Account created but email confirmation is required. Please check your email for a confirmation link, or contact support.",
        },
        { status: 200 }
      );
    }

    // Step 3: Sign in to get a session
    const { data: sessionData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      return NextResponse.json(
        { error: "Account created. Please log in." },
        { status: 200 }
      );
    }

    // Step 4: Return session tokens
    // Step 5: Auto-create professional profile if role is professional
    if (validRole === "professional" && sessionData?.session) {
      const adminClient = createAdminClient();
      const slug = fullName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);

      await adminClient.from("professional_profiles").upsert(
        {
          user_id: signUpData.user.id,
          business_name: fullName,
          slug,
        },
        { onConflict: "user_id" }
      );
    }

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
