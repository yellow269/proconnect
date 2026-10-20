import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/0015_free_first_service_listing.sql"
);
const migration = readFileSync(migrationPath, "utf8");

describe("0015 free first service listing migration", () => {
  it("adds a tracking column defaulting to false", () => {
    expect(migration).toMatch(
      /add column if not exists free_listing_used boolean not null default false/
    );
  });

  it("backfills professionals who already have service listings", () => {
    expect(migration).toContain("set free_listing_used = true");
    expect(migration).toMatch(/from public\.services\s+s\s+where s\.professional_id = pp\.user_id/);
  });

  it("does not delete or deactivate any existing rows", () => {
    expect(migration).not.toMatch(/delete\s+from/i);
    expect(migration).not.toMatch(/drop table/i);
    expect(migration).not.toMatch(/set active = false/i);
  });

  it("enforces the rules with a database trigger on service inserts", () => {
    expect(migration).toContain(
      "create trigger services_enforce_listing_rules"
    );
    expect(migration).toMatch(/before insert on public\.services/);
    expect(migration).toContain("for each row");
  });

  it("requires an active, unexpired subscription after the free listing", () => {
    expect(migration).toContain("has_active_subscription");
    expect(migration).toMatch(/status = 'active'/);
    expect(migration).toMatch(/current_period_end > now\(\)/);
  });

  it("raises a recognisable error when the gate rejects an insert", () => {
    expect(migration).toContain("SUBSCRIPTION_REQUIRED");
    expect(migration).toMatch(/raise exception/);
  });

  it("does not touch customer job posting", () => {
    expect(migration).not.toMatch(/on public\.jobs/);
    expect(migration).not.toContain("customer_id");
  });

  it("does not modify or delete existing services", () => {
    expect(migration).not.toMatch(/update public\.services/i);
    expect(migration).not.toMatch(/delete\s+from\s+public\.services/i);
  });

  it("only fires on insert, so editing existing services still works", () => {
    expect(migration).not.toMatch(/before (update|delete) on public\.services/);
  });
});
