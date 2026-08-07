import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, plan, plan_name, amount, currency, status, payfast_subscription_id, current_period_start, current_period_end, next_billing_date, cancel_at_period_end, cancelled_at, created_at")
    .or(`user_id.eq.${user.id},professional_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!subscription) {
    return NextResponse.json({
      subscribed: false,
      plan: "free",
      status: null,
    });
  }

  return NextResponse.json({
    subscribed: subscription.status === "active",
    subscription,
  });
}
