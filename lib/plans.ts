import type { SubscriptionPlan } from "@/types/database";

export interface PlanConfig {
  amount: string;
  name: string;
  description: string;
  features: string[];
}

/**
 * The single, server-controlled ProConnect Professional subscription.
 *
 * IMPORTANT: This amount is the only source of truth for what a customer
 * is charged. It is read exclusively on the server (checkout route and
 * PayFast signature builder). Never accept a price from the browser.
 */
export const PLANS: Record<Exclude<SubscriptionPlan, "free">, PlanConfig> = {
  pro: {
    amount: "50.00",
    name: "ProConnect Professional",
    description:
      "Unlimited service listings and pro tools to grow your business",
    features: [
      "First service listing free",
      "Unlimited Service Listings",
      "Unlimited Quotes",
      "Unlimited Jobs",
      "Unlimited Messaging",
      "Verified Business Badge",
      "Featured Listing",
      "Portfolio Gallery",
      "Priority Support",
    ],
  },
};

/**
 * Format a plan amount as a human friendly monthly price,
 * e.g. "R50/month".
 */
export function formatMonthlyPrice(plan: PlanConfig): string {
  const value = Number(plan.amount);
  const formatted = Number.isInteger(value)
    ? value.toFixed(0)
    : value.toFixed(2);
  return `R${formatted}/month`;
}

/**
 * Format a plan amount in ZAR with two decimals,
 * e.g. "R50.00".
 */
export function formatPlanAmount(plan: PlanConfig): string {
  return `R${Number(plan.amount).toFixed(2)}`;
}
