import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { siteConfig } from "@/lib/config";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
                <BriefcaseBusiness className="h-5 w-5" />
              </span>
              {siteConfig.name}
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Connecting customers with trusted local professionals. Find the
              right expert for every job.
            </p>
          </div>

          {/* For Customers */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              For Customers
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <Link href="/search" className="hover:text-brand-600">
                  Find a Professional
                </Link>
              </li>
              <li>
                <Link href="/jobs/new" className="hover:text-brand-600">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-brand-600">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* For Professionals */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              For Professionals
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <Link href="/register" className="hover:text-brand-600">
                  Join ProConnect
                </Link>
              </li>
              <li>
                <Link href="/professional/services" className="hover:text-brand-600">
                  Manage Services
                </Link>
              </li>
              <li>
                <Link href="/professional/storefront" className="hover:text-brand-600">
                  Your Storefront
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              ProConnect
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <Link href="/search" className="hover:text-brand-600">
                  Browse Services
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@proconect.co.za"
                  className="hover:text-brand-600"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 dark:border-slate-800 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-slate-600 dark:hover:text-slate-300">
              Login
            </Link>
            <Link href="/register" className="hover:text-slate-600 dark:hover:text-slate-300">
              Register
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
