"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function SubmitQuoteForm({
  jobId,
  onSubmitted,
}: {
  jobId: string;
  onSubmitted: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [days, setDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      setError("Please enter a valid amount.");
      setLoading(false);
      return;
    }

    if (message.trim().length < 10) {
      setError("Message must be at least 10 characters.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id: jobId,
        amount: numAmount,
        message: message.trim(),
        estimated_days: days ? parseInt(days) : null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to submit quote.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      onSubmitted();
    }, 1500);
  };

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
        <p className="text-sm font-semibold text-green-800">Quote submitted successfully!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-lg border bg-slate-50 p-4">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700">
            Your Quote (ZAR)
          </label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              required
              className="w-full rounded-lg border bg-white pl-7 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700">
            Estimated Days
          </label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            min="1"
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. 3"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={3000}
            required
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Describe how you would complete this job, your experience, and what's included in the price..."
          />
          <p className="mt-1 text-xs text-slate-400">{message.length}/3000</p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        {loading ? "Submitting..." : "Submit Quote"}
      </button>
    </form>
  );
}
