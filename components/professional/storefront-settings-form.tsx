"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface StorefrontSettings {
  whatsapp_number: string | null;
  custom_description: string | null;
  cover_image_url: string | null;
  service_area: string | null;
  show_portfolio: boolean;
  show_reviews: boolean;
}

export function StorefrontSettingsForm({
  settings,
  slug,
}: {
  settings: StorefrontSettings | null;
  slug: string;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [whatsappNumber, setWhatsappNumber] = useState(
    settings?.whatsapp_number ?? ""
  );
  const [customDescription, setCustomDescription] = useState(
    settings?.custom_description ?? ""
  );
  const [coverImageUrl, setCoverImageUrl] = useState(
    settings?.cover_image_url ?? ""
  );
  const [serviceArea, setServiceArea] = useState(
    settings?.service_area ?? ""
  );
  const [showPortfolio, setShowPortfolio] = useState(
    settings?.show_portfolio ?? true
  );
  const [showReviews, setShowReviews] = useState(
    settings?.show_reviews ?? true
  );

  async function handleSave() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("professional_storefront_settings").upsert(
      {
        user_id: user.id,
        whatsapp_number: whatsappNumber || null,
        custom_description: customDescription || null,
        cover_image_url: coverImageUrl || null,
        service_area: serviceArea || null,
        show_portfolio: showPortfolio,
        show_reviews: showReviews,
      },
      { onConflict: "user_id" }
    );

    setLoading(false);
    alert("Settings saved!");
  }

  function copyLink() {
    const url = `${window.location.origin}/pro/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Storefront Link */}
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-800 dark:bg-brand-950">
        <h3 className="font-bold text-brand-900 dark:text-brand-100">
          Your Storefront Link
        </h3>
        <p className="mt-1 text-sm text-brand-700 dark:text-brand-300">
          Share this link with customers to showcase your services
        </p>
        <div className="mt-3 flex items-center gap-3">
          <code className="flex-1 rounded-lg bg-white px-3 py-2 text-sm font-mono text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {typeof window !== "undefined"
              ? `${window.location.origin}/pro/${slug}`
              : `/pro/${slug}`}
          </code>
          <button
            onClick={copyLink}
            className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* WhatsApp */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          WhatsApp Number
        </label>
        <input
          type="tel"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
          placeholder="+27 71 234 5678"
        />
        <p className="mt-1 text-xs text-slate-400">
          Include country code. Customers will be able to message you on WhatsApp.
        </p>
      </div>

      {/* Custom Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Storefront Description
        </label>
        <textarea
          value={customDescription}
          onChange={(e) => setCustomDescription(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
          placeholder="A short description that appears on your storefront..."
        />
      </div>

      {/* Cover Image */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Cover Image URL
        </label>
        <input
          type="url"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
          placeholder="https://example.com/cover.jpg"
        />
      </div>

      {/* Service Area */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Service Area
        </label>
        <input
          type="text"
          value={serviceArea}
          onChange={(e) => setServiceArea(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
          placeholder="e.g., Johannesburg, Pretoria & surrounding areas"
        />
      </div>

      {/* Visibility Toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Show Portfolio
            </p>
            <p className="text-xs text-slate-400">
              Display your portfolio gallery on your storefront
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPortfolio(!showPortfolio)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              showPortfolio ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                showPortfolio ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Show Reviews
            </p>
            <p className="text-xs text-slate-400">
              Display customer reviews on your storefront
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowReviews(!showReviews)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              showReviews ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                showReviews ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>

      {/* Preview */}
      <a
        href={`/pro/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        Preview your storefront
        &rarr;
      </a>
    </div>
  );
}
