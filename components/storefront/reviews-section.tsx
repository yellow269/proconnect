"use client";

import { Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer_id: string;
}

interface ReviewsSectionProps {
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-slate-200 dark:text-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const date = new Date(review.created_at).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <StarRating rating={review.rating} />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {date}
          </p>
        </div>
      </div>
      {review.comment && (
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {review.comment}
        </p>
      )}
    </div>
  );
}

export function ReviewsSection({
  reviews,
  averageRating,
  reviewCount,
}: ReviewsSectionProps) {
  if (reviewCount === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Reviews
        </h2>
        <div className="flex items-center gap-2">
          <StarRating rating={Math.round(averageRating)} />
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-slate-400">
            ({reviewCount})
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
