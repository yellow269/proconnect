import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
    .select("*")
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

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Jobs</h1>

        <Link
          href="/dashboard/post-job"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Post Job
        </Link>
      </div>

      {!jobs || jobs.length === 0 ? (
        <div className="mt-8 rounded-lg border bg-white p-8 text-center shadow">
          <h2 className="text-xl font-semibold">
            No jobs posted yet
          </h2>

          <p className="mt-2 text-slate-500">
  Click Post Job to create your first job.
</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold">
                {job.title}
              </h2>

              <p className="mt-2 text-slate-500">
                {job.description}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="font-semibold">
                  Budget: R{job.budget_min ?? 0}
                </span>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                  {job.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}