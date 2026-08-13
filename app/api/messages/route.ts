import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { conversation_id, message } = await req.json();

  if (!conversation_id || !message?.trim()) {
    return NextResponse.json(
      { error: "conversation_id and message are required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("messages")
    .insert({
      conversation_id,
      sender_id: user.id,
      message: message.trim(),
    });

  if (error) {
    console.error("[Messages] Insert error:", error.message);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
