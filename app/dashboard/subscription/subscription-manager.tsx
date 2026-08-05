"use client";

import { useState } from "react";
import { PLANS } from "@/lib/plans";
import type { SubscriptionPlan } from "@/types/database";

type PlanKey = Exclude<SubscriptionPlan, "free">;

const planFeatures: Record<PlanKey, string[]> = {
  pro: ["Priority listing in search", "Unlimited quotes per month", "Advanced analytics dashboard", "Highlighted profile badge", "Email support"],
  business: ["Everything in Pro", "Team member management", "API access", "Priority phone support", "Custom branding"],
};

interface Props {
  currentPlan: SubscriptionPlan;
  status: string;
  periodEnd: string | null;
  paymentStatus: string | null;
}

export function SubscriptionManager({ currentPlan, status, periodEnd, paymentStatus }: Props) {
  const [loading, setLoading] = useState<PlanKey | null>(null);
  const [error, setError] = useState("");

  async function handleCheckout(plan: PlanKey) {
    setLoading(plan);
    setError("");

    try {
      const res = await fetch("/api/payfast/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        setLoading(null);
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
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {paymentStatus === "success" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          Payment successful! Your subscription is now active.
        </div>
      )}
      {paymentStatus === "cancelled" && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
          Payment was cancelled. You can try again below.
        </div>
      )}

      {currentPlan !== "free" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Current plan</p>
              <h3 className="text-xl font-bold capitalize">{currentPlan}</h3>
              <p className="mt-1 text-sm text-slate-500">
                Status: <span className="font-medium capitalize">{status}</span>
              </p>
              {periodEnd && (
                <p className="text-sm text-slate-500">
                  Renews: {new Date(periodEnd).toLocaleDateString("en-ZA")}
                </p>
              )}
            </div>
            <span className="rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
              Active
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {(Object.keys(PLANS) as PlanKey[]).map((planKey) => {
          const plan = PLANS[planKey];
          const isCurrent = currentPlan === planKey;

          return (
            <div
              key={planKey}
              className={`rounded-2xl border bg-white p-6 transition dark:bg-slate-900 ${
                isCurrent
                  ? "border-brand-500 ring-2 ring-brand-500/20"
                  : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
              }`}
            >
              <h3 className="text-lg font-bold capitalize">{planKey}</h3>
              <p className="mt-1 text-3xl font-bold">
                R{plan.amount}
                <span className="text-sm font-normal text-slate-500">/mo</span>
              </p>
              <p className="mt-2 text-sm text-slate-500">{plan.description}</p>

              <ul className="mt-6 space-y-3">
                {planFeatures[planKey].map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button
                  type="button"
                  disabled
                  className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => handleCheckout(planKey)}
                  className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading === planKey ? "Redirecting to PayFast..." : `Upgrade to ${planKey}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
