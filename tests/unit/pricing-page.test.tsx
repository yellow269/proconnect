import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => "/pricing",
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
    }),
  }),
}));

import PricingPage from "@/app/pricing/page";
import { ServiceListingStatus } from "@/components/professional/service-listing-status";

describe("PricingPage", () => {
  it("shows the R50/month professional plan and the free first listing", () => {
    render(<PricingPage />);

    expect(screen.getAllByText("R50/month").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Your first service listing is FREE!")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Subscribe for R50\/month/ })
    ).toHaveAttribute("href", "/dashboard/subscription");
  });

  it("keeps the existing PayFast subscription workflow", () => {
    render(<PricingPage />);

    expect(
      screen.getByText(/Billed monthly in ZAR via PayFast/)
    ).toBeInTheDocument();
  });
});

describe("ServiceListingStatus", () => {
  it("celebrates the free first listing before it is used", () => {
    render(<ServiceListingStatus freeListingUsed={false} hasActiveSubscription={false} />);

    expect(
      screen.getByText("Your first service listing is FREE!")
    ).toBeInTheDocument();
  });

  it("offers the R50/month upgrade once the free listing is used", () => {
    render(<ServiceListingStatus freeListingUsed hasActiveSubscription={false} />);

    expect(
      screen.getByRole("heading", { name: "Unlock More Service Listings" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your first service listing was free. Upgrade to ProConnect Professional for R50/month to add unlimited service listings."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Subscribe for R50/month" })
    ).toHaveAttribute("href", "/dashboard/subscription");
  });

  it("shows unlimited listings while subscribed", () => {
    render(<ServiceListingStatus freeListingUsed hasActiveSubscription />);

    expect(
      screen.getByText("ProConnect Professional subscription active")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/add unlimited service listings/)
    ).toBeInTheDocument();
  });
});
