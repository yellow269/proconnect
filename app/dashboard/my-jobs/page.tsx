import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MapPin, DollarSign } from "lucide-react";

export default async function MyJobsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">My Jobs</h1>
        <p>Please log in.</p>
      </main>
    );
  }

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*, categories(name)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">My Jobs</h1>
        <p className="text-red-500">{error.message}</p>
      </main>
    );
  }

  // Get quote counts for each job
  const jobIds = (jobs ?? []).map((j) => j.id);
  const { data: quoteData } = await supabase
    .from("quotes")
    .select("job_id, status")
    .in("job_id", jobIds);

  const quoteCounts = new Map<string, { total: number; pending: number }>();
  for (const q of (quoteData ?? []) as { job_id: string; status: string }[]) {
    const existing = quoteCounts.get(q.job_id) ?? { total: 0, pending: 0 };
    existing.total += 1;
    if (q.status === "pending") existing.pending += 1;
    quoteCounts.set(q.job_id, existing);
  }

  const typedJobs = (jobs ?? []) as {
    id: string;
    title: string;
    description: string;
    status: string;
    budget_min: number | null;
    budget_max: number | null;
    city: string;
    province: string;
    categories: { name: string } | null;
  }[];

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Jobs</h1>

        <Link
          href="/jobs/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Post Job
        </Link>
      </div>

      {!typedJobs || typedJobs.length === 0 ? (
        <div className="mt-8 rounded-lg border bg-white p-8 text-center shadow">
          <h2 className="text-xl font-semibold">No jobs posted yet</h2>
          <p className="mt-2 text-slate-500">
            Click Post Job to create your first job.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {typedJobs.map((job) => {
            const qc = quoteCounts.get(job.id);
            return (
              <div
                key={job.id}
                className="rounded-lg border bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{job.title}</h2>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      {job.categories?.name && <span>{job.categories.name}</span>}
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.city}, {job.province}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-slate-500">
                      {job.description}
                    </p>

                    <div className="mt-3 flex items-center gap-4">
                      {(job.budget_min || job.budget_max) && (
                        <span className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                          <DollarSign className="h-3.5 w-3.5" />
                          R{job.budget_min?.toLocaleString() ?? "0"} &ndash; R{job.budget_max?.toLocaleString() ?? "0"}
                        </span>
                      )}

                      {qc && qc.total > 0 ? (
                        <Link
                          href="/dashboard/quotes"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {qc.total} quote{qc.total !== 1 ? "s" : ""} received
                          {qc.pending > 0 && (
                            <span className="ml-1 text-yellow-600">
                              ({qc.pending} pending)
                            </span>
                          )}
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-400">No quotes yet</span>
                      )}
                    </div>
                  </div>

                  <span className="ml-4 shrink-0 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                    {job.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
