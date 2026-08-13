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
  const { professional_id, job_id } = body;

  if (!professional_id) {
    return NextResponse.json(
      { error: "professional_id is required" },
      { status: 400 }
    );
  }

  // Check if a conversation already exists between these two users
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("customer_id", user.id)
    .eq("professional_id", professional_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ conversationId: existing.id });
  }

  // Check if professional is messaging customer (reverse direction)
  const { data: existingReverse } = await supabase
    .from("conversations")
    .select("id")
    .eq("customer_id", professional_id)
    .eq("professional_id", user.id)
    .maybeSingle();

  if (existingReverse) {
    return NextResponse.json({ conversationId: existingReverse.id });
  }

  // Determine customer_id and professional_id based on who is who
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  let customerId: string;
  let proId: string;

  if (myProfile?.role === "customer") {
    customerId = user.id;
    proId = professional_id;
  } else {
    customerId = professional_id;
    proId = user.id;
  }

  // Create new conversation
  const { data: conversation, error: createError } = await supabase
    .from("conversations")
    .insert({
      customer_id: customerId,
      professional_id: proId,
      job_id: job_id || null,
    })
    .select("id")
    .single();

  if (createError) {
    console.error("[Conversations] Create error:", createError.message);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }

  return NextResponse.json({ conversationId: conversation.id });
}
