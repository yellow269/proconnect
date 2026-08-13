import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServiceForm } from "@/components/professional/service-form";

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Add Service
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Create a new service offering for your customers
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <ServiceForm categories={categories ?? []} />
      </div>
    </div>
  );
}
