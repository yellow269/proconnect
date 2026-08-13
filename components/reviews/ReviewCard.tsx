import { StarRating } from "./StarRating";

interface ReviewCardProps {
  rating: number;
  comment: string | null;
  response: string | null;
  createdAt: string;
  customerName?: string | null;
  professionalName?: string | null;
  serviceName?: string | null;
  showRole?: "customer" | "professional";
  reviewId: string;
  onRespond?: (reviewId: string) => void;
}

export function ReviewCard({
  rating,
  comment,
  response,
  createdAt,
  customerName,
  professionalName,
  serviceName,
  showRole = "customer",
  reviewId,
  onRespond,
}: ReviewCardProps) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <StarRating value={rating} readonly size="sm" />
          <p className="mt-1 text-sm text-slate-500">
            {showRole === "customer"
              ? `Review for ${professionalName ?? "Professional"}`
              : `by ${customerName ?? "Anonymous"}`}
            {serviceName && (
              <span className="ml-1">
                &middot; {serviceName}
              </span>
            )}
          </p>
        </div>
        <time className="text-xs text-slate-400">
          {new Date(createdAt).toLocaleDateString("en-ZA", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </time>
      </div>

      {comment && (
        <p className="mt-3 text-slate-700">{comment}</p>
      )}

      {response && (
        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">Professional response:</p>
          <p className="mt-1 text-sm text-slate-600">{response}</p>
        </div>
      )}

      {!response && showRole === "professional" && onRespond && (
        <button
          onClick={() => onRespond(reviewId)}
          className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Respond to review
        </button>
      )}
    </div>
  );
}
