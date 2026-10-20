import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, back: vi.fn() }),
}));

const insert = vi.fn();
const update = vi.fn();
const eq = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "pro-1" } } }),
    },
    from: (table: string) => {
      if (table === "services") {
        return {
          insert: (...args: unknown[]) => insert(...args),
          update: (...args: unknown[]) => {
            update(...args);
            return { eq: (...eqArgs: unknown[]) => eq(...eqArgs) };
          },
        };
      }
      return {};
    },
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  }),
}));

import { ServiceForm } from "@/components/professional/service-form";

const categories = [
  { id: "cat-1", name: "Plumbing", slug: "plumbing" },
];

function renderNewServiceForm() {
  return render(<ServiceForm categories={categories as never} />);
}

async function fillAndSubmit() {
  fireEvent.change(
    screen.getByPlaceholderText("e.g., Emergency Plumbing"),
    { target: { value: "Emergency Plumbing" } }
  );

  fireEvent.click(screen.getByText("Select a category..."));
  fireEvent.click(await screen.findByText("Plumbing"));

  fireEvent.click(screen.getByRole("button", { name: "Create Service" }));
}

describe("ServiceForm", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    insert.mockReset();
    update.mockReset();
    eq.mockReset();
    eq.mockResolvedValue({ error: null });
  });

  it("shows an upgrade prompt when the database rejects an extra listing", async () => {
    insert.mockResolvedValueOnce({
      data: null,
      error: {
        code: "P0001",
        message:
          "SUBSCRIPTION_REQUIRED: Your first service listing was free. An active ProConnect Professional subscription (R50/month) is required to add more service listings.",
      },
    });

    renderNewServiceForm();
    await fillAndSubmit();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Unlock More Service Listings" })
      ).toBeInTheDocument();
    });

    expect(
      screen.getAllByText(
        "Your first service listing was free. Upgrade to ProConnect Professional for R50/month to add unlimited service listings."
      ).length
    ).toBeGreaterThan(0);

    expect(
      screen.getByRole("link", { name: "Subscribe for R50/month" })
    ).toHaveAttribute("href", "/dashboard/subscription");

    // Never surface the raw database error
    expect(screen.queryByText(/SUBSCRIPTION_REQUIRED/)).not.toBeInTheDocument();

    // The professional was not navigated away — no listing was created
    expect(push).not.toHaveBeenCalled();
  });

  it("creates the first service listing without any subscription", async () => {
    insert.mockResolvedValueOnce({ data: {}, error: null });

    renderNewServiceForm();
    await fillAndSubmit();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/professional/services"));
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ professional_id: "pro-1" })
    );
  });

  it("still edits an existing listing without a subscription", async () => {
    render(
      <ServiceForm
        service={
          {
            id: "svc-1",
            professional_id: "pro-1",
            category_id: "cat-1",
            title: "Emergency Plumbing",
            pricing_type: "fixed",
            active: true,
          } as never
        }
        categories={categories as never}
      />
    );

    fireEvent.change(
      screen.getByPlaceholderText("e.g., 800"),
      { target: { value: "800" } }
    );

    fireEvent.click(screen.getByRole("button", { name: "Update Service" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/professional/services"));
    expect(update).toHaveBeenCalled();
    expect(
      screen.queryByText(/Upgrade to ProConnect Professional/)
    ).not.toBeInTheDocument();
  });
});
