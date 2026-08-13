"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Star, Check, X } from "lucide-react";
import Link from "next/link";

interface QuoteWithProfessional {
  id: string;
  amount: number;
  message: string;
  estimated_days: number | null;
  status: string;
  created_at: string;
  job_id: string;
  jobs: {
    id: string;
    title: string;
  } | null;
  professional_profiles: {
    user_id: string;
    profiles: { full_name: string; avatar_url: string | null } | null;
    average_rating: number | null;
    review_count: number | null;
    business_name: string | null;
  } | null;
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-slate-100 text-slate-600",
};

export default function CustomerQuotesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [quotes, setQuotes] = useState<QuoteWithProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Get quotes for jobs owned by this customer
      const { data: quotesData } = await supabase
        .from("quotes")
        .select(
          `
          id, amount, message, estimated_days, status, created_at, job_id,
          jobs!inner(id, title, customer_id),
          professional_profiles!quotes_professional_id_fkey(
            user_id,
            profiles:user_id(full_name, avatar_url),
            average_rating,
            review_count,
            business_name
          )
        `
        )
        .eq("jobs.customer_id", user.id)
        .order("created_at", { ascending: false });

      setQuotes((quotesData ?? []) as unknown as QuoteWithProfessional[]);
      setLoading(false);
    }

    load();
  }, [supabase, router]);

  const handleAction = async (quoteId: string, action: "accept" | "reject") => {
    setActionLoading(quoteId);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === quoteId
              ? { ...q, status: action === "accept" ? "accepted" : "rejected" }
              : q.status === "pending" && action === "accept" && q.job_id === prev.find((x) => x.id === quoteId)?.job_id
              ? { ...q, status: "rejected" }
              : q
          )
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">Quotes</h1>
        <p className="mt-2 text-slate-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold">Quotes</h1>
      <p className="mt-2 text-slate-500">
        Quotes professionals have submitted for your jobs
      </p>

      {quotes.length === 0 ? (
        <div className="mt-8 rounded-lg border bg-white p-8 text-center shadow">
          <h2 className="text-xl font-semibold">No quotes yet</h2>
          <p className="mt-2 text-slate-500">
            Professionals will send quotes for your jobs.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Post a job to start receiving quotes.
          </p>
          <Link
            href="/jobs/new"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Post a Job
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {quotes.map((quote) => {
            const pro = quote.professional_profiles;
            const proName =
              pro?.profiles?.full_name ?? pro?.business_name ?? "Professional";
            const rating = pro?.average_rating ?? 0;
            const reviewCount = pro?.review_count ?? 0;
            const isPending = quote.status === "pending";
            const isLoading = actionLoading === quote.id;

            return (
              <div
                key={quote.id}
                className="rounded-lg border bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {pro?.profiles?.avatar_url ? (
                      <img
                        src={pro.profiles.avatar_url}
                        alt={proName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                        {proName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{proName}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        {rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            {rating.toFixed(1)}
                          </span>
                        )}
                        {reviewCount > 0 && (
                          <span>({reviewCount} review{reviewCount !== 1 ? "s" : ""})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[quote.status] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                  </span>
                </div>

                {/* Job title */}
                <p className="mt-3 text-sm text-slate-500">
                  For: <span className="font-medium text-slate-700">{quote.jobs?.title ?? "Untitled Job"}</span>
                </p>

                {/* Quote amount */}
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  R{quote.amount.toLocaleString()}
                </p>

                {/* Message */}
                <p className="mt-2 text-sm text-slate-600">{quote.message}</p>

                {/* Estimated days */}
                {quote.estimated_days && (
                  <p className="mt-2 text-xs text-slate-400">
                    Estimated: {quote.estimated_days} day{quote.estimated_days !== 1 ? "s" : ""}
                  </p>
                )}

                {/* Date */}
                <p className="mt-2 text-xs text-slate-400">
                  Submitted:{" "}
                  {new Date(quote.created_at).toLocaleDateString("en-ZA", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>

                {/* Actions */}
                {isPending && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleAction(quote.id, "accept")}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      {isLoading ? "Processing..." : "Accept Quote"}
                    </button>
                    <button
                      onClick={() => handleAction(quote.id, "reject")}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
