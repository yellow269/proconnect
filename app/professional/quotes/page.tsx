import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MapPin, Clock, DollarSign } from "lucide-react";

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-slate-100 text-slate-600",
};

export const metadata = {
  title: "My Quotes | ProConnect",
};

export default async function ProfessionalQuotesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "professional") {
    redirect("/dashboard");
  }

  // Get quotes submitted by this professional
  const { data: quotes } = await supabase
    .from("quotes")
    .select(
      `
      id, amount, message, estimated_days, status, created_at,
      jobs!inner(id, title, city, province, categories(name))
    `
    )
    .eq("professional_id", user.id)
    .order("created_at", { ascending: false });

  const typedQuotes = (quotes ?? []) as unknown as {
    id: string;
    amount: number;
    message: string;
    estimated_days: number | null;
    status: string;
    created_at: string;
    jobs: {
      id: string;
      title: string;
      city: string;
      province: string;
      categories: { name: string } | null;
    } | null;
  }[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        My Quotes
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Quotes you have submitted for jobs
      </p>

      {typedQuotes.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <DollarSign className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 text-lg font-semibold text-slate-700 dark:text-slate-300">
            No quotes yet
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Find jobs and submit quotes to start earning.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {typedQuotes.map((quote) => {
            const job = quote.jobs;
            const category = job?.categories?.name;
            return (
              <div
                key={quote.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {job?.title ?? "Untitled Job"}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      {category && <span>{category}</span>}
                      {job && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.city}, {job.province}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(quote.created_at).toLocaleDateString("en-ZA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                      {quote.message}
                    </p>

                    {quote.estimated_days && (
                      <p className="mt-2 text-xs text-slate-400">
                        Estimated: {quote.estimated_days} day{quote.estimated_days !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  <div className="ml-4 text-right">
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      R{quote.amount.toLocaleString()}
                    </p>
                    <span
                      className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[quote.status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
