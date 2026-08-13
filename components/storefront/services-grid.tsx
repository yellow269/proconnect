"use client";

import { ServiceCard } from "./service-card";

interface Service {
  id: string;
  title: string;
  description: string | null;
  price_from: number | null;
  fixed_price: number | null;
  pricing_type: "fixed" | "starting_from" | "quote";
  duration_minutes: number | null;
  image_url: string | null;
  categories: { name: string } | null;
}

interface ServicesGridProps {
  services: Service[];
  onBookNow: (serviceId: string) => void;
}

export function ServicesGrid({ services, onBookNow }: ServicesGridProps) {
  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/40">
        <p className="text-slate-500 dark:text-slate-400">
          No services listed yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          id={service.id}
          title={service.title}
          description={service.description}
          priceFrom={service.price_from}
          fixedPrice={service.fixed_price}
          pricingType={service.pricing_type}
          durationMinutes={service.duration_minutes}
          imageUrl={service.image_url}
          categoryName={service.categories?.name ?? null}
          onBookNow={onBookNow}
        />
      ))}
    </div>
  );
}
