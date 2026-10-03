"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Pencil, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  LEAD_STATUS_LABELS,
  formatLeadDate,
  getLeadStatus,
  isTruthy,
  type Lead,
  type LeadUpdate,
} from "@/lib/leads";

interface LeadForm {
  business_name: string;
  service: string;
  city: string;
  phone: string;
  address: string;
  contact_name: string;
  contacted: boolean;
  replied: boolean;
  joined_proconnect: boolean;
  notes: string;
}

interface LeadModalProps {
  lead: Lead;
  mode: "view" | "edit";
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onRequestEdit: () => void;
  onSave: (patch: LeadUpdate) => void;
}

function toForm(lead: Lead): LeadForm {
  return {
    business_name: lead.business_name ?? "",
    service: lead.service ?? "",
    city: lead.city ?? "",
    phone: lead.phone ?? "",
    address: lead.address ?? "",
    contact_name: lead.contact_name ?? "",
    contacted: isTruthy(lead.contacted),
    replied: isTruthy(lead.replied),
    joined_proconnect: isTruthy(lead.joined_proconnect),
    notes: lead.notes ?? "",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">
        {value || <span className="text-slate-400">—</span>}
      </dd>
    </div>
  );
}

const checkboxClass =
  "h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900";

export function LeadModal({
  lead,
  mode,
  saving,
  error,
  onClose,
  onRequestEdit,
  onSave,
}: LeadModalProps) {
  const [form, setForm] = useState<LeadForm>(() => toForm(lead));
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const set = <K extends keyof LeadForm>(key: K, value: LeadForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    if (!form.business_name.trim()) {
      setNameError("Business name is required");
      return;
    }
    setNameError("");
    onSave({
      business_name: form.business_name.trim(),
      service: form.service.trim(),
      city: form.city.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      contact_name: form.contact_name.trim(),
      contacted: form.contacted,
      replied: form.replied,
      joined_proconnect: form.joined_proconnect,
      notes: form.notes.trim(),
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submit();
  };

  const status = getLeadStatus(lead);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="min-w-0">
            <h2
              id="lead-modal-title"
              className="truncate text-lg font-bold text-slate-900 dark:text-white"
            >
              {lead.business_name || "Untitled lead"}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="capitalize">{status === "joined" ? "Joined ProConnect" : status}</span>
              <span aria-hidden="true">·</span>
              <span>Added {formatLeadDate(lead.created_at)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-8rem)] overflow-y-auto px-5 py-5 sm:px-6">
          {mode === "view" ? (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    lead.contacted
                      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  )}
                >
                  {lead.contacted ? "Contacted" : "Not contacted"}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    lead.replied
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  )}
                >
                  {lead.replied ? "Replied" : "No reply yet"}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    lead.joined_proconnect
                      ? "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  )}
                >
                  {lead.joined_proconnect ? "Joined ProConnect" : "Not joined"}
                </span>
              </div>

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Detail label="Business name" value={lead.business_name ?? ""} />
                <Detail label="Contact person" value={lead.contact_name ?? ""} />
                <Detail label="Service" value={lead.service ?? ""} />
                <Detail label="City" value={lead.city ?? ""} />
                <Detail label="Phone" value={lead.phone ?? ""} />
                <Detail label="Address" value={lead.address ?? ""} />
                <Detail label="Status" value={LEAD_STATUS_LABELS[status]} />
                <Detail label="Last updated" value={formatLeadDate(lead.updated_at)} />
              </dl>

              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                  {lead.notes || <span className="text-slate-400">No notes yet</span>}
                </p>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Business name *">
                  <Input
                    value={form.business_name}
                    onChange={(e) => set("business_name", e.target.value)}
                    placeholder="Bloom Plumbing Services"
                    aria-invalid={Boolean(nameError)}
                  />
                </Field>
                <Field label="Contact person">
                  <Input
                    value={form.contact_name}
                    onChange={(e) => set("contact_name", e.target.value)}
                    placeholder="Thabo Mokoena"
                  />
                </Field>
                <Field label="Service">
                  <Input
                    value={form.service}
                    onChange={(e) => set("service", e.target.value)}
                    placeholder="Plumbing"
                  />
                </Field>
                <Field label="City">
                  <Input
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="Cape Town"
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="072 123 4567"
                    inputMode="tel"
                  />
                </Field>
                <Field label="Address">
                  <Input
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="12 Main Rd, Durban"
                  />
                </Field>
              </div>

              <fieldset className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <legend className="px-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Pipeline status
                </legend>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-6">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      className={checkboxClass}
                      checked={form.contacted}
                      onChange={(e) => set("contacted", e.target.checked)}
                    />
                    Contacted
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      className={checkboxClass}
                      checked={form.replied}
                      onChange={(e) => set("replied", e.target.checked)}
                    />
                    Replied
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      className={checkboxClass}
                      checked={form.joined_proconnect}
                      onChange={(e) => set("joined_proconnect", e.target.checked)}
                    />
                    Joined ProConnect
                  </label>
                </div>
              </fieldset>

              <Field label="Notes">
                <Textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={4}
                  placeholder="Call back after 17:00, quote sent, follow up next week..."
                />
              </Field>

              {(nameError || error) && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{nameError || error}</span>
                </div>
              )}
            </form>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <span className="text-xs text-slate-400">
            {mode === "edit" ? "Changes apply to public.leads" : `Status: ${LEAD_STATUS_LABELS[status]}`}
          </span>

          {mode === "view" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={onRequestEdit}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
