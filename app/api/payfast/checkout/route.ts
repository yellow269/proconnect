import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  buildCheckoutParams,
  generateSignature,
  getPayFastUrl,
} from "@/lib/payfast";

import { PLANS } from "@/lib/plans";
import type { SubscriptionPlan } from "@/types/database";

export async function POST(req: Request) {
  try {
    // ==================================================
    // 1. Get authenticated user
    // ==================================================

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ==================================================
    // 2. Read plan
    // ==================================================

    const body = await req.json();
    const plan = body?.plan;

    if (
      !plan ||
      !PLANS[plan as Exclude<SubscriptionPlan, "free">]
    ) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    const planKey =
      plan as Exclude<SubscriptionPlan, "free">;

    const planConfig = PLANS[planKey];

    // ==================================================
    // 3. Check for active subscription
    // ==================================================

    const { data: activeSub, error: activeError } = await supabase
      .from("subscriptions")
      .select("id")
      .or(`user_id.eq.${user.id},professional_id.eq.${user.id}`)
      .eq("status", "active")
      .maybeSingle();

    if (activeError) {
      console.error("[PayFast] Active subscription check error:", activeError.message);
      return NextResponse.json(
        { error: "Unable to check subscription" },
        { status: 500 }
      );
    }

    if (activeSub) {
      return NextResponse.json(
        { error: "You already have an active subscription" },
        { status: 400 }
      );
    }

    // ==================================================
    // 4. Create or update subscription (upsert)
    // ==================================================

    const { data: upserted, error: upsertError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          professional_id: user.id,
          plan: planKey,
          plan_name: planConfig.name,
          amount: Number(planConfig.amount),
          currency: "ZAR",
          status: "inactive",
        },
        { onConflict: "professional_id" }
      )
      .select("id")
      .single();

    if (upsertError || !upserted) {
      console.error("[PayFast] Upsert error:", upsertError?.message);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 }
      );
    }

    const subscriptionId = upserted.id;

    // ==================================================
    // 5. Customer information
    // ==================================================

    const fullName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      "";

    const nameParts = fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const firstName =
      nameParts[0] ?? "User";

    const lastName =
      nameParts.slice(1).join(" ") || "";

    const email = user.email ?? "";

    // ==================================================
    // 6. Build PayFast data
    // ==================================================

    const data = buildCheckoutParams(
      subscriptionId,
      planKey,
      email,
      firstName,
      lastName
    );

    // ==================================================
    // 7. Generate PayFast signature
    // ==================================================

    const signature =
      generateSignature(data);

    // ==================================================
    // 8. Return PayFast checkout data
    // ==================================================

    return NextResponse.json({
      url: getPayFastUrl(),
      data: {
        ...data,
        signature,
      },
    });
  } catch (error) {
    console.error(
      "[PayFast] Checkout error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create PayFast checkout",
      },
      { status: 500 }
    );
  }
}