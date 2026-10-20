import { describe, expect, it } from "vitest";

import {
  SUBSCRIPTION_REQUIRED_MESSAGE,
  getServiceListingAccess,
  isSubscriptionActive,
  isSubscriptionRequiredError,
  type SubscriptionLike,
} from "@/lib/service-listing";

function activeSubscription(daysFromNow = 30): SubscriptionLike {
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + daysFromNow);
  return { status: "active", current_period_end: periodEnd.toISOString() };
}

function expiredSubscription(): SubscriptionLike {
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() - 1);
  return { status: "active", current_period_end: periodEnd.toISOString() };
}

describe("free first service listing", () => {
  it("allows the first service listing for free, with no subscription", () => {
    expect(
      getServiceListingAccess({ freeListingUsed: false, subscription: null })
    ).toEqual({ allowed: true, reason: "free_listing" });
  });

  it("only allows the free listing once", () => {
    expect(
      getServiceListingAccess({ freeListingUsed: true, subscription: null })
    ).toEqual({ allowed: false, reason: "subscription_required" });
  });

  it("allows additional listings with an active subscription", () => {
    expect(
      getServiceListingAccess({
        freeListingUsed: true,
        subscription: activeSubscription(),
      })
    ).toEqual({ allowed: true, reason: "subscription" });
  });

  it("rejects additional listings without an active subscription", () => {
    for (const subscription of [
      null,
      undefined,
      { status: "inactive", current_period_end: null },
      { status: "cancelled", current_period_end: null },
      { status: "past_due", current_period_end: null },
      { status: "expired", current_period_end: null },
    ] as SubscriptionLike[]) {
      expect(
        getServiceListingAccess({ freeListingUsed: true, subscription })
      ).toEqual({ allowed: false, reason: "subscription_required" });
    }
  });

  it("does not treat an expired billing period as an active subscription", () => {
    const subscription = expiredSubscription();

    expect(isSubscriptionActive(subscription)).toBe(false);
    expect(
      getServiceListingAccess({ freeListingUsed: true, subscription })
    ).toEqual({ allowed: false, reason: "subscription_required" });
  });

  it("treats a subscription with no recorded period end as active", () => {
    expect(
      isSubscriptionActive({ status: "active", current_period_end: null })
    ).toBe(true);
  });

  it("never blocks editing an existing service listing", () => {
    expect(
      getServiceListingAccess({
        freeListingUsed: true,
        subscription: null,
        isExistingService: true,
      })
    ).toEqual({ allowed: true, reason: "editing" });

    expect(
      getServiceListingAccess({
        freeListingUsed: false,
        subscription: null,
        isExistingService: true,
      })
    ).toEqual({ allowed: true, reason: "editing" });
  });
});

describe("subscription required error detection", () => {
  it("detects the database rejection", () => {
    expect(
      isSubscriptionRequiredError({
        message: `SUBSCRIPTION_REQUIRED: ${SUBSCRIPTION_REQUIRED_MESSAGE}`,
        code: "P0001",
      })
    ).toBe(true);
  });

  it("ignores unrelated database errors", () => {
    expect(
      isSubscriptionRequiredError({ message: "duplicate key value", code: "23505" })
    ).toBe(false);
    expect(isSubscriptionRequiredError(null)).toBe(false);
    expect(isSubscriptionRequiredError("boom")).toBe(false);
  });
});
