"use client";

import { useState } from "react";
import { ServicesGrid } from "@/components/storefront/services-grid";
import { BookingModal } from "@/components/booking/booking-modal";

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

interface StorefrontServicesProps {
  services: Service[];
  professionalId: string;
  professionalName: string;
}

export function StorefrontServices({
  services,
  professionalId,
  professionalName,
}: StorefrontServicesProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  return (
    <>
      <ServicesGrid
        services={services}
        onBookNow={(serviceId) => {
          const service = services.find((s) => s.id === serviceId);
          if (service) setSelectedService(service);
        }}
      />

      {selectedService && (
        <BookingModal
          service={selectedService}
          professionalId={professionalId}
          professionalName={professionalName}
          isOpen={!!selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </>
  );
}
