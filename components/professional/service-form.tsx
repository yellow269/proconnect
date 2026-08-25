"use client";

import { useState, useRef } from "react";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(service?.image_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(service?.active ?? true);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadImage(file: File, userId: string): Promise<string | null> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("service-images")
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("service-images").getPublicUrl(path);
    return data.publicUrl;
  }

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
      let finalImageUrl = imageUrl || null;

      if (imageFile) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            setError("Not authenticated");
            setLoading(false);
            return;
          }
          finalImageUrl = await uploadImage(imageFile, user.id);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to upload image");
          setLoading(false);
          return;
        }
      }

      const { error: updateError } = await supabase
        .from("services")
        .update({ ...data, image_url: finalImageUrl })
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

      let finalImageUrl = imageUrl || null;

      if (imageFile) {
        try {
          finalImageUrl = await uploadImage(imageFile, user.id);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to upload image");
          setLoading(false);
          return;
        }
      }

      const { error: insertError } = await supabase.from("services").insert({
        ...data,
        professional_id: user.id,
        image_url: finalImageUrl,
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
          Service Photo (optional)
        </label>

        {imagePreview ? (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Service preview"
              className="h-40 w-40 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow-sm transition hover:bg-red-600"
            >
              &times;
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex h-40 w-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-brand-400 hover:bg-brand-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-brand-500"
          >
            <svg className="mb-2 h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            <span className="text-xs text-slate-500 dark:text-slate-400">Upload photo</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          className="hidden"
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
