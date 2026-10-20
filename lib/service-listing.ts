import type { SubscriptionStatus } from "@/types/database";

/**
 * Business rules for professional service listings:
 *
 * 1. Each professional gets their first service listing free, once.
 * 2. Additional listings require an active ProConnect Professional
 *    subscription (R50/month).
 * 3. An active subscription allows unlimited additional listings.
 * 4. Editing an existing listing never requires a subscription.
 *
 * These rules are enforced in the database (see
 * supabase/migrations/0015_free_first_service_listing.sql). This module
 * mirrors them so the UI can give professionals an accurate, friendly
 * experience before and after the database responds.
 */

/**
 * Marker the database trigger prefixes its error message with, so the
 * client can reliably recognise this specific rejection.
 */
export const SUBSCRIPTION_REQUIRED_CODE = "SUBSCRIPTION_REQUIRED";

/** Friendly message shown when a new listing is blocked. */
export const SUBSCRIPTION_REQUIRED_MESSAGE =
  "Your first service listing was free. Upgrade to ProConnect Professional for R50/month to add unlimited service listings.";

export interface SubscriptionLike {
  status: SubscriptionStatus | string | null;
  current_period_end?: string | null;
}

/**
 * A subscription only counts as active while its status is "active" AND
 * its billing period has not expired.
 */
export function isSubscriptionActive(
  subscription: SubscriptionLike | null | undefined,
  now: Date = new Date()
): boolean {
  if (!subscription) return false;
  if (subscription.status !== "active") return false;

  const periodEnd = subscription.current_period_end;
  if (!periodEnd) return true;

  const endTime = new Date(periodEnd).getTime();
  if (Number.isNaN(endTime)) return true;

  return endTime > now.getTime();
}

export type ServiceListingAccess =
  | { allowed: true; reason: "free_listing" | "subscription" | "editing" }
  | { allowed: false; reason: "subscription_required" };

/**
 * Decide whether a professional may create a service listing.
 */
export function getServiceListingAccess(input: {
  freeListingUsed: boolean;
  subscription?: SubscriptionLike | null;
  isExistingService?: boolean;
  now?: Date;
}): ServiceListingAccess {
  // Editing an existing listing is always allowed.
  if (input.isExistingService) {
    return { allowed: true, reason: "editing" };
  }

  // The first listing is free, once per professional account.
  if (!input.freeListingUsed) {
    return { allowed: true, reason: "free_listing" };
  }

  // Anything after the free listing requires an active subscription.
  if (isSubscriptionActive(input.subscription, input.now)) {
    return { allowed: true, reason: "subscription" };
  }

  return { allowed: false, reason: "subscription_required" };
}

/**
 * Detect the database rejection for "no active subscription".
 */
export function isSubscriptionRequiredError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { message } = error as { message?: string };
  if (typeof message !== "string") return false;
  return message.includes(SUBSCRIPTION_REQUIRED_CODE);
}
