import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfessionalReviews } from "@/components/reviews/ProfessionalReviews";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Reviews | ProConnect",
};

export default async function ReviewsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  // Professional: show reviews received from customers
  if (role === "professional") {
    const { data: reviews } = await supabase
      .from("reviews")
      .select(
        `
        id, rating, comment, response, created_at, customer_id,
        profiles!customer_id(full_name, avatar_url)
      `
      )
      .eq("professional_id", user.id)
      .order("created_at", { ascending: false });

    const reviewList = (reviews ?? []) as unknown as {
      id: string;
      rating: number;
      comment: string | null;
      response: string | null;
      created_at: string;
      customer_id: string;
      profiles: { full_name: string; avatar_url: string | null } | null;
    }[];

    // Calculate rating stats
    const averageRating =
      reviewList.length > 0
        ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length
        : 0;
    const reviewCount = reviewList.length;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviewList) {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    }

    return (
      <main className="mx-auto max-w-4xl p-8">
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="mt-2 text-slate-500">Reviews from your customers</p>

        <div className="mt-8">
          <ProfessionalReviews
            reviews={reviewList}
            averageRating={averageRating}
            reviewCount={reviewCount}
            distribution={distribution}
          />
        </div>
      </main>
    );
  }

  // Customer: show reviews they have written
  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      `
      id, rating, comment, response, created_at, professional_id,
      professional_profiles!reviews_professional_id_fkey(
        user_id,
        profiles:user_id(full_name, avatar_url)
      )
    `
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const reviewList = (reviews ?? []) as unknown as {
    id: string;
    rating: number;
    comment: string | null;
    response: string | null;
    created_at: string;
    professional_id: string;
    professional_profiles: {
      user_id: string;
      profiles: { full_name: string; avatar_url: string | null } | null;
    } | null;
  }[];

  // Get completed jobs without reviews to show "Leave a Review" prompt
  const { data: reviewedJobIds } = await supabase
    .from("reviews")
    .select("job_id")
    .eq("customer_id", user.id);

  const reviewedIds = (reviewedJobIds ?? []).map((r: { job_id: string }) => r.job_id);

  let unreviewed: { id: string; title: string }[] = [];
  if (reviewedIds.length > 0) {
    const { data } = await supabase
      .from("jobs")
      .select("id, title")
      .eq("customer_id", user.id)
      .eq("status", "completed")
      .not("id", "in", `(${reviewedIds.join(",")})`);
    unreviewed = (data ?? []) as { id: string; title: string }[];
  } else {
    const { data } = await supabase
      .from("jobs")
      .select("id, title")
      .eq("customer_id", user.id)
      .eq("status", "completed");
    unreviewed = (data ?? []) as { id: string; title: string }[];
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Reviews</h1>
          <p className="mt-2 text-slate-500">Reviews you have submitted</p>
        </div>
        <Link
          href="/dashboard/reviews/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Leave a Review
        </Link>
      </div>

      {/* Pending reviews prompt */}
      {unreviewed.length > 0 && (
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-800">
            You have {unreviewed.length} completed {unreviewed.length === 1 ? "job" : "jobs"} waiting for a review
          </p>
          <div className="mt-2 space-y-1">
            {unreviewed.map((job) => (
              <Link
                key={job.id}
                href="/dashboard/reviews/new"
                className="block text-sm text-blue-600 hover:text-blue-800"
              >
                &bull; {job.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {reviewList.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-slate-400">
            You haven&apos;t written any reviews yet.
          </div>
        ) : (
          reviewList.map((review) => {
            const proName =
              (review.professional_profiles?.profiles as { full_name: string } | null)
                ?.full_name ?? "Professional";
            return (
              <ReviewCard
                key={review.id}
                reviewId={review.id}
                rating={review.rating}
                comment={review.comment}
                response={review.response}
                createdAt={review.created_at}
                professionalName={proName}
                showRole="customer"
              />
            );
          })
        )}
      </div>
    </main>
  );
}
