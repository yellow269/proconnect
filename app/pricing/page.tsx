"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS, FREE_FEATURES } from "@/lib/plans";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const proFeatures = PLANS.pro.features;

  async function handleUpgrade() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payfast/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login?next=/pricing";
          return;
        }
        setError(json.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = json.url;

      for (const [key, value] of Object.entries(json.data)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch {
      setError("Failed to start checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="font-semibold text-brand-600">Pricing</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Choose the right plan for your business
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500 dark:text-slate-400">
          Start free and upgrade when you&apos;re ready. No hidden fees.
        </p>
      </div>

      <div className="mt-14 grid gap-8 md:grid-cols-2">
        {/* Free Plan */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-bold">Free</h2>
          <p className="mt-2 text-sm text-slate-500">Get started with the basics</p>
          <p className="mt-6 text-4xl font-bold">
            R0
            <span className="text-sm font-normal text-slate-500">/month</span>
          </p>

          <ul className="mt-8 space-y-4">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <Link
            href="/register"
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            Get Started Free
          </Link>
        </div>

        {/* Pro Plan */}
        <div className="relative rounded-2xl border-2 border-brand-500 bg-white p-8 shadow-soft dark:bg-slate-900">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-brand-600 px-4 py-1 text-xs font-semibold text-white">
              Most Popular
            </span>
          </div>

          <h2 className="text-xl font-bold">ProConnect Pro</h2>
          <p className="mt-2 text-sm text-slate-500">
            Everything you need to grow your business
          </p>
          <p className="mt-6 text-4xl font-bold">
            R150
            <span className="text-sm font-normal text-slate-500">/month</span>
          </p>

          <ul className="mt-8 space-y-4">
            {proFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-brand-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={handleUpgrade}
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Redirecting to PayFast..." : "Upgrade to Pro"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">
            Cancel Anytime
          </p>
        </div>
      </div>

      <div className="mt-16 text-center">
        <p className="text-sm text-slate-500">
          All payments are securely processed by PayFast. Your financial information is never stored on our servers.
        </p>
      </div>
    </main>
  );
}
