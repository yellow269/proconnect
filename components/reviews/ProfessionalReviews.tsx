"use client";

import { useState } from "react";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ResponseForm } from "@/components/reviews/ResponseForm";
import { RatingStats } from "@/components/reviews/RatingStats";
import { createClient } from "@/lib/supabase/client";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  response: string | null;
  created_at: string;
  customer_id: string;
  profiles: { full_name: string; avatar_url: string | null } | null;
}

interface ProfessionalReviewsProps {
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
  distribution: Record<number, number>;
}

export function ProfessionalReviews({ reviews, averageRating, reviewCount, distribution }: ProfessionalReviewsProps) {
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [localReviews, setLocalReviews] = useState(reviews);
  const supabase = createClient();

  const handleRespond = async (reviewId: string, response: string) => {
    const { error } = await supabase
      .from("reviews")
      .update({ response })
      .eq("id", reviewId);

    if (error) throw error;

    setLocalReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, response } : r))
    );
    setRespondingTo(null);
  };

  return (
    <>
      <RatingStats
        averageRating={averageRating}
        reviewCount={reviewCount}
        distribution={distribution}
      />

      <div className="mt-6 space-y-4">
        {localReviews.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-slate-400">
            No reviews yet.
          </div>
        ) : (
          localReviews.map((review) => (
            <div key={review.id}>
              <ReviewCard
                reviewId={review.id}
                rating={review.rating}
                comment={review.comment}
                response={review.response}
                createdAt={review.created_at}
                customerName={review.profiles?.full_name}
                showRole="professional"
                onRespond={(id) => setRespondingTo(id === respondingTo ? null : id)}
              />
              {respondingTo === review.id && (
                <ResponseForm
                  reviewId={review.id}
                  existingResponse={review.response}
                  onSubmit={handleRespond}
                  onCancel={() => setRespondingTo(null)}
                />
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
