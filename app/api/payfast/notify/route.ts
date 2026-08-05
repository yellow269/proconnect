import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySignature } from "@/lib/payfast";

export async function POST(req: Request) {
  const formData = await req.formData();
  const body: Record<string, string> = {};
  formData.forEach((value, key) => {
    body[key] = value.toString();
  });

  if (!verifySignature(body)) {
    console.error("[PayFast ITN] Invalid signature");
    return new NextResponse("Invalid Signature", { status: 400 });
  }

  const paymentStatus = body.payment_status;
  const subscriptionId = body.m_payment_id;
  const payfastToken = body.token ?? null;
  const payfastSubscriptionId = body.subscription_id ?? null;

  if (!subscriptionId) {
    return new NextResponse("Missing payment ID", { status: 400 });
  }

  const supabase = await createClient();

  if (paymentStatus === "COMPLETE" || paymentStatus === "SUCCESS") {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: "active",
        payfast_token: payfastToken,
        payfast_subscription_id: payfastSubscriptionId,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
      })
      .eq("id", subscriptionId);

    if (error) {
      console.error("[PayFast ITN] Failed to update subscription:", error.message);
      return new NextResponse("DB Error", { status: 500 });
    }

    console.log(`[PayFast ITN] Subscription ${subscriptionId} activated`);
  } else if (paymentStatus === "FAILED") {
    await supabase
      .from("subscriptions")
      .update({ status: "past_due" })
      .eq("id", subscriptionId);

    console.log(`[PayFast ITN] Subscription ${subscriptionId} payment failed`);
  }

  return new NextResponse("OK", { status: 200 });
}
