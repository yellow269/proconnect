"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, LayoutDashboard, Users } from "lucide-react";

const navItems = [{ href: "/admin/leads", label: "Leads", icon: Users }];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin navigation"
      className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0"
    >
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 lg:w-full"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="whitespace-nowrap">Back to ProConnect</span>
      </Link>

      <div className="hidden border-t border-slate-100 dark:border-slate-800 lg:my-3 lg:block" />

      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition ${
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

      <div className="hidden border-t border-slate-100 dark:border-slate-800 lg:my-3 lg:block" />

      <Link
        href="/dashboard"
        className="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white lg:w-full"
      >
        <LayoutDashboard className="h-4 w-4" />
        My Dashboard
      </Link>
    </nav>
  );
}
