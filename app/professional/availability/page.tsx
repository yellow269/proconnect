import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityForm } from "@/components/professional/availability-form";

export default async function AvailabilityPage() {
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

  const { data: pro } = await supabase
    .from("professional_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (!pro) redirect("/dashboard/profile");

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Availability
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Set your working hours so customers can book appointments
      </p>

      <div className="mt-6">
        <AvailabilityForm />
      </div>
    </div>
  );
}
