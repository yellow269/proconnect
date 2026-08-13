import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySignature } from "@/lib/payfast";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const body: Record<string, string> = {};
    formData.forEach((value, key) => {
      body[key] = value.toString();
    });

    // Verify signature
    if (!verifySignature(body)) {
      console.error("[PayFast Booking ITN] Invalid signature");
      return new NextResponse("INVALID", { status: 400 });
    }

    const paymentStatus = body.payment_status;
    const paymentId = body.m_payment_id;

    if (!paymentId) {
      return new NextResponse("OK", { status: 200 });
    }

    const supabase = createAdminClient();

    // Find booking by payment ID (UUID without dashes)
    const { data: booking } = await supabase
      .from("service_bookings")
      .select("id, professional_id, customer_id")
      .eq("id", paymentId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5"))
      .single();

    if (!booking) {
      console.error("[PayFast Booking ITN] Booking not found for payment:", paymentId);
      return new NextResponse("OK", { status: 200 });
    }

    if (paymentStatus === "COMPLETE") {
      // Update payment status
      await supabase
        .from("service_bookings")
        .update({ payment_status: "paid", status: "confirmed" })
        .eq("id", booking.id);

      // Notify professional
      await supabase.from("notifications").insert({
        user_id: booking.professional_id,
        type: "job",
        title: "Payment Received",
        body: "A customer has paid for their booking. It is now confirmed.",
        link: `/professional/bookings`,
      });
    } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
      await supabase
        .from("service_bookings")
        .update({ payment_status: "unpaid" })
        .eq("id", booking.id);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[PayFast Booking ITN] Error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}
