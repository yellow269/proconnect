import type { SubscriptionPlan } from "@/types/database";

export const PLANS: Record<Exclude<SubscriptionPlan, "free">, { amount: string; name: string; description: string }> = {
  pro: { amount: "299.00", name: "Pro Plan", description: "Priority listing, unlimited quotes, analytics" },
  business: { amount: "599.00", name: "Business Plan", description: "Team features, API access, premium support" },
};
