import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import {
  buildCheckoutParams,
  generateSignature,
  getPayFastUrl,
} from "@/lib/payfast";

import { getPayfastConfig } from "@/lib/env";
import { PLANS } from "@/lib/plans";
import type { SubscriptionPlan } from "@/types/database";

export async function POST(req: Request) {
  try {
    // ==================================================
    // 1. Supabase
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
    // 3. Check existing subscription
    // ==================================================

    const {
      data: existing,
      error: existingError,
    } = await supabase
      .from("subscriptions")
      .select("id, plan, status")
      .or(
        `user_id.eq.${user.id},professional_id.eq.${user.id}`
      )
      .in("status", [
        "active",
        "inactive",
        "trialing",
      ])
      .maybeSingle();

    if (existingError) {
      console.error(
        "[PayFast] Existing subscription error:",
        existingError.message
      );

      return NextResponse.json(
        {
          error: "Unable to check subscription",
        },
        { status: 500 }
      );
    }

    if (existing?.status === "active") {
      return NextResponse.json(
        {
          error:
            "You already have an active subscription",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // 4. Create/update subscription
    // ==================================================

    const subscriptionId =
      existing?.id ?? crypto.randomUUID();

    if (!existing) {
      const { error: insertError } =
        await supabase
          .from("subscriptions")
          .insert({
            id: subscriptionId,

            user_id: user.id,
            professional_id: user.id,

            plan: planKey,
            plan_name: planConfig.name,

            amount: Number(planConfig.amount),
            currency: "ZAR",

            status: "inactive",
          });

      if (insertError) {
        console.error(
          "[PayFast] Insert error:",
          insertError.message
        );

        return NextResponse.json(
          {
            error:
              "Failed to create subscription",
          },
          { status: 500 }
        );
      }
    } else {
      const { error: updateError } =
        await supabase
          .from("subscriptions")
          .update({
            plan: planKey,
            plan_name: planConfig.name,

            amount: Number(planConfig.amount),
            currency: "ZAR",

            status: "inactive",
          })
          .eq("id", subscriptionId);

      if (updateError) {
        console.error(
          "[PayFast] Update error:",
          updateError.message
        );

        return NextResponse.json(
          {
            error:
              "Failed to update subscription",
          },
          { status: 500 }
        );
      }
    }

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

    const email =
      user.email ?? "";

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
    // 7. Generate signature
    // ==================================================

    const signature =
      generateSignature(data, true);

    // ==================================================
    // 8. Debug
    // ==================================================

    const config = getPayfastConfig();

    console.log(
      "========== PAYFAST CHECKOUT =========="
    );

    console.log(
      "PayFast URL:",
      getPayFastUrl()
    );

    console.log(
      "Merchant ID:",
      config.merchantId
    );

    console.log(
      "Merchant Key present:",
      Boolean(config.merchantKey)
    );

    console.log(
      "Passphrase present:",
      Boolean(config.passphrase)
    );

    console.log(
      "Passphrase length:",
      config.passphrase?.length ?? 0
    );

    console.log(
      "Amount:",
      data.amount
    );

    console.log(
      "Payment ID:",
      data.m_payment_id
    );

    console.log(
      "Signature:",
      signature
    );

    console.log(
      "PAYFAST DATA:",
      data
    );

    console.log(
      "======================================"
    );

    // ==================================================
    // 9. Return checkout data
    // ==================================================

    const signature = generateSignature(data, true);

console.log("========== FINAL PAYFAST PAYLOAD ==========");
console.log(
  JSON.stringify(
    {
      ...data,
      signature,
    },
    null,
    2
  )
);
console.log("===========================================");

return NextResponse.json({
  url: getPayFastUrl(),
  data: {
    ...data,
    signature,
  },
});