import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JobForm from "@/components/jobs/JobForm";

export default async function NewJobPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Only customers can post jobs
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "professional") {
    redirect("/professional");
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-8 text-3xl font-bold">Post a New Job</h1>
      <JobForm userId={user.id} />
    </main>
  );
}
