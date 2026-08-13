import type { SubscriptionPlan } from "@/types/database";

export interface PlanConfig {
  amount: string;
  name: string;
  description: string;
  features: string[];
}

export const PLANS: Record<Exclude<SubscriptionPlan, "free">, PlanConfig> = {
  pro: {
    amount: "150.00",
    name: "ProConnect Pro",
    description: "Everything you need to grow your business",
    features: [
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
