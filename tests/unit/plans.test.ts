import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { PLANS, formatMonthlyPrice, formatPlanAmount } from "@/lib/plans";
import { buildCheckoutParams } from "@/lib/payfast";

const SUBSCRIPTION_ID = "123e4567-e89b-12d3-a456-426614174000";

describe("ProConnect Professional plan pricing", () => {
  it("costs R50.00 ZAR per month", () => {
    expect(PLANS.pro.amount).toBe("50.00");
    expect(formatMonthlyPrice(PLANS.pro)).toBe("R50/month");
    expect(formatPlanAmount(PLANS.pro)).toBe("R50.00");
  });

  it("is named as the ProConnect Professional subscription", () => {
    expect(PLANS.pro.name).toBe("ProConnect Professional");
  });

  it("describes unlimited service listings", () => {
    const features = PLANS.pro.features.join(" ").toLowerCase();
    expect(features).toContain("unlimited service listings");
    expect(features).toContain("first service listing free");
  });
});

describe("PayFast recurring subscription checkout", () => {
  const data = buildCheckoutParams(
    SUBSCRIPTION_ID,
    "pro",
    "pro@example.com",
    "Pro",
    "Fessional"
  );

  it("charges the server-controlled R50.00 amount", () => {
    expect(data.amount).toBe("50.00");
  });

  it("renews at R50.00 monthly", () => {
    expect(data.recurring_amount).toBe("50.00");
    expect(data.subscription_type).toBe("1");
    expect(data.frequency).toBe("3");
    expect(data.cycles).toBe("0");
    expect(data.currency).toBe("ZAR");
  });

  it("labels the checkout with the professional plan name", () => {
    expect(data.item_name).toBe(PLANS.pro.name);
    expect(data.item_description).toBe(PLANS.pro.description);
  });
});

describe("server-controlled checkout amount", () => {
  const checkoutRoute = readFileSync(
    path.join(process.cwd(), "app/api/payfast/checkout/route.ts"),
    "utf8"
  );

  it("never reads an amount supplied by the browser", () => {
    // The plan amount always comes from the server-side PLANS config
    expect(checkoutRoute).toContain("PLANS[planKey]");
    expect(checkoutRoute).toContain("amount: Number(planConfig.amount)");
    expect(checkoutRoute).not.toMatch(/body\.amount/);
    expect(checkoutRoute).not.toMatch(/body\?\.amount/);
    expect(checkoutRoute).not.toMatch(/req\.amount/);
    expect(checkoutRoute).not.toMatch(/parsed\.amount/);
  });
});
