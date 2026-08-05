import { createClient } from "@/lib/supabase/server";

type Quote = {
  id: string;
  amount: number | null;
  message: string | null;
  status: string;
  jobs: {
    title: string;
  } | null;
};

export default async function QuotesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">Quotes</h1>
        <p>Please log in.</p>
      </main>
    );
  }

  const { data: quotes, error } = await supabase
    .from("quotes")
    .select("*, jobs(title)")
    .eq("jobs.customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">Quotes</h1>
        <p className="text-red-500">{error.message}</p>
      </main>
    );
  }

  const typedQuotes = (quotes ?? []) as Quote[];

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quotes</h1>
      </div>

      {typedQuotes.length === 0 ? (
        <div className="mt-8 rounded-lg border bg-white p-8 text-center shadow">
          <h2 className="text-xl font-semibold">
            No quotes yet
          </h2>

          <p className="mt-2 text-slate-500">
            Professionals will send quotes for your jobs.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {typedQuotes.map((quote) => (
            <div
              key={quote.id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold">
                {quote.jobs?.title ?? "Untitled Job"}
              </h2>

              <p className="mt-2">
                Amount: <strong>R {quote.amount ?? 0}</strong>
              </p>

              <p className="mt-2 text-slate-500">
                {quote.message}
              </p>

              <span className="mt-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                {quote.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}