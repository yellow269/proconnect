"use client";

import { useState } from "react";

interface ResponseFormProps {
  reviewId: string;
  existingResponse?: string | null;
  onSubmit: (reviewId: string, response: string) => Promise<void>;
  onCancel: () => void;
}

export function ResponseForm({ reviewId, existingResponse, onSubmit, onCancel }: ResponseFormProps) {
  const [response, setResponse] = useState(existingResponse ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = response.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit(reviewId, trimmed);
    } catch {
      setError("Failed to save response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-lg border bg-slate-50 p-4">
      <label className="block text-sm font-semibold text-slate-700">
        {existingResponse ? "Edit your response" : "Write your response"}
      </label>
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        rows={3}
        maxLength={2000}
        className="mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Thank you for your review..."
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={loading || !response.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : existingResponse ? "Update Response" : "Submit Response"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
