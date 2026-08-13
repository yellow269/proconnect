"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  Store,
  Clock,
  ChevronLeft,
  Star,
  FileText,
  Search,
} from "lucide-react";

const navItems = [
  { href: "/professional", label: "Overview", icon: LayoutDashboard },
  { href: "/professional/jobs", label: "Find Jobs", icon: Search },
  { href: "/professional/quotes", label: "My Quotes", icon: FileText },
  { href: "/professional/services", label: "Services", icon: Wrench },
  { href: "/professional/availability", label: "Availability", icon: Clock },
  { href: "/professional/storefront", label: "Storefront", icon: Store },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      <Link
        href="/"
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to ProConnect
      </Link>

      <div className="my-3 border-t border-slate-100 dark:border-slate-800" />

      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/professional" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}

      <div className="my-3 border-t border-slate-100 dark:border-slate-800" />

      <Link
        href="/dashboard/reviews"
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <Star className="h-4 w-4" />
        Reviews
      </Link>
    </nav>
  );
}
