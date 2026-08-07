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

export const FREE_FEATURES = [
  "5 Quotes per month",
  "3 Active Jobs",
  "Basic Messaging",
  "Standard Listing",
  "Basic Profile",
];
