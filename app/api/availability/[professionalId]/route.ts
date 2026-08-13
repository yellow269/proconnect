import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ professionalId: string }> }
) {
  try {
    const { professionalId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const duration = searchParams.get("duration");

    if (!date || !duration) {
      return NextResponse.json(
        { error: "date and duration are required" },
        { status: 400 }
      );
    }

    const durationMinutes = parseInt(duration, 10);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      return NextResponse.json(
        { error: "Invalid duration" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check professional exists and is available
    const { data: pro } = await supabase
      .from("professional_profiles")
      .select("user_id, available")
      .eq("user_id", professionalId)
      .eq("available", true)
      .single();

    if (!pro) {
      return NextResponse.json(
        { error: "Professional not found" },
        { status: 404 }
      );
    }

    // Get availability for this day
    const targetDate = new Date(date + "T00:00:00");
    const weekday = targetDate.getDay();

    const { data: availability } = await supabase
      .from("availability")
      .select("start_time, end_time")
      .eq("professional_id", professionalId)
      .eq("weekday", weekday);

    if (!availability || availability.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    // Generate time slots
    const slots: { slot_start: string; slot_end: string }[] = [];

    for (const avail of availability) {
      const [startH, startM] = avail.start_time.split(":").map(Number);
      const [endH, endM] = avail.end_time.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      for (let m = startMinutes; m + durationMinutes <= endMinutes; m += durationMinutes) {
        const slotStart = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
        const slotEnd = `${String(Math.floor((m + durationMinutes) / 60)).padStart(2, "0")}:${String((m + durationMinutes) % 60).padStart(2, "0")}`;
        slots.push({ slot_start: slotStart, slot_end: slotEnd });
      }
    }

    // Check for existing bookings (exclude cancelled)
    const { data: existingBookings } = await supabase
      .from("service_bookings")
      .select("start_time, end_time")
      .eq("professional_id", professionalId)
      .eq("booking_date", date)
      .not("status", "eq", "cancelled");

    const booked = existingBookings ?? [];

    // Filter out conflicting slots
    const availableSlots = slots.filter((slot) => {
      return !booked.some((b) => {
        const bStart = b.start_time.substring(0, 5);
        const bEnd = b.end_time.substring(0, 5);
        return slot.slot_start < bEnd && slot.slot_end > bStart;
      });
    });

    return NextResponse.json({ slots: availableSlots });
  } catch (error) {
    console.error("[Availability] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
