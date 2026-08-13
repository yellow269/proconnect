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

  // Verify user is a professional
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "professional") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { job_id, amount, message, estimated_days } = body;

  if (!job_id || !amount || !message) {
    return NextResponse.json(
      { error: "job_id, amount, and message are required" },
      { status: 400 }
    );
  }

  if (typeof amount !== "number" || amount < 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  if (typeof message !== "string" || message.length < 10 || message.length > 3000) {
    return NextResponse.json(
      { error: "Message must be between 10 and 3000 characters" },
      { status: 400 }
    );
  }

  // Verify the job exists and is open
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, status, customer_id")
    .eq("id", job_id)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "open" && job.status !== "quoted") {
    return NextResponse.json(
      { error: "This job is no longer accepting quotes" },
      { status: 400 }
    );
  }

  // Prevent quoting on own job
  if (job.customer_id === user.id) {
    return NextResponse.json(
      { error: "You cannot quote on your own job" },
      { status: 400 }
    );
  }

  // Check for existing quote from this professional
  const { data: existing } = await supabase
    .from("quotes")
    .select("id")
    .eq("job_id", job_id)
    .eq("professional_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "You have already submitted a quote for this job" },
      { status: 400 }
    );
  }

  // Insert the quote
  const { data: quote, error: insertError } = await supabase
    .from("quotes")
    .insert({
      job_id,
      professional_id: user.id,
      amount,
      message: message.trim(),
      estimated_days: estimated_days || null,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to submit quote" }, { status: 500 });
  }

  // Update job status to quoted if currently open
  if (job.status === "open") {
    await supabase
      .from("jobs")
      .update({ status: "quoted" })
      .eq("id", job_id)
      .eq("status", "open");
  }

  return NextResponse.json({ success: true, quoteId: quote.id });
}
