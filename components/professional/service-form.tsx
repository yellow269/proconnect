"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { Tables } from "@/types/database";

type Category = Tables<"categories">;

interface Props {
  service?: Tables<"services">;
  categories: Category[];
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function ServiceForm({ service, categories }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(service?.title ?? "");
  const [categoryId, setCategoryId] = useState(service?.category_id ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [pricingType, setPricingType] = useState<"fixed" | "starting_from" | "quote">(
    (service?.pricing_type as "fixed" | "starting_from" | "quote") ?? "starting_from"
  );
  const [priceFrom, setPriceFrom] = useState(
    service?.price_from?.toString() ?? ""
  );
  const [fixedPrice, setFixedPrice] = useState(
    service?.fixed_price?.toString() ?? ""
  );
  const [durationMinutes, setDurationMinutes] = useState(
    service?.duration_minutes?.toString() ?? "60"
  );
  const [imageUrl, setImageUrl] = useState(service?.image_url ?? "");
  const [active, setActive] = useState(service?.active ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!title || !categoryId) {
      setError("Title and category are required");
      setLoading(false);
      return;
    }

    const data = {
      professional_id: "", // Will be set from server
      category_id: categoryId,
      title,
      description: description || null,
      pricing_type: pricingType,
      price_from: pricingType === "starting_from" && priceFrom ? Number(priceFrom) : null,
      fixed_price: pricingType === "fixed" && fixedPrice ? Number(fixedPrice) : null,
      duration_minutes: durationMinutes ? Number(durationMinutes) : null,
      image_url: imageUrl || null,
      active,
    };

    if (service?.id) {
      const { error: updateError } = await supabase
        .from("services")
        .update(data)
        .eq("id", service.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
    } else {
      // Get current user's professional_id
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("services").insert({
        ...data,
        professional_id: user.id,
      });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }
    }

    router.push("/professional/services");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Service Name *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
          placeholder="e.g., Emergency Plumbing"
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Category *
        </label>
        <SearchableSelect
          options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
          value={categoryId}
          onChange={setCategoryId}
          placeholder="Select a category..."
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Describe your service..."
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Pricing Type
        </label>
        <div className="flex gap-3">
          {[
            { value: "fixed" as const, label: "Fixed Price" },
            { value: "starting_from" as const, label: "Starting From" },
            { value: "quote" as const, label: "Request a Quote" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPricingType(opt.value)}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                pricingType === opt.value
                  ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {pricingType === "fixed" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Fixed Price (ZAR) *
          </label>
          <input
            type="number"
            value={fixedPrice}
            onChange={(e) => setFixedPrice(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
            placeholder="e.g., 800"
            min="0"
            required
          />
        </div>
      )}

      {pricingType === "starting_from" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Starting Price (ZAR)
          </label>
          <input
            type="number"
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
            placeholder="e.g., 500"
            min="0"
          />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Duration
        </label>
        <select
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">Not specified</option>
          {[15, 30, 45, 60, 90, 120, 180, 240, 480].map((m) => (
            <option key={m} value={m}>
              {formatDuration(m)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Image URL (optional)
        </label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActive(!active)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            active ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-600"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              active ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : service?.id ? "Update Service" : "Create Service"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
