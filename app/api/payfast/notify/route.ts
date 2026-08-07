import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySignature } from "@/lib/payfast";

function reconstructUUID(stripped: string): string {
  if (stripped.length === 32 && /^[0-9a-f]{32}$/i.test(stripped)) {
    return `${stripped.slice(0, 8)}-${stripped.slice(8, 12)}-${stripped.slice(12, 16)}-${stripped.slice(16, 20)}-${stripped.slice(20)}`;
  }
  return stripped;
}

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
  const rawPaymentId = body.m_payment_id;
  const payfastToken = body.token ?? null;
  const payfastSubscriptionId = body.subscription_id ?? null;

  if (!rawPaymentId) {
    return new NextResponse("Missing payment ID", { status: 400 });
  }

  const subscriptionId = reconstructUUID(rawPaymentId);
  const supabase = await createClient();

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const nextBilling = new Date(periodEnd);

  switch (paymentStatus) {
    case "COMPLETE":
    case "SUCCESS": {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          payfast_token: payfastToken,
          payfast_subscription_id: payfastSubscriptionId,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          next_billing_date: nextBilling.toISOString().split("T")[0],
          cancel_at_period_end: false,
        })
        .eq("id", subscriptionId);

      if (error) {
        console.error("[PayFast ITN] Failed to activate:", error.message);
        return new NextResponse("DB Error", { status: 500 });
      }

      console.log(`[PayFast ITN] Subscription ${subscriptionId} activated`);
      break;
    }

    case "FAILED": {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("id", subscriptionId);

      if (error) {
        console.error("[PayFast ITN] Failed to update status:", error.message);
        return new NextResponse("DB Error", { status: 500 });
      }

      console.log(`[PayFast ITN] Subscription ${subscriptionId} payment failed`);
      break;
    }

    case "CANCELLED": {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: now.toISOString(),
          cancel_at_period_end: false,
        })
        .eq("id", subscriptionId);

      if (error) {
        console.error("[PayFast ITN] Failed to cancel:", error.message);
        return new NextResponse("DB Error", { status: 500 });
      }

      console.log(`[PayFast ITN] Subscription ${subscriptionId} cancelled`);
      break;
    }

    case "SUSPENDED": {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("id", subscriptionId);

      if (error) {
        console.error("[PayFast ITN] Failed to suspend:", error.message);
        return new NextResponse("DB Error", { status: 500 });
      }

      console.log(`[PayFast ITN] Subscription ${subscriptionId} suspended`);
      break;
    }

    default:
      console.log(`[PayFast ITN] Unhandled status: ${paymentStatus} for ${subscriptionId}`);
  }

  return new NextResponse("OK", { status: 200 });
}
