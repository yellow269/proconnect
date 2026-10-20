import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { SubscriptionManager } from "@/app/dashboard/subscription/subscription-manager";

describe("SubscriptionManager", () => {
  it("advertises the R50/month professional plan when not subscribed", () => {
    render(<SubscriptionManager subscription={null} paymentStatus={null} />);

    expect(screen.getByText("ProConnect Professional")).toBeInTheDocument();
    expect(screen.getAllByText("R50/month").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Subscribe for R50/month" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your first service listing is free/)
    ).toBeInTheDocument();
  });

  it("shows status, next billing date and cancellation info for an active subscription", () => {
    render(
      <SubscriptionManager
        subscription={{
          id: "sub-1",
          plan: "pro",
          plan_name: "ProConnect Professional",
          amount: 50,
          currency: "ZAR",
          status: "active",
          payfast_subscription_id: "PF-123",
          current_period_end: null,
          next_billing_date: "2026-11-01",
          cancelled_at: null,
        }}
        paymentStatus={null}
      />
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(
      screen.getAllByText("R50/month").length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        new Date("2026-11-01").toLocaleDateString("en-ZA", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      )
    ).toBeInTheDocument();
    expect(screen.getByText("PF-123")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel Subscription" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Cancellation: cancel anytime/)).toBeInTheDocument();
  });

  it("offers a renew button for a cancelled subscription", () => {
    render(
      <SubscriptionManager
        subscription={{
          id: "sub-2",
          plan: "pro",
          plan_name: "ProConnect Professional",
          amount: 50,
          currency: "ZAR",
          status: "cancelled",
          payfast_subscription_id: null,
          current_period_end: null,
          next_billing_date: null,
          cancelled_at: "2026-10-01T00:00:00.000Z",
        }}
        paymentStatus={null}
      />
    );

    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Renew for R50/month" })
    ).toBeInTheDocument();
  });
});
