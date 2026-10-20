import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServiceForm } from "@/components/professional/service-form";
import { ServiceListingStatus } from "@/components/professional/service-listing-status";
import { isSubscriptionActive } from "@/lib/service-listing";

export default async function NewServicePage() {
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

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  // Free listing status + subscription state
  const [{ data: professionalProfile }, { data: subscription }] =
    await Promise.all([
      supabase
        .from("professional_profiles")
        .select("free_listing_used")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .or(`user_id.eq.${user.id},professional_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Add Service
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Create a new service offering for your customers
      </p>

      <ServiceListingStatus
        freeListingUsed={professionalProfile?.free_listing_used ?? false}
        hasActiveSubscription={isSubscriptionActive(subscription)}
      />

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <ServiceForm categories={categories ?? []} />
      </div>
    </div>
  );
}
