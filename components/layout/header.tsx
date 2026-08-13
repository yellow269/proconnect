"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { siteConfig } from "@/lib/config";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setRole(profile?.role ?? null);
      setLoading(false);
    }
    loadRole();
  }, [pathname]);

  const isAuth = !loading && role !== null;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <BriefcaseBusiness className="h-5 w-5" />
          </span>
          {siteConfig.name}
        </Link>

        {/* Public nav */}
        {!isAuth && (
          <nav className="hidden gap-7 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
            <Link href="/search">Find Professionals</Link>
            <Link href="/register?role=professional">For professionals</Link>
          </nav>
        )}

        {/* Customer nav */}
        {isAuth && role === "customer" && (
          <nav className="hidden gap-7 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
            <Link href="/search">Find Professionals</Link>
            <Link href="/jobs/new">Post a Job</Link>
            <Link href="/dashboard/my-jobs">My Jobs</Link>
            <Link href="/messages">Messages</Link>
          </nav>
        )}

        {/* Professional nav */}
        {isAuth && role === "professional" && (
          <nav className="hidden gap-7 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
            <Link href="/search">Find Jobs</Link>
            <Link href="/professional/services">My Services</Link>
            <Link href="/professional/storefront">Storefront</Link>
            <Link href="/messages">Messages</Link>
          </nav>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!isAuth && (
            <>
              <Link href="/login" className="hidden text-sm font-semibold sm:block">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Get started
              </Link>
            </>
          )}
          {isAuth && (
            <Link
              href={role === "professional" ? "/professional" : "/dashboard"}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
