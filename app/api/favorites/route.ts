import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { professional_id } = body;

  if (!professional_id) {
    return NextResponse.json(
      { error: "professional_id is required" },
      { status: 400 }
    );
  }

  // Verify the professional exists
  const { data: pro } = await supabase
    .from("professional_profiles")
    .select("user_id")
    .eq("user_id", professional_id)
    .single();

  if (!pro) {
    return NextResponse.json({ error: "Professional not found" }, { status: 404 });
  }

  // Prevent self-favoriting
  if (professional_id === user.id) {
    return NextResponse.json({ error: "Cannot favorite yourself" }, { status: 400 });
  }

  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorites")
    .select("customer_id")
    .eq("customer_id", user.id)
    .eq("professional_id", professional_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ favorited: true });
  }

  // Insert favorite
  const { error } = await supabase.from("favorites").insert({
    customer_id: user.id,
    professional_id,
  });

  if (error) {
    console.error("[Favorites] Insert error:", error.message);
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }

  return NextResponse.json({ favorited: true });
}
