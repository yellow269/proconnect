"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string | null;
  price_from: number | null;
  fixed_price: number | null;
  pricing_type: string;
  duration_minutes: number | null;
  active: boolean;
  sort_order: number;
  categories: { name: string } | null;
}

interface Props {
  services: Service[];
}

export function ServiceList({ services }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [toggling, setToggling] = useState<string | null>(null);

  async function toggleActive(service: Service) {
    setToggling(service.id);
    await supabase
      .from("services")
      .update({ active: !service.active })
      .eq("id", service.id);
    setToggling(null);
    router.refresh();
  }

  async function deleteService(id: string) {
    if (!confirm("Are you sure you want to delete this service?")) return;
    await supabase.from("services").delete().eq("id", id);
    router.refresh();
  }

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-slate-500">No services yet.</p>
        <p className="mt-1 text-sm text-slate-400">
          Create your first service to start receiving bookings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {services.map((service) => (
        <div
          key={service.id}
          className={`flex items-center gap-4 rounded-2xl border bg-white p-4 transition dark:bg-slate-900 ${
            service.active
              ? "border-slate-200 dark:border-slate-800"
              : "border-slate-100 opacity-60 dark:border-slate-800/50"
          }`}
        >
          <GripVertical className="h-5 w-5 shrink-0 text-slate-300" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {service.title}
              </h3>
              {service.categories && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {service.categories.name}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
              {service.pricing_type === "fixed" && service.fixed_price && (
                <span>R{service.fixed_price.toLocaleString()}</span>
              )}
              {service.pricing_type === "starting_from" && service.price_from && (
                <span>From R{service.price_from.toLocaleString()}</span>
              )}
              {service.pricing_type === "quote" && <span>Quote</span>}
              {service.duration_minutes && (
                <span>{service.duration_minutes} min</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleActive(service)}
              disabled={toggling === service.id}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              title={service.active ? "Deactivate" : "Activate"}
            >
              {service.active ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() =>
                router.push(`/professional/services/${service.id}/edit`)
              }
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => deleteService(service.id)}
              className="rounded-lg p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
