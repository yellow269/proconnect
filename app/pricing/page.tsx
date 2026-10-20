import Link from "next/link";
import type { Metadata } from "next";
import { Check, Sparkles } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PLANS, formatMonthlyPrice } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Your first service listing is free on ProConnect. Add unlimited service listings with the ProConnect Professional subscription for R50/month.",
};

const FREE_FEATURES = [
  "Your first service listing is free",
  "Build a professional storefront",
  "Receive quotes and bookings",
  "Customer messaging",
];

export default function PricingPage() {
  const plan = PLANS.pro;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
            Customers always post jobs for free. Professionals get their first
            service listing free, then unlock unlimited listings with the
            {plan.name} subscription.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Free tier */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Free
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              For every professional getting started
            </p>
            <p className="mt-6 text-4xl font-bold text-slate-900 dark:text-white">
              R0
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Your first service listing is FREE!
            </p>

            <ul className="mt-8 space-y-3">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Get started free
            </Link>
          </div>

          {/* Professional subscription */}
          <div className="relative rounded-2xl border-2 border-brand-500 bg-white p-8 shadow-soft dark:bg-slate-900">
            <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5" />
              For professionals
            </span>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {plan.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{plan.description}</p>

            <p className="mt-6 text-4xl font-bold text-slate-900 dark:text-white">
              {formatMonthlyPrice(plan)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              After your free first listing, add unlimited service listings for
              as long as your subscription is active.
            </p>

            <ul className="mt-8 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard/subscription"
              className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Subscribe for {formatMonthlyPrice(plan)}
            </Link>

            <p className="mt-3 text-center text-xs text-slate-400">
              Billed monthly in ZAR via PayFast. Cancel anytime — access
              continues until the end of your billing period.
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            How the free listing works
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Every professional account gets one free service listing — no
              card required.
            </li>
            <li>
              The free listing can only be used once per professional account.
            </li>
            <li>
              Additional service listings require an active {plan.name}{" "}
              subscription at {formatMonthlyPrice(plan)}.
            </li>
            <li>
              An active subscription allows unlimited additional service
              listings.
            </li>
            <li>
              Editing or deleting your existing listings is always free, with or
              without a subscription.
            </li>
            <li>
              Customers posting jobs are never charged and are unaffected by
              these rules.
            </li>
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
