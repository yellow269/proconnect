"use client";

import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";

import { PLANS, formatMonthlyPrice } from "@/lib/plans";

interface Props {
  freeListingUsed: boolean;
  hasActiveSubscription: boolean;
}

/**
 * Explains the free-first-listing rule and, once the free listing is used,
 * offers the ProConnect Professional subscription.
 */
export function ServiceListingStatus({
  freeListingUsed,
  hasActiveSubscription,
}: Props) {
  if (hasActiveSubscription) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
        <div className="text-sm text-green-800 dark:text-green-200">
          <p className="font-semibold">
            ProConnect Professional subscription active
          </p>
          <p className="mt-1">
            You can add unlimited service listings for as long as your
            subscription is active.
          </p>
        </div>
      </div>
    );
  }

  if (!freeListingUsed) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-950">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
        <div className="text-sm text-brand-800 dark:text-brand-200">
          <p className="font-semibold">Your first service listing is FREE!</p>
          <p className="mt-1">
            Add your first service at no cost. After that, the ProConnect
            Professional subscription lets you add unlimited service listings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border-2 border-brand-500 bg-white p-6 shadow-soft dark:bg-slate-900">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
        Unlock More Service Listings
      </h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Your first service listing was free. Upgrade to ProConnect Professional
        for {formatMonthlyPrice(PLANS.pro)} to add unlimited service listings.
      </p>
      <Link
        href="/dashboard/subscription"
        className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Subscribe for {formatMonthlyPrice(PLANS.pro)}
      </Link>
      <p className="mt-3 text-xs text-slate-400">
        Editing your existing listings stays free.
      </p>
    </div>
  );
}
