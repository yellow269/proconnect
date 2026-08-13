import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * One-time migration endpoint: confirms all unconfirmed users.
 * Requires SUPABASE_SERVICE_ROLE_KEY.
 * Should be removed after running once.
 */
export async function POST(request: Request) {
  try {
    // Simple auth check — only allow from same origin
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const admin = createAdminClient();

    // Get all users (paginated)
    let confirmed = 0;
    let page = 1;
    const perPage = 50;
    let hasMore = true;

    while (hasMore) {
      const { data: users, error: listError } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (listError || !users?.users) {
        return NextResponse.json(
          { error: "Failed to list users" },
          { status: 500 }
        );
      }

      for (const user of users.users) {
        if (!user.email_confirmed_at) {
          const { error: confirmError } = await admin.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
          );
          if (!confirmError) {
            confirmed++;
          }
        }
      }

      hasMore = users.users.length === perPage;
      page++;
    }

    return NextResponse.json({
      success: true,
      confirmed,
      message: `Confirmed ${confirmed} unconfirmed user(s).`,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
