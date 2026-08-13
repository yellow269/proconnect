import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is a professional
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "professional") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: quoteId } = await params;

  // Get the quote and verify the professional owns it
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, professional_id, status")
    .eq("id", quoteId)
    .single();

  if (quoteError || !quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (quote.professional_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (quote.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending quotes can be withdrawn" },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("quotes")
    .update({ status: "withdrawn" })
    .eq("id", quoteId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to withdraw quote" }, { status: 500 });
  }

  return NextResponse.json({ success: true, action: "withdrawn" });
}
