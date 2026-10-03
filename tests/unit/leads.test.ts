import { describe, expect, it } from "vitest";
import {
  buildWhatsAppLink,
  getLeadStatus,
  normalizeSaPhone,
  sanitizeSearchTerm,
  type Lead,
} from "@/lib/leads";

function makeLead(overrides: Partial<Lead>): Lead {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    business_name: "Test Business",
    service: "Plumbing",
    city: "Cape Town",
    phone: "072 123 4567",
    address: "1 Main Rd",
    contact_name: "Thabo",
    contacted: false,
    replied: false,
    joined_proconnect: false,
    notes: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("normalizeSaPhone", () => {
  it("converts local SA numbers to the +27 international format", () => {
    expect(normalizeSaPhone("072 123 4567")).toBe("27721234567");
    expect(normalizeSaPhone("011 123 4567")).toBe("27111234567");
  });

  it("keeps numbers that already include the dial code", () => {
    expect(normalizeSaPhone("+27 72 123 4567")).toBe("27721234567");
    expect(normalizeSaPhone("27721234567")).toBe("27721234567");
    expect(normalizeSaPhone("0027721234567")).toBe("27721234567");
  });

  it("prefixes subscriber numbers that omit the trunk zero", () => {
    expect(normalizeSaPhone("82 123 4567")).toBe("27821234567");
  });

  it("leaves non-SA international numbers untouched", () => {
    expect(normalizeSaPhone("+1 415 555 2671")).toBe("14155552671");
  });

  it("returns null for empty or unusable numbers", () => {
    expect(normalizeSaPhone(null)).toBeNull();
    expect(normalizeSaPhone("")).toBeNull();
    expect(normalizeSaPhone("abc")).toBeNull();
    expect(normalizeSaPhone("0123")).toBeNull();
  });
});

describe("buildWhatsAppLink", () => {
  it("builds a wa.me link without any prefilled message", () => {
    expect(buildWhatsAppLink("072 123 4567")).toBe("https://wa.me/27721234567");
  });

  it("returns null when the phone cannot be normalised", () => {
    expect(buildWhatsAppLink("n/a")).toBeNull();
    expect(buildWhatsAppLink(undefined)).toBeNull();
  });
});

describe("sanitizeSearchTerm", () => {
  it("removes characters reserved by PostgREST logic trees", () => {
    expect(sanitizeSearchTerm('plumb(er), "cap" \\ town')).toBe(
      "plumb er cap town"
    );
  });

  it("collapses whitespace", () => {
    expect(sanitizeSearchTerm("  bloom   plumbing  ")).toBe("bloom plumbing");
  });
});

describe("getLeadStatus", () => {
  it("reports the most advanced stage of the pipeline", () => {
    expect(getLeadStatus(makeLead({}))).toBe("new");
    expect(getLeadStatus(makeLead({ contacted: true }))).toBe("contacted");
    expect(getLeadStatus(makeLead({ contacted: true, replied: true }))).toBe(
      "replied"
    );
    expect(
      getLeadStatus(
        makeLead({ contacted: true, replied: true, joined_proconnect: true })
      )
    ).toBe("joined");
  });

  it("treats null flags as not set", () => {
    expect(
      getLeadStatus(
        makeLead({ contacted: null, replied: null, joined_proconnect: null })
      )
    ).toBe("new");
  });
});
