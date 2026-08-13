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

    // Use the regular client to sign up (creates the user)
    const supabase = await createClient();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: role || "customer" },
      },
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    if (!signUpData.user) {
      return NextResponse.json(
        { error: "Registration failed. Please try again." },
        { status: 500 }
      );
    }

    // Auto-confirm the user using the admin client so they can log in immediately
    try {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(signUpData.user.id, {
        email_confirm: true,
      });
    } catch {
      // Admin confirmation is best-effort. If it fails, the user may need to
      // confirm via email, but registration itself succeeded.
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully. You can now log in.",
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
