import type { Tables } from "@/types/database";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Search,
  Briefcase,
  FileText,
  MessageSquare,
  Star,
  Heart,
  Calendar,
} from "lucide-react";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profileData = profile as Tables<"profiles"> | null;

  // Professionals go to their dashboard
  if (profileData?.role === "professional") {
    redirect("/professional");
  }

  // Customer dashboard
  const customerLinks = [
    { href: "/search", label: "Find Professionals", icon: Search, color: "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300" },
    { href: "/jobs/new", label: "Post a Job", icon: Briefcase, color: "text-brand-600 bg-brand-100 dark:bg-brand-900 dark:text-brand-300" },
    { href: "/dashboard/my-jobs", label: "My Jobs", icon: FileText, color: "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300" },
    { href: "/dashboard/quotes", label: "Quotes", icon: Star, color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300" },
    { href: "/messages", label: "Messages", icon: MessageSquare, color: "text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300" },
    { href: "/dashboard/favorites", label: "Favorites", icon: Heart, color: "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300" },
    { href: "/dashboard/reviews", label: "Reviews", icon: Star, color: "text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300" },
    { href: "/dashboard/profile", label: "My Profile", icon: Calendar, color: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300" },
  ];

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold">Customer Dashboard</h1>
      <p className="mt-2 text-slate-500">
        Welcome, <strong>{profileData?.full_name || user.email}</strong>
      </p>

      {!profileData && (
        <div className="mt-8 rounded-lg border border-yellow-300 bg-yellow-50 p-6">
          <h2 className="text-xl font-semibold">Complete your profile</h2>
          <p className="mt-2">Before using ProConnect, please complete your profile.</p>
          <Link
            href="/dashboard/profile"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            Complete Profile
          </Link>
        </div>
      )}

      {profileData && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {customerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900"
            >
              <div className={`inline-flex rounded-xl p-2.5 ${link.color}`}>
                <link.icon className="h-5 w-5" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
