import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: subscription, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, status, payfast_token, payfast_subscription_id")
    .or(`user_id.eq.${user.id},professional_id.eq.${user.id}`)
    .single();

  if (fetchError || !subscription) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  if (subscription.status !== "active") {
    return NextResponse.json({ error: "Subscription is not active" }, { status: 400 });
  }

  const now = new Date();

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      cancelled_at: now.toISOString(),
      status: "cancelled",
    })
    .eq("id", subscription.id);

  if (updateError) {
    console.error("[Cancel] Failed to cancel subscription:", updateError.message);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }

  console.log(`[Cancel] Subscription ${subscription.id} cancelled by user ${user.id}`);

  return NextResponse.json({ success: true });
}
