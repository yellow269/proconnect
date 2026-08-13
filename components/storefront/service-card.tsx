"use client";

import { Clock, Tag } from "lucide-react";

interface ServiceCardProps {
  id: string;
  title: string;
  description: string | null;
  priceFrom: number | null;
  fixedPrice: number | null;
  pricingType: "fixed" | "starting_from" | "quote";
  durationMinutes: number | null;
  imageUrl: string | null;
  categoryName: string | null;
  onBookNow: (serviceId: string) => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function ServiceCard({
  id,
  title,
  description,
  priceFrom,
  fixedPrice,
  pricingType,
  durationMinutes,
  imageUrl,
  categoryName,
  onBookNow,
}: ServiceCardProps) {
  const displayPrice = pricingType === "fixed" ? fixedPrice : priceFrom;
  const priceLabel =
    pricingType === "quote"
      ? "Request a quote"
      : pricingType === "fixed"
        ? formatPrice(fixedPrice ?? 0)
        : `From ${formatPrice(priceFrom ?? 0)}`;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900">
      {/* Image */}
      {imageUrl && (
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        </div>
      )}

      <div className="p-5">
        {/* Category */}
        {categoryName && (
          <span className="inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {categoryName}
          </span>
        )}

        {/* Title */}
        <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}

        {/* Meta */}
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
          {durationMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(durationMinutes)}
            </span>
          )}
          {displayPrice !== null && pricingType !== "quote" && (
            <span className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              {priceLabel}
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="text-lg font-bold text-brand-600">
            {priceLabel}
          </span>
          <button
            onClick={() => onBookNow(id)}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {pricingType === "quote" ? "Inquire" : "Book Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
