import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildCheckoutParams, generateSignature, getPayFastUrl } from "@/lib/payfast";
import { getPayfastConfig } from "@/lib/env";
import { PLANS } from "@/lib/plans";
import type { SubscriptionPlan } from "@/types/database";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await req.json();

  if (!plan || !PLANS[plan as Exclude<SubscriptionPlan, "free">]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const planKey = plan as Exclude<SubscriptionPlan, "free">;

  // Check for existing active subscription
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, plan, status")
    .or(`user_id.eq.${user.id},professional_id.eq.${user.id}`)
    .in("status", ["active", "inactive", "trialing"])
    .single();

  if (existing && existing.status === "active") {
    return NextResponse.json({ error: "You already have an active subscription" }, { status: 400 });
  }

  const subscriptionId = existing?.id ?? crypto.randomUUID();
  const planConfig = PLANS[planKey];

  if (!existing) {
    const { error: insertError } = await supabase.from("subscriptions").insert({
      id: subscriptionId,
      user_id: user.id,
      professional_id: user.id,
      plan: planKey,
      plan_name: planConfig.name,
      amount: parseFloat(planConfig.amount),
      currency: "ZAR",
      status: "inactive",
    });

    if (insertError) {
      console.error("[Checkout] Insert error:", insertError.message);
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }
  } else if (existing.plan !== planKey || existing.status !== "inactive") {
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        plan: planKey,
        plan_name: planConfig.name,
        amount: parseFloat(planConfig.amount),
        currency: "ZAR",
        status: "inactive",
      })
      .eq("id", subscriptionId);

    if (updateError) {
      console.error("[Checkout] Update error:", updateError.message);
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
    }
  }

  const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "User";
  const lastName = user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ?? "";

  const data = buildCheckoutParams(subscriptionId, planKey, user.email ?? "", firstName, lastName);
  const signature = generateSignature(data, true);

  // Comprehensive debug logging
  const config = getPayfastConfig();
  console.log("");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║          PAYFAST CHECKOUT - FULL DEBUG          ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");

  // 1. Environment config
  console.log("--- ENVIRONMENT CONFIG ---");
  console.log("PAYFAST_MERCHANT_ID:", JSON.stringify(config.merchantId));
  console.log("PAYFAST_MERCHANT_KEY:", JSON.stringify(config.merchantKey));
  console.log("PAYFAST_PASSPHRASE:", JSON.stringify(config.passphrase));
  console.log("PASSPHRASE LENGTH:", config.passphrase.length);
  console.log("PASSPHRASE HEX:", Buffer.from(config.passphrase).toString("hex"));
  console.log("PAYFAST_RETURN_URL:", config.returnUrl);
  console.log("PAYFAST_CANCEL_URL:", config.cancelUrl);
  console.log("PAYFAST_NOTIFY_URL:", config.notifyUrl);
  console.log("");

  // 2. Form data fields
  console.log("--- FORM DATA (exact POST to PayFast) ---");
  for (const [key, value] of Object.entries(data)) {
    console.log(`  ${key} = ${JSON.stringify(value)}`);
  }
  console.log("");
  console.log("  signature = " + JSON.stringify(signature));
  console.log("");

  // 3. Signature string reconstruction
  console.log("--- SIGNATURE STRING RECONSTRUCTION ---");
  const config2 = getPayfastConfig();
  const attrMap: Record<string, string> = {};
  for (const key of Object.keys(data)) {
    attrMap[key] = data[key];
  }
  if (config2.passphrase && config2.passphrase !== "") {
    attrMap["passphrase"] = config2.passphrase;
  }

  const CHECKOUT_FIELD_ORDER = [
    "merchant_id","merchant_key","return_url","cancel_url","notify_url","notify_method",
    "name_first","name_last","email_address","cell_number","m_payment_id","amount",
    "item_name","item_description","custom_int1","custom_int2","custom_int3","custom_int4",
    "custom_int5","custom_str1","custom_str2","custom_str3","custom_str4","custom_str5",
    "email_confirmation","confirmation_address","currency","payment_method",
    "subscription_type","passphrase","billing_date","recurring_amount","frequency","cycles",
    "subscription_notify_email","subscription_notify_webhook","subscription_notify_buyer",
  ];

  console.log("Field order used for signature:");
  const parts: string[] = [];
  for (const key of CHECKOUT_FIELD_ORDER) {
    const val = attrMap[key];
    if (val !== "" && val !== undefined && val !== null) {
      const encoded = encodeURIComponent(val.trim()).replace(/%20/g, "+").replace(/~/g, "%7E").replace(/!/g, "%21").replace(/\*/g, "%2A").replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29");
      parts.push(`${key}=${encoded}`);
      console.log(`  ✓ ${key} = ${JSON.stringify(val)}  →  ${key}=${encoded}`);
    }
  }
  const fullString = parts.join("&");
  console.log("");
  console.log("FULL STRING (MD5 input):");
  console.log(fullString);
  console.log("");
  console.log("GENERATED MD5:", crypto.createHash("md5").update(fullString).digest("hex"));
  console.log("SUBMITTED SIG:", signature);
  console.log("MATCH:", crypto.createHash("md5").update(fullString).digest("hex") === signature);
  console.log("");

  // 4. Final form
  const formFields = { ...data, signature };
  console.log("--- FINAL FORM FIELDS (POST body) ---");
  console.log(JSON.stringify(formFields, null, 2));
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");

  return NextResponse.json({
    url: getPayFastUrl(),
    data: formFields,
  });
}
