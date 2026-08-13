import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Star } from "lucide-react";

export default async function ReviewsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get reviews for this professional
  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      `
      id, rating, comment, response, created_at,
      customer_id,
      profiles!customer_id(full_name, avatar_url),
      services!inner(title)
    `
    )
    .eq("professional_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-3xl font-bold">Reviews</h1>

      <p className="mt-2 text-slate-500">
        Reviews from your customers
      </p>

      <div className="mt-8 space-y-4">
        {(!reviews || reviews.length === 0) ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-slate-400">
            No reviews yet.
          </div>
        ) : (
          reviews.map((review) => {
            const customer = review.profiles as { full_name: string; avatar_url: string | null } | null;
            return (
              <div
                key={review.id}
                className="rounded-lg border bg-white p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      by {customer?.full_name ?? "Anonymous"} on{" "}
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {review.comment && (
                  <p className="mt-3 text-gray-700">{review.comment}</p>
                )}

                {review.response && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-700">
                      Your response:
                    </p>
                    <p className="mt-1 text-gray-600">{review.response}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
