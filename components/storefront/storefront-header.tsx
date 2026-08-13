"use client";

import { Star, MapPin, Shield, Briefcase } from "lucide-react";

interface StorefrontHeaderProps {
  fullName: string;
  avatarUrl: string | null;
  businessName: string;
  slug: string;
  bio: string | null;
  verified: boolean;
  categoryName: string | null;
  city: string | null;
  province: string | null;
  averageRating: number;
  reviewCount: number;
  whatsappNumber: string | null;
  serviceArea: string | null;
}

export function StorefrontHeader({
  fullName,
  avatarUrl,
  businessName,
  bio,
  verified,
  categoryName,
  city,
  province,
  averageRating,
  reviewCount,
  whatsappNumber,
  serviceArea,
}: StorefrontHeaderProps) {
  const location = [city, province].filter(Boolean).join(", ");
  const displayLocation = serviceArea || location;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-950 text-white">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
          {/* Avatar */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="h-24 w-24 rounded-2xl object-cover ring-4 ring-white/20 sm:h-32 sm:w-32"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/20 ring-4 ring-white/20 sm:h-32 sm:w-32">
                <span className="text-4xl font-bold">
                  {fullName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-6 sm:ml-6 sm:mt-0">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl font-bold sm:text-3xl">
                {businessName || fullName}
              </h1>
              {verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
                  <Shield className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-white/80 sm:justify-start">
              {categoryName && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {categoryName}
                </span>
              )}
              {displayLocation && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {displayLocation}
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="mt-3 flex items-center justify-center gap-2 sm:justify-start">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-white/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold">
                {averageRating > 0 ? averageRating.toFixed(1) : "New"}
              </span>
              {reviewCount > 0 && (
                <span className="text-sm text-white/60">
                  ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
                </span>
              )}
            </div>

            {/* Bio */}
            {bio && (
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80">
                {bio}
              </p>
            )}

            {/* WhatsApp */}
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hi ${fullName}, I found you on ProConnect and I'm interested in your services.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Chat on WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
