import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import { ServiceList } from "@/components/professional/service-list";
import { ServiceListingStatus } from "@/components/professional/service-listing-status";
import { isSubscriptionActive } from "@/lib/service-listing";

export default async function ServicesPage() {
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

  // Get services with category names
  const { data: services } = await supabase
    .from("services")
    .select("*, categories(name)")
    .eq("professional_id", user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  // Free listing status + subscription state for the listing gate
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

  const hasActiveSubscription = isSubscriptionActive(subscription);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Services
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your service offerings
          </p>
        </div>
        <Link
          href="/professional/services/new"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </Link>
      </div>

      <ServiceListingStatus
        freeListingUsed={professionalProfile?.free_listing_used ?? false}
        hasActiveSubscription={hasActiveSubscription}
      />

      <div className="mt-6">
        <ServiceList services={services ?? []} />
      </div>
    </div>
  );
}
