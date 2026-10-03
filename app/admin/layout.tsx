import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/admin/leads")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 py-6 lg:flex-row lg:gap-8 lg:py-8">
          {/* Sidebar (collapses to a horizontal nav on mobile) */}
          <aside className="lg:w-64 lg:shrink-0">
            <div className="lg:sticky lg:top-24">
              <p className="mb-4 hidden px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 lg:block">
                ProConnect Admin
              </p>
              <AdminNav />
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
