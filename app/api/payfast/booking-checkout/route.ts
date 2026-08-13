import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildBookingCheckoutParams,
  generateOneTimeSignature,
  getPayFastUrl,
} from "@/lib/payfast-one-time";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json(
        { error: "booking_id is required" },
        { status: 400 }
      );
    }

    // Verify booking belongs to user and is unpaid
    const { data: booking } = await supabase
      .from("service_bookings")
      .select("id, total_amount, payment_status, services(title), customer_id")
      .eq("id", booking_id)
      .eq("customer_id", user.id)
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.payment_status !== "unpaid") {
      return NextResponse.json(
        { error: "Booking is already paid" },
        { status: 400 }
      );
    }

    const services = booking.services as { title: string } | null;
    const serviceName = services?.title ?? "Service Booking";

    const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] ?? "User";
    const lastName = nameParts.slice(1).join(" ") || "";

    const data = buildBookingCheckoutParams(
      booking.id,
      Number(booking.total_amount),
      serviceName,
      user.email ?? "",
      firstName,
      lastName
    );

    const signature = generateOneTimeSignature(data);

    return NextResponse.json({
      url: getPayFastUrl(),
      data: { ...data, signature },
    });
  } catch (error) {
    console.error("[PayFast Booking] Checkout error:", error);
    return NextResponse.json(
      { error: "Unable to create checkout" },
      { status: 500 }
    );
  }
}
