import crypto from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildCheckoutParams,
  generateSignature,
} from "@/lib/payfast";

const SUBSCRIPTION_ID = "123e4567-e89b-12d3-a456-426614174000";

const ENV_KEYS = [
  "PAYFAST_MERCHANT_ID",
  "PAYFAST_MERCHANT_KEY",
  "PAYFAST_PASSPHRASE",
  "PAYFAST_RETURN_URL",
  "PAYFAST_CANCEL_URL",
  "PAYFAST_NOTIFY_URL",
] as const;

const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]])
);

/** Minimal PHP urlencode equivalent for the ASCII values used here. */
function phpUrlencode(value: string): string {
  return encodeURIComponent(value.trim()).replace(/%20/g, "+");
}

function md5(value: string): string {
  return crypto.createHash("md5").update(value).digest("hex");
}

/** Checkout data for a monthly subscription with explicit control over cycles. */
function checkoutData(
  cycles: string
): Record<string, string> {
  return {
    merchant_id: "10000100",
    merchant_key: "46f3cf",

    return_url: "https://example.com/success",
    cancel_url: "https://example.com/cancel",
    notify_url: "https://example.com/notify",

    name_first: "Test",
    name_last: "User",
    email_address: "test@example.com",

    m_payment_id: "abc123",
    amount: "50.00",

    item_name: "ProConnect Professional",
    item_description: "Unlimited service listings",

    currency: "ZAR",

    subscription_type: "1",
    billing_date: "2026-10-24",
    recurring_amount: "50.00",
    frequency: "3",
    cycles,
  };
}

/**
 * Reference signature calculation, written independently of
 * lib/payfast.ts: ordered key=value pairs, passphrase appended,
 * cycles excluded when it is "0".
 */
function referenceSignature(
  data: Record<string, string>,
  passphrase: string
): string {
  const orderedKeys = [
    "merchant_id",
    "merchant_key",
    "return_url",
    "cancel_url",
    "notify_url",
    "name_first",
    "name_last",
    "email_address",
    "m_payment_id",
    "amount",
    "item_name",
    "item_description",
    "currency",
    "subscription_type",
    "billing_date",
    "recurring_amount",
    "frequency",
    "cycles",
  ];

  const parts: string[] = [];

  for (const key of orderedKeys) {
    const value = data[key];

    if (value === undefined || value.trim() === "") {
      continue;
    }

    if (key === "cycles" && value.trim() === "0") {
      continue;
    }

    parts.push(`${key}=${phpUrlencode(value)}`);
  }

  parts.push(`passphrase=${phpUrlencode(passphrase)}`);

  return md5(parts.join("&"));
}

beforeEach(() => {
  process.env.PAYFAST_MERCHANT_ID = "10000100";
  process.env.PAYFAST_MERCHANT_KEY = "46f3cf";
  process.env.PAYFAST_PASSPHRASE = "testpass";
  process.env.PAYFAST_RETURN_URL = "https://example.com/success";
  process.env.PAYFAST_CANCEL_URL = "https://example.com/cancel";
  process.env.PAYFAST_NOTIFY_URL = "https://example.com/notify";
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];

    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("generateSignature cycles handling", () => {
  it("keeps cycles: \"0\" in the checkout data", () => {
    const data = buildCheckoutParams(
      SUBSCRIPTION_ID,
      "pro",
      "test@example.com",
      "Test",
      "User"
    );

    expect(data.cycles).toBe("0");
    expect(Object.keys(data)).toContain("cycles");
  });

  it("excludes cycles=\"0\" from the signature", () => {
    const withUnlimitedCycles = checkoutData("0");
    const withoutCyclesKey = checkoutData("0");
    delete withoutCyclesKey.cycles;

    // An unlimited subscription signs exactly as if cycles were absent.
    expect(generateSignature(withUnlimitedCycles)).toBe(
      generateSignature(withoutCyclesKey)
    );
    expect(generateSignature(withUnlimitedCycles)).toBe(
      referenceSignature(withUnlimitedCycles, "testpass")
    );
  });

  it("includes a non-zero cycles value in the signature", () => {
    const oneCycle = checkoutData("1");
    const twoCycles = checkoutData("2");
    const withoutCyclesKey = checkoutData("1");
    delete withoutCyclesKey.cycles;

    const oneCycleSignature = generateSignature(oneCycle);

    expect(oneCycleSignature).not.toBe(generateSignature(twoCycles));
    expect(oneCycleSignature).not.toBe(
      generateSignature(withoutCyclesKey)
    );
    expect(oneCycleSignature).toBe(
      referenceSignature(oneCycle, "testpass")
    );
  });

  it("signs the checkout params produced by buildCheckoutParams", () => {
    const data = buildCheckoutParams(
      SUBSCRIPTION_ID,
      "pro",
      "test@example.com",
      "Test",
      "User"
    );

    // buildCheckoutParams sets cycles: "0" for the unlimited
    // monthly plan, so the signature must match the reference
    // calculation that omits cycles.
    expect(generateSignature(data)).toBe(
      referenceSignature(data, "testpass")
    );
  });
});
