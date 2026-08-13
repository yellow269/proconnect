import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { siteConfig } from "@/lib/config";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <BriefcaseBusiness className="h-5 w-5" />
          </span>
          {siteConfig.name}
        </Link>
        <nav className="hidden gap-7 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
          <Link href="/search">Find Professionals</Link>
          <Link href="#how-it-works">How it works</Link>
          <Link href="#categories">Services</Link>
          <Link href="/register?role=professional">For professionals</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="hidden text-sm font-semibold sm:block">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
