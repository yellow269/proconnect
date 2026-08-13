"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SubmitQuoteForm } from "@/components/quotes/SubmitQuoteForm";
import { MapPin, Clock } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  city: string;
  province: string;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  created_at: string;
  categories: { name: string } | null;
  quote_count: number;
}

export default function ProfessionalJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteForJob, setQuoteForJob] = useState<string | null>(null);
  const [myQuoteJobs, setMyQuoteJobs] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: jobsData } = await supabase
        .from("jobs")
        .select(
          `
          id, title, description, city, province, budget_min, budget_max,
          status, created_at,
          categories(name)
        `
        )
        .in("status", ["open", "quoted"])
        .not("customer_id", "eq", user.id)
        .order("created_at", { ascending: false });

      const jobsList = (jobsData ?? []) as Omit<Job, "quote_count">[];

      const jobIds = jobsList.map((j) => j.id);
      const { data: quoteCounts } = await supabase
        .from("quotes")
        .select("job_id")
        .in("job_id", jobIds);

      const countMap = new Map<string, number>();
      for (const q of (quoteCounts ?? []) as { job_id: string }[]) {
        countMap.set(q.job_id, (countMap.get(q.job_id) ?? 0) + 1);
      }

      const { data: myQuotes } = await supabase
        .from("quotes")
        .select("job_id")
        .eq("professional_id", user.id);

      const quotedJobIds = new Set((myQuotes ?? []).map((q: { job_id: string }) => q.job_id));
      setMyQuoteJobs(quotedJobIds);

      setJobs(
        jobsList.map((j) => ({
          ...j,
          quote_count: countMap.get(j.id) ?? 0,
        }))
      );
      setLoading(false);
    }

    load();
  }, [supabase]);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Find Jobs</h1>
        <p className="mt-4 text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Find Jobs</h1>
      <p className="mt-1 text-sm text-slate-500">
        Browse jobs posted by customers and submit quotes
      </p>

      {jobs.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-slate-500">No open jobs available right now. Check back later.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {jobs.map((job) => {
            const hasQuoted = myQuoteJobs.has(job.id);
            const isQuoteOpen = quoteForJob === job.id;

            return (
              <div
                key={job.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {job.title}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      {job.categories?.name && <span>{job.categories.name}</span>}
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.city}, {job.province}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(job.created_at).toLocaleDateString("en-ZA", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-slate-400">
                        {job.quote_count} quote{job.quote_count !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                      {job.description}
                    </p>

                    {(job.budget_min || job.budget_max) && (
                      <p className="mt-2 text-sm text-slate-500">
                        Budget: R{job.budget_min?.toLocaleString() ?? "0"} &ndash; R{job.budget_max?.toLocaleString() ?? "0"}
                      </p>
                    )}
                  </div>
                </div>

                {hasQuoted ? (
                  <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                    You have already quoted on this job
                  </div>
                ) : isQuoteOpen ? (
                  <SubmitQuoteForm
                    jobId={job.id}
                    onSubmitted={() => {
                      setMyQuoteJobs((prev) => new Set(prev).add(job.id));
                      setQuoteForJob(null);
                      setJobs((prev) =>
                        prev.map((j) =>
                          j.id === job.id
                            ? { ...j, quote_count: j.quote_count + 1 }
                            : j
                        )
                      );
                    }}
                  />
                ) : (
                  <button
                    onClick={() => setQuoteForJob(job.id)}
                    className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Submit Quote
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
