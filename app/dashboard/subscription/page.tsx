import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionManager } from "./subscription-manager";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      "id, plan, plan_name, amount, currency, status, payfast_subscription_id, current_period_start, current_period_end, next_billing_date, cancel_at_period_end, cancelled_at, created_at"
    )
    .or(`user_id.eq.${user.id},professional_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(1)
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
          subscription={
            subscription
              ? {
                  id: subscription.id,
                  plan: subscription.plan,
                  plan_name: subscription.plan_name,
                  amount: subscription.amount,
                  currency: subscription.currency,
                  status: subscription.status,
                  payfast_subscription_id: subscription.payfast_subscription_id,
                  current_period_end: subscription.current_period_end,
                  next_billing_date: subscription.next_billing_date,
                  cancelled_at: subscription.cancelled_at,
                }
              : null
          }
          paymentStatus={params.status ?? null}
        />
      </div>
    </main>
  );
}
