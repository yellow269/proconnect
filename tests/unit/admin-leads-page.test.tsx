import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/supabase/client", () => {
  const builder: Record<string, unknown> = {};
  const chain: Record<string, unknown> = {
    select: () => builder,
    or: () => builder,
    eq: () => builder,
    not: () => builder,
    order: () => builder,
    range: () => builder,
    update: () => builder,
    then: (resolve: (value: unknown) => unknown) =>
      resolve({ data: [], error: null, count: 0 }),
  };
  Object.assign(builder, chain);

  return {
    createClient: () => ({
      from: () => builder,
      auth: { getUser: async () => ({ data: { user: null } }) },
    }),
  };
});

import AdminLeadsPage from "@/app/admin/leads/page";

describe("AdminLeadsPage", () => {
  it("renders the leads header, summary cards and filters", async () => {
    render(<AdminLeadsPage />);

    expect(screen.getByRole("heading", { name: "Leads" })).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Total Leads/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /New Leads/ })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Replied/ }).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: /Joined ProConnect/ }).length
    ).toBeGreaterThan(0);

    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Search leads" })
    ).toBeInTheDocument();
  });

  it("shows the empty state when the query returns no rows", async () => {
    render(<AdminLeadsPage />);

    expect(await screen.findByText("No leads yet")).toBeInTheDocument();
    expect(
      screen.getByText("Leads captured for ProConnect will appear here.")
    ).toBeInTheDocument();
  });
});
