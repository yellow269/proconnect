import type { Tables } from "@/types/database";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();

  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect if not logged in
  if (!user) {
    redirect("/login");
  }

  // Get profile
const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();

const profile = data as Tables<"profiles"> | null;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <p className="mt-2 text-slate-500">
        Welcome, <strong>{user.email}</strong>
      </p>

      {error || !profile ? (
        <div className="mt-8 rounded-lg border border-yellow-300 bg-yellow-50 p-6">
          <h2 className="text-xl font-semibold">
            Complete your profile
          </h2>

          <p className="mt-2">
            Before using ProConnect, please complete your profile.
          </p>

          <Link
            href="/dashboard/profile"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            Complete Profile
          </Link>
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">
            Welcome back, {profile.full_name || user.email}
          </h2>

          <p className="mt-2 text-slate-500">
            Your profile is complete.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/dashboard/post-job"
              className="rounded-lg bg-blue-600 p-4 text-center text-white hover:bg-blue-700"
            >
              📋 Post a Job
            </Link>

            <Link
              href="/dashboard/my-jobs"
              className="rounded-lg border p-4 text-center hover:bg-slate-50"
            >
              📂 My Jobs
            </Link>

            <Link
              href="/messages"
              className="rounded-lg border p-4 text-center hover:bg-slate-50"
            >
              💬 Messages
            </Link>

            <Link
              href="/dashboard/quotes"
              className="rounded-lg border p-4 text-center hover:bg-slate-50"
            >
              💰 Quotes
            </Link>

            <Link
              href="/dashboard/reviews"
              className="rounded-lg border p-4 text-center hover:bg-slate-50"
            >
              ⭐ Reviews
            </Link>

            <Link
              href="/dashboard/favorites"
              className="rounded-lg border p-4 text-center hover:bg-slate-50"
            >
              ❤️ Favorites
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}