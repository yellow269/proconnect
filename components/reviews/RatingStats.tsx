import { StarRating } from "./StarRating";

interface RatingStatsProps {
  averageRating: number;
  reviewCount: number;
  distribution: Record<number, number>;
}

export function RatingStats({ averageRating, reviewCount, distribution }: RatingStatsProps) {
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-slate-900">{averageRating.toFixed(1)}</p>
          <StarRating value={Math.round(averageRating)} readonly size="sm" />
          <p className="mt-1 text-sm text-slate-500">
            Based on {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
          </p>
        </div>

        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] || 0;
            const pct = reviewCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-right text-slate-600">{star} ★</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-slate-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
