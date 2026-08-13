import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const {
      service_id,
      professional_id,
      booking_date,
      start_time,
      end_time,
      contact_name,
      contact_email,
      contact_phone,
      address,
      notes,
    } = body;

    // Validate required fields
    if (!service_id || !professional_id || !booking_date || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!contact_name || !contact_email || !contact_phone) {
      return NextResponse.json(
        { error: "Contact details are required" },
        { status: 400 }
      );
    }

    // Verify service exists and belongs to the professional
    const { data: service } = await supabase
      .from("services")
      .select("id, professional_id, title, price_from, fixed_price, pricing_type, duration_minutes, active")
      .eq("id", service_id)
      .eq("professional_id", professional_id)
      .eq("active", true)
      .single();

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Check for double-booking
    const { data: conflict } = await supabase.rpc("has_booking_conflict", {
      p_professional_id: professional_id,
      p_date: booking_date,
      p_start_time: start_time,
      p_end_time: end_time,
    });

    if (conflict) {
      return NextResponse.json(
        { error: "This time slot is no longer available. Please choose another time." },
        { status: 409 }
      );
    }

    // Calculate total amount
    const totalAmount =
      service.pricing_type === "fixed"
        ? service.fixed_price ?? 0
        : service.price_from ?? 0;

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from("service_bookings")
      .insert({
        service_id,
        professional_id,
        customer_id: user.id,
        booking_date,
        start_time,
        end_time,
        total_amount: totalAmount,
        notes: notes || null,
        address: address || null,
        city: null,
      })
      .select("id")
      .single();

    if (bookingError) {
      console.error("[Bookings] Create error:", bookingError.message);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    // Create notification for the professional
    await supabase.from("notifications").insert({
      user_id: professional_id,
      type: "job",
      title: "New Booking Request",
      body: `You have a new booking request from ${contact_name} for ${service.title} on ${booking_date}.`,
      link: `/professional/bookings`,
    });

    return NextResponse.json({
      booking_id: booking.id,
      message: "Booking created successfully",
    });
  } catch (error) {
    console.error("[Bookings] Error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
