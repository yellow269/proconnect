import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildCheckoutParams, generateSignature, getPayFastUrl } from "@/lib/payfast";
import { PLANS } from "@/lib/plans";
import type { SubscriptionPlan } from "@/types/database";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await req.json();

  if (!plan || !PLANS[plan as Exclude<SubscriptionPlan, "free">]) {
    return NextResponse.json({ error: "Invalid plan. Choose 'pro' or 'business'." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "professional") {
    return NextResponse.json({ error: "Only professionals can subscribe" }, { status: 403 });
  }

  const { data: profProfile } = await supabase
    .from("professional_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (!profProfile) {
    return NextResponse.json({ error: "Please complete your professional profile first at /dashboard/profile" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, plan, status")
    .eq("professional_id", user.id)
    .single();

  if (existing && existing.plan === plan && existing.status === "active") {
    return NextResponse.json({ error: "You are already on this plan" }, { status: 400 });
  }

  const subscriptionId = existing?.id ?? crypto.randomUUID();

  if (!existing) {
    const { error: insertError } = await supabase
      .from("subscriptions")
      .insert({
        id: subscriptionId,
        professional_id: user.id,
        plan: plan as Exclude<SubscriptionPlan, "free">,
        status: "inactive",
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  } else {
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({ plan: plan as Exclude<SubscriptionPlan, "free">, status: "inactive" })
      .eq("id", subscriptionId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "User";
  const lastName = user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ?? "";

  const data = buildCheckoutParams(subscriptionId, plan as Exclude<SubscriptionPlan, "free">, user.email ?? "", firstName, lastName);
  const signature = generateSignature(data);

  return NextResponse.json({
    url: getPayFastUrl(),
    data: { ...data, signature },
  });
}
