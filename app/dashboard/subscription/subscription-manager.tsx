"use client";

import { useState } from "react";
import { PLANS } from "@/lib/plans";

interface SubscriptionData {
  id: string;
  plan: string;
  plan_name: string | null;
  amount: number | null;
  currency: string | null;
  status: string;
  payfast_subscription_id: string | null;
  current_period_end: string | null;
  next_billing_date: string | null;
  cancelled_at: string | null;
}

interface Props {
  subscription: SubscriptionData | null;
  paymentStatus: string | null;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  past_due: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  trialing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export function SubscriptionManager({ subscription, paymentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [localSub, setLocalSub] = useState(subscription);

  const isActive = localSub?.status === "active";
  const isFree = !localSub || localSub.status === "inactive" || localSub.plan === "free";

  async function handleUpgrade() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/payfast/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });

      const json = await res.json();

      if (!res.ok) {
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

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your billing period.")) {
      return;
    }

    setCancelling(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/payfast/cancel", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to cancel subscription");
        setCancelling(false);
        return;
      }

      setSuccess("Subscription cancelled. Access continues until end of billing period.");
      setLocalSub((prev) =>
        prev
          ? {
              ...prev,
              status: "cancelled",
              cancelled_at: new Date().toISOString(),
            }
          : prev
      );
    } catch {
      setError("Failed to cancel subscription. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Status Alerts */}
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

      {/* Error / Success Messages */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          {success}
        </div>
      )}

      {/* Current Subscription Card */}
      {localSub && localSub.plan !== "free" && localSub.status !== "inactive" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-slate-500">Current Plan</p>
              <h3 className="text-xl font-bold">{localSub.plan_name ?? PLANS.pro.name}</h3>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    statusColors[localSub.status] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {localSub.status.charAt(0).toUpperCase() + localSub.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-400">Next Billing Date</p>
              <p className="mt-1 text-sm font-medium">
                {localSub.next_billing_date
                  ? new Date(localSub.next_billing_date).toLocaleDateString("en-ZA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : localSub.current_period_end
                    ? new Date(localSub.current_period_end).toLocaleDateString("en-ZA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">PayFast Transaction ID</p>
              <p className="mt-1 text-sm font-medium">
                {localSub.payfast_subscription_id ?? "N/A"}
              </p>
            </div>
          </div>

          {localSub.cancelled_at && (
            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="text-xs text-slate-400">Cancelled At</p>
              <p className="mt-1 text-sm font-medium text-red-600">
                {new Date(localSub.cancelled_at).toLocaleDateString("en-ZA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}

          {isActive && (
            <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                {cancelling ? "Cancelling..." : "Cancel Subscription"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upgrade Card */}
      {isFree && (
        <div className="rounded-2xl border-2 border-brand-500 bg-white p-8 shadow-soft dark:bg-slate-900">
          <div className="text-center">
            <h3 className="text-2xl font-bold">{PLANS.pro.name}</h3>
            <p className="mt-2 text-sm text-slate-500">
              {PLANS.pro.description}
            </p>
          </div>

          <ul className="mt-8 space-y-3">
            {PLANS.pro.features.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm">
                <svg
                  className="h-5 w-5 shrink-0 text-brand-600"
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

          <button
            type="button"
            disabled={loading}
            onClick={handleUpgrade}
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Redirecting to PayFast..." : "Upgrade to Pro"}
          </button>

          <p className="mt-3 text-center text-xs text-slate-400">
            Cancel Anytime
          </p>
        </div>
      )}

      {/* Plan Comparison */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-bold">Plan Comparison</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3 text-left font-medium text-slate-500">Feature</th>
                <th className="pb-3 text-center font-medium text-slate-500">Free</th>
                <th className="pb-3 text-center font-medium text-brand-600">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {[
                { name: "Quotes", free: "5 per month", pro: "Unlimited" },
                { name: "Jobs", free: "3 active", pro: "Unlimited" },
                { name: "Messaging", free: "Basic", pro: "Unlimited" },
                { name: "Verified Badge", free: false, pro: true },
                { name: "Featured Listing", free: false, pro: true },
                { name: "Portfolio Gallery", free: false, pro: true },
                { name: "Priority Support", free: false, pro: true },
              ].map((row) => (
                <tr key={row.name}>
                  <td className="py-3 font-medium">{row.name}</td>
                  <td className="py-3 text-center">
                    {typeof row.free === "boolean" ? (
                      row.free ? (
                        <CheckIcon />
                      ) : (
                        <CrossIcon />
                      )
                    ) : (
                      <span className="text-slate-500">{row.free}</span>
                    )}
                  </td>
                  <td className="py-3 text-center">
                    {typeof row.pro === "boolean" ? (
                      row.pro ? (
                        <CheckIcon />
                      ) : (
                        <CrossIcon />
                      )
                    ) : (
                      <span className="font-medium text-brand-600">{row.pro}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="mx-auto h-5 w-5 text-brand-600"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      className="mx-auto h-5 w-5 text-slate-300 dark:text-slate-600"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
