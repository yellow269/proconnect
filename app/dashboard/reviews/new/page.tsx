"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "@/components/reviews/StarRating";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

interface CompletedJob {
  id: string;
  title: string;
  assigned_professional_id: string;
  professional_profiles: {
    user_id: string;
    profiles: { full_name: string } | null;
  } | null;
}

export default function NewReviewPage() {
  const router = useRouter();
  const supabase = createClient();

  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompletedJobs() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Get reviewed job IDs
      const { data: reviewedData } = await supabase
        .from("reviews")
        .select("job_id")
        .eq("customer_id", user.id);

      const reviewedIds = (reviewedData ?? []).map((r: { job_id: string }) => r.job_id);

      // Get completed jobs, excluding already reviewed ones
      let query = supabase
        .from("jobs")
        .select(
          `
          id,
          title,
          assigned_professional_id,
          professional_profiles!jobs_assigned_professional_id_fkey(
            user_id,
            profiles:user_id(full_name)
          )
        `
        )
        .eq("customer_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (reviewedIds.length > 0) {
        query = query.not("id", "in", `(${reviewedIds.join(",")})`);
      }

      const { data: completedJobs, error: jobsError } = await query;

      if (jobsError) {
        setError("Failed to load your completed jobs.");
      } else {
        setJobs((completedJobs as CompletedJob[]) ?? []);
      }
      setLoading(false);
    }

    fetchCompletedJobs();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId || rating === 0) return;

    setSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const job = jobs.find((j) => j.id === selectedJobId);
    if (!job) {
      setError("Please select a job.");
      setSubmitting(false);
      return;
    }

    const professionalId = job.assigned_professional_id;

    const { error: insertError } = await supabase.from("reviews").insert({
      job_id: selectedJobId,
      customer_id: user.id,
      professional_id: professionalId,
      rating,
      comment: comment.trim() || null,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        setError("You have already reviewed this job.");
      } else {
        setError("Failed to submit review. Please try again.");
      }
      setSubmitting(false);
      return;
    }

    router.push("/dashboard/reviews");
    router.refresh();
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <div className="text-center text-slate-500">Loading...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link
        href="/dashboard/reviews"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Reviews
      </Link>

      <h1 className="mt-4 text-3xl font-bold">Leave a Review</h1>
      <p className="mt-2 text-slate-500">
        Share your experience with a professional you&apos;ve worked with.
      </p>

      {jobs.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed p-8 text-center text-slate-400">
          No completed jobs to review yet.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Select a completed job
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">Choose a job...</option>
              {jobs.map((job) => {
                const proName =
                  (job.professional_profiles?.profiles as { full_name: string } | null)
                    ?.full_name ?? "Professional";
                return (
                  <option key={job.id} value={job.id}>
                    {job.title} — {proName}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Rating</label>
            <div className="mt-2">
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>
            {rating === 0 && (
              <p className="mt-1 text-xs text-slate-400">Select 1 to 5 stars</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Comment <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={2000}
              className="mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="How was your experience? What did the professional do well?"
            />
            <p className="mt-1 text-xs text-slate-400">{comment.length}/2000</p>
          </div>

          <button
            type="submit"
            disabled={!selectedJobId || rating === 0 || submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}
    </main>
  );
}
