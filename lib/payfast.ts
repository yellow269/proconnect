import crypto from "node:crypto";
import { PLANS } from "@/lib/plans";
import { getPayfastConfig } from "@/lib/env";
import type { SubscriptionPlan } from "@/types/database";

const PAYFAST_URL =
  process.env.PAYFAST_URL ??
  "https://sandbox.payfast.co.za/eng/process";

/**
 * PayFast uses PHP urlencode() style encoding.
 */
function encodeValue(value: string): string {
  return encodeURIComponent(value.trim())
    .replace(/%20/g, "+")
    .replace(/~/g, "%7E")
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

/**
 * Checkout fields in the exact order used by buildCheckoutParams().
 *
 * The order matters for the PayFast MD5 signature.
 */
export const CHECKOUT_FIELD_ORDER = [
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

  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",

  "currency",
] as const;

/**
 * Generate the PayFast checkout signature.
 */
export function generateSignature(
  data: Record<string, string>,
  debug = false
): string {
  const config = getPayfastConfig();

  const parts: string[] = [];

  for (const key of CHECKOUT_FIELD_ORDER) {
    const value = data[key];

    if (value === undefined || value === null || value === "") {
      continue;
    }

    parts.push(`${key}=${encodeValue(value)}`);
  }

  let parameterString = parts.join("&");

  const passphrase = config.passphrase?.trim();

  if (passphrase) {
    parameterString +=
      `${parameterString ? "&" : ""}passphrase=${encodeValue(passphrase)}`;
  }

  const signature = crypto
    .createHash("md5")
    .update(parameterString)
    .digest("hex")
    .toLowerCase();

  if (debug) {
    console.log("========== PAYFAST SIGNATURE DEBUG ==========");
    console.log("Parameter string:");
    console.log(parameterString);
    console.log("");
    console.log("Generated MD5:");
    console.log(signature);
    console.log("=============================================");
  }

  return signature;
}

/**
 * Build the exact data sent to PayFast.
 */
export function buildCheckoutParams(
  subscriptionId: string,
  plan: Exclude<SubscriptionPlan, "free">,
  email: string,
  firstName: string,
  lastName: string
): Record<string, string> {
  const config = getPayfastConfig();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const billingDate =
    `${tomorrow.getFullYear()}-` +
    `${String(tomorrow.getMonth() + 1).padStart(2, "0")}-` +
    `${String(tomorrow.getDate()).padStart(2, "0")}`;

  const paymentId = subscriptionId.replace(/-/g, "");

  const amount = Number(PLANS[plan].amount).toFixed(2);

  return {
    merchant_id: config.merchantId.trim(),
    merchant_key: config.merchantKey.trim(),

    return_url: config.returnUrl.trim(),
    cancel_url: config.cancelUrl.trim(),
    notify_url: config.notifyUrl.trim(),

    name_first: firstName.trim(),
    name_last: lastName.trim(),
    email_address: email.trim(),

    m_payment_id: paymentId,

    amount,

    item_name: PLANS[plan].name.trim(),
    item_description: PLANS[plan].description.trim(),

    subscription_type: "1",
    billing_date: billingDate,
    recurring_amount: amount,
    frequency: "3",
    cycles: "0",

    currency: "ZAR",
  };
}

/**
 * Get the PayFast checkout URL.
 */
export function getPayFastUrl(): string {
  return PAYFAST_URL;
}

/**
 * Verify a PayFast ITN signature.
 *
 * IMPORTANT:
 * ITN signatures must use the fields in the order
 * PayFast sent them, excluding the signature itself.
 */
export function verifySignature(
  body: Record<string, string>
): boolean {
  const config = getPayfastConfig();

  const receivedSignature = body.signature;

  if (!receivedSignature) {
    console.error("[PayFast] No signature received");
    return false;
  }

  const parts: string[] = [];

  /**
   * Object.entries() preserves the order in which
   * the PayFast POST fields were parsed.
   */
  for (const [key, rawValue] of Object.entries(body)) {
    if (key === "signature") {
      continue;
    }

    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    const value = String(rawValue).trim();

    if (value === "") {
      continue;
    }

    parts.push(`${key}=${encodeValue(value)}`);
  }

  let parameterString = parts.join("&");

  const passphrase = config.passphrase?.trim();

  if (passphrase) {
    parameterString +=
      `${parameterString ? "&" : ""}passphrase=${encodeValue(passphrase)}`;
  }

  const expectedSignature = crypto
    .createHash("md5")
    .update(parameterString)
    .digest("hex")
    .toLowerCase();

  const received = receivedSignature.trim().toLowerCase();

  console.log("[PayFast] ITN signature verification:", {
    received,
    expected: expectedSignature,
    match: received === expectedSignature,
  });

  return received === expectedSignature;
}