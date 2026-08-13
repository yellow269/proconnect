import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServiceForm } from "@/components/professional/service-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .eq("professional_id", user.id)
    .single();

  if (!service) notFound();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Edit Service
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Update your service details
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <ServiceForm service={service} categories={categories ?? []} />
      </div>
    </div>
  );
}
