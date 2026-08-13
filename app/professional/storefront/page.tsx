import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StorefrontSettingsForm } from "@/components/professional/storefront-settings-form";

export default async function StorefrontPage() {
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
    .select("user_id, slug")
    .eq("user_id", user.id)
    .single();

  if (!pro) redirect("/dashboard/profile");

  const { data: settings } = await supabase
    .from("professional_storefront_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Storefront Settings
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Customize how your public storefront looks to customers
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <StorefrontSettingsForm settings={settings} slug={pro.slug} />
      </div>
    </div>
  );
}
