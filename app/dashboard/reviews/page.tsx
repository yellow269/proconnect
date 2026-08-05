import { createClient } from "@/lib/supabase/server";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export default async function ReviewsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p>Please log in.</p>
      </main>
    );
  }

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("professional_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="text-red-500">{error.message}</p>
      </main>
    );
  }

  const typedReviews = (reviews ?? []) as Review[];

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold">Reviews</h1>

      {typedReviews.length === 0 ? (
        <div className="mt-8 rounded-lg border bg-white p-8 text-center shadow">
          <h2 className="text-xl font-semibold">
            No reviews yet
          </h2>

          <p className="mt-2 text-slate-500">
            When customers review your work, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {typedReviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  ⭐ {review.rating}/5
                </h2>

                <span className="text-sm text-slate-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="mt-4 text-slate-600">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}