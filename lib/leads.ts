import type { Tables, Updates } from "@/types/database";

export type Lead = Tables<"leads">;
export type LeadUpdate = Updates<"leads">;

export type LeadFilter = "all" | "new" | "contacted" | "replied" | "joined";
export type LeadStatus = "new" | "contacted" | "replied" | "joined";

export const LEAD_FILTERS: { value: LeadFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "joined", label: "Joined ProConnect" },
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  replied: "Replied",
  joined: "Joined ProConnect",
};

export function getLeadStatus(lead: Lead): LeadStatus {
  if (lead.joined_proconnect) return "joined";
  if (lead.replied) return "replied";
  if (lead.contacted) return "contacted";
  return "new";
}

export function isTruthy(value: boolean | null | undefined): boolean {
  return value === true;
}

/**
 * Strips characters that are reserved inside a PostgREST `or=(...)` logic
 * tree so a raw search box value can be interpolated safely.
 */
export function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[\\()",]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Normalises a phone number to international digits (no `+`), preferring
 * South African formats:
 *   "072 123 4567" | "0027 72 123 4567" | "+27 72 123 4567" | "27721234567"
 *     -> "27721234567"
 *   "82 123 4567" (subscriber number without trunk/dial code) -> "27821234567"
 * Returns null when the number is too short to be dialable.
 */
export function normalizeSaPhone(raw?: string | null): string | null {
  if (!raw) return null;

  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("0027")) {
    digits = digits.slice(4);
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length === 9 && !digits.startsWith("27")) {
    digits = `27${digits}`;
  }

  if (digits.length < 9) return null;

  return digits;
}

/** Builds a wa.me deep link. Never sends a message on its own. */
export function buildWhatsAppLink(phone?: string | null): string | null {
  const digits = normalizeSaPhone(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function formatLeadDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
