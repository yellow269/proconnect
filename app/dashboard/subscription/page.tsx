import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionManager } from "./subscription-manager";

export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "professional") {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-3xl font-bold">Subscription</h1>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Only professionals can manage subscriptions.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Your account role: <span className="font-semibold capitalize">{profile?.role ?? "unknown"}</span>
          </p>
        </div>
      </main>
    );
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("professional_id", user.id)
    .single();

  const params = await searchParams;

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold">Subscription</h1>
      <p className="mt-2 text-slate-500">
        Manage your ProConnect subscription plan.
      </p>

      <div className="mt-8">
        <SubscriptionManager
          currentPlan={subscription?.plan ?? "free"}
          status={subscription?.status ?? "inactive"}
          periodEnd={subscription?.current_period_end ?? null}
          paymentStatus={params.status ?? null}
        />
      </div>
    </main>
  );
}
