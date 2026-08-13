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

  const { id: quoteId } = await params;
  const body = await request.json();
  const { action } = body;

  if (action !== "accept" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Get the quote and verify the customer owns the job
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, job_id, professional_id, status, jobs!inner(customer_id, status)")
    .eq("id", quoteId)
    .single();

  if (quoteError || !quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const job = quote.jobs as { customer_id: string; status: string } | null;
  if (!job || job.customer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (quote.status !== "pending") {
    return NextResponse.json(
      { error: "Quote is no longer pending" },
      { status: 400 }
    );
  }

  if (action === "accept") {
    // Accept the quote
    const { error: updateError } = await supabase
      .from("quotes")
      .update({ status: "accepted" })
      .eq("id", quoteId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to accept quote" }, { status: 500 });
    }

    // Reject all other pending quotes for this job
    await supabase
      .from("quotes")
      .update({ status: "rejected" })
      .eq("job_id", quote.job_id)
      .eq("status", "pending")
      .neq("id", quoteId);

    // Update job status to assigned
    await supabase
      .from("jobs")
      .update({ status: "assigned", assigned_professional_id: quote.professional_id })
      .eq("id", quote.job_id)
      .eq("status", "open");

    return NextResponse.json({ success: true, action: "accepted" });
  } else {
    // Reject the quote
    const { error: updateError } = await supabase
      .from("quotes")
      .update({ status: "rejected" })
      .eq("id", quoteId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to reject quote" }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: "rejected" });
  }
}
