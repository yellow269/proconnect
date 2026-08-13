"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Check, Calendar, Clock, User, MapPin } from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string | null;
  price_from: number | null;
  fixed_price: number | null;
  pricing_type: "fixed" | "starting_from" | "quote";
  duration_minutes: number | null;
}

interface TimeSlot {
  slot_start: string;
  slot_end: string;
}

interface BookingModalProps {
  service: Service;
  professionalId: string;
  professionalName: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-ZA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${minutes} ${ampm}`;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function BookingModal({
  service,
  professionalId,
  professionalName,
  isOpen,
  onClose,
}: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return {
      value: date.toISOString().split("T")[0],
      label: formatDate(date),
      day: date.toLocaleDateString("en-ZA", { weekday: "short" }),
      date: date.getDate(),
    };
  });

  useEffect(() => {
    if (!selectedDate || !service.duration_minutes) return;

    async function fetchSlots() {
      setLoadingSlots(true);
      try {
        const res = await fetch(
          `/api/availability/${professionalId}?date=${selectedDate}&duration=${service.duration_minutes}`
        );
        if (res.ok) {
          const data = await res.json();
          setAvailableSlots(data.slots ?? []);
        }
      } catch {
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedDate, professionalId, service.duration_minutes]);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: service.id,
          professional_id: professionalId,
          booking_date: selectedDate,
          start_time: selectedSlot?.slot_start,
          end_time: selectedSlot?.slot_end,
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          address,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create booking");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const price =
    service.pricing_type === "fixed"
      ? service.fixed_price
      : service.price_from;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {success ? "Booking Confirmed" : `Book ${service.title}`}
            </h2>
            {!success && (
              <p className="text-sm text-slate-500">
                Step {step} of 4
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {success ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                Booking Request Sent!
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {professionalName} will review your booking and confirm shortly.
                You&apos;ll receive a notification once confirmed.
              </p>
              <button
                onClick={onClose}
                className="mt-6 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Step 1: Date */}
              {step === 1 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Select a date
                  </h3>
                  <div className="grid grid-cols-7 gap-2">
                    {dates.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => {
                          setSelectedDate(d.value);
                          setSelectedSlot(null);
                          setStep(2);
                        }}
                        className={`flex flex-col items-center rounded-xl p-2 text-center transition ${
                          selectedDate === d.value
                            ? "bg-brand-600 text-white"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        }`}
                      >
                        <span className="text-[10px] uppercase opacity-70">
                          {d.day}
                        </span>
                        <span className="text-lg font-bold">{d.date}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Time */}
              {step === 2 && (
                <div>
                  <button
                    onClick={() => setStep(1)}
                    className="mb-3 flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to dates
                  </button>
                  <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Select a time on {formatDate(new Date(selectedDate + "T00:00:00"))}
                  </h3>
                  {loadingSlots ? (
                    <div className="py-8 text-center text-sm text-slate-500">
                      Loading available times...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-500">
                      No available time slots for this date. Please choose another date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.slot_start}
                          onClick={() => {
                            setSelectedSlot(slot);
                            setStep(3);
                          }}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                            selectedSlot?.slot_start === slot.slot_start
                              ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950"
                              : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                          }`}
                        >
                          {formatTime(slot.slot_start)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Contact Details */}
              {step === 3 && (
                <div className="space-y-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to times
                  </button>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Your contact details
                  </h3>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
                      placeholder="071 234 5678"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Service Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
                      placeholder="123 Main St, Johannesburg"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Additional Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
                      placeholder="Any special requirements..."
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Confirm */}
              {step === 4 && (
                <div className="space-y-4">
                  <button
                    onClick={() => setStep(3)}
                    className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to details
                  </button>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Confirm your booking
                  </h3>
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{formatDate(new Date(selectedDate + "T00:00:00"))}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>
                          {formatTime(selectedSlot?.slot_start ?? "")} -{" "}
                          {formatTime(selectedSlot?.slot_end ?? "")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-slate-400" />
                        <span>{contactName}</span>
                      </div>
                      {address && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span>{address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  {price !== null && service.pricing_type !== "quote" && (
                    <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-950">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Estimated Total
                        </span>
                        <span className="text-xl font-bold text-brand-700 dark:text-brand-300">
                          {formatPrice(price)}
                          {service.pricing_type === "starting_from" && (
                            <span className="text-xs font-normal text-slate-500">
                              {" "}starting from
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {service.pricing_type === "quote" && (
                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        This service requires a custom quote. The professional will
                        provide pricing after reviewing your request.
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={() => {
                  if (step === 1 && !selectedDate) return;
                  if (step === 2 && !selectedSlot) return;
                  if (step === 3) {
                    if (!contactName || !contactEmail || !contactPhone) return;
                  }
                  setStep(step + 1);
                }}
                disabled={
                  (step === 1 && !selectedDate) ||
                  (step === 2 && !selectedSlot) ||
                  (step === 3 && (!contactName || !contactEmail || !contactPhone))
                }
                className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Booking...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Confirm Booking
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
