import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * Customer job posting must remain completely unaffected by the
 * professional service-listing rules.
 */

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, back: vi.fn() }),
}));

const insert = vi.fn();
const rpc = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "cust-1" } } }),
    },
    rpc: (...args: unknown[]) => rpc(...args),
    from: (table: string) => {
      if (table === "jobs") {
        return {
          insert: (...args: unknown[]) => insert(...args),
        };
      }
      if (table === "categories") {
        return {
          select: () => ({
            order: async () => ({
              data: [{ id: "cat-1", name: "Plumbing" }],
              error: null,
            }),
          }),
        };
      }
      return {};
    },
  }),
}));

import JobForm from "@/components/jobs/JobForm";

describe("customer job posting", () => {
  it("posts a job without any subscription or free-listing check", async () => {
    insert.mockResolvedValueOnce({ data: null, error: null });

    render(<JobForm userId="cust-1" />);

    // Wait for the categories to load into the selector
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Select a category/i })
      ).toBeEnabled()
    );

    fireEvent.change(
      screen.getByPlaceholderText("e.g. Kitchen renovation needed"),
      { target: { value: "Fix my geyser urgently" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Select a category/i }));
    fireEvent.click(await screen.findByText("Plumbing"));
    fireEvent.change(
      screen.getByPlaceholderText(
        "Describe the work you need done, including any requirements, timeline, etc."
      ),
      {
        target: {
          value: "My geyser burst and water is everywhere, need help ASAP.",
        },
      }
    );
    fireEvent.change(screen.getByPlaceholderText("e.g. Cape Town"), {
      target: { value: "Cape Town" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. Western Cape"), {
      target: { value: "Western Cape" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Publish|Post/i }));

    await waitFor(() => expect(insert).toHaveBeenCalled());

    // Job insert payload is untouched by the listing rules
    const payload = (insert.mock.calls[0][0] as Array<Record<string, unknown>>)[0];
    expect(payload.customer_id).toBe("cust-1");
    expect(payload.status).toBe("open");
    expect(payload).not.toHaveProperty("free_listing_used");
    expect(payload).not.toHaveProperty("subscription");

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/my-jobs"));
  });
});

describe("service listing rules do not touch jobs", () => {
  it("the migration creates no trigger or rule on public.jobs", () => {
    const migration = readFileSync(
      path.join(process.cwd(), "supabase/migrations/0015_free_first_service_listing.sql"),
      "utf8"
    );

    expect(migration).not.toMatch(/create trigger[^\n]*on public\.jobs/i);
    expect(migration).not.toMatch(/on public\.jobs\s/i);
  });

  it("the shared rules module only describes services", () => {
    const rules = readFileSync(
      path.join(process.cwd(), "lib/service-listing.ts"),
      "utf8"
    );

    expect(rules).not.toMatch(/jobs/i);
  });
});
