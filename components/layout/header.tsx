"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BriefcaseBusiness, Menu, X, LogOut } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { siteConfig } from "@/lib/config";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const loadRole = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setRole(profile?.role ?? "customer");
    } catch {
      setRole(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRole();
  }, [loadRole, pathname]);

  // Reset mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setRole(null);
    router.push("/");
    router.refresh();
  }

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

        {/* Desktop nav */}
        <nav className="hidden gap-6 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
          {!isAuth && (
            <>
              <Link href="/search" className="hover:text-slate-900 dark:hover:text-white">Find Professionals</Link>
              <Link href="/search" className="hover:text-slate-900 dark:hover:text-white">Find Jobs</Link>
            </>
          )}
          {isAuth && role === "customer" && (
            <>
              <Link href="/search" className="hover:text-slate-900 dark:hover:text-white">Find Professionals</Link>
              <Link href="/jobs/new" className="hover:text-slate-900 dark:hover:text-white">Post a Job</Link>
              <Link href="/dashboard/my-jobs" className="hover:text-slate-900 dark:hover:text-white">My Jobs</Link>
              <Link href="/messages" className="hover:text-slate-900 dark:hover:text-white">Messages</Link>
            </>
          )}
          {isAuth && role === "professional" && (
            <>
              <Link href="/search" className="hover:text-slate-900 dark:hover:text-white">Find Jobs</Link>
              <Link href="/professional/services" className="hover:text-slate-900 dark:hover:text-white">My Services</Link>
              <Link href="/professional/storefront" className="hover:text-slate-900 dark:hover:text-white">Storefront</Link>
              <Link href="/messages" className="hover:text-slate-900 dark:hover:text-white">Messages</Link>
            </>
          )}
        </nav>

        {/* Desktop right side */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {!loading && !isAuth && (
            <>
              <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Create Account
              </Link>
            </>
          )}
          {isAuth && (
            <>
              <Link
                href={role === "professional" ? "/professional" : "/dashboard"}
                className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            {!isAuth && (
              <>
                <Link href="/search" className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Find Professionals</Link>
                <Link href="/search" className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Find Jobs</Link>
                <hr className="border-slate-200 dark:border-slate-800" />
                <Link href="/login" className="rounded-lg px-3 py-2 font-semibold text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800">Login</Link>
                <Link href="/register" className="rounded-lg bg-brand-600 px-3 py-2.5 text-center font-semibold text-white hover:bg-brand-700">Create Account</Link>
              </>
            )}
            {isAuth && role === "customer" && (
              <>
                <Link href="/search" className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Find Professionals</Link>
                <Link href="/jobs/new" className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Post a Job</Link>
                <Link href="/dashboard/my-jobs" className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">My Jobs</Link>
                <Link href="/messages" className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Messages</Link>
                <hr className="border-slate-200 dark:border-slate-800" />
                <Link href="/dashboard" className="rounded-lg bg-brand-600 px-3 py-2.5 text-center font-semibold text-white hover:bg-brand-700">Dashboard</Link>
                <button onClick={handleLogout} className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-left font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            )}
            {isAuth && role === "professional" && (
              <>
                <Link href="/search" className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Find Jobs</Link>
                <Link href="/professional/services" className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">My Services</Link>
                <Link href="/professional/storefront" className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Storefront</Link>
                <Link href="/messages" className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Messages</Link>
                <hr className="border-slate-200 dark:border-slate-800" />
                <Link href="/professional" className="rounded-lg bg-brand-600 px-3 py-2.5 text-center font-semibold text-white hover:bg-brand-700">Dashboard</Link>
                <button onClick={handleLogout} className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-left font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
