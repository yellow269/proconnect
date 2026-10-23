import crypto from "node:crypto";

import { PLANS } from "@/lib/plans";
import { getPayfastConfig } from "@/lib/env";
import type { SubscriptionPlan } from "@/types/database";

const PAYFAST_URL =
  process.env.PAYFAST_URL ??
  "https://www.payfast.co.za/eng/process";

/**
 * Encode values using PHP urlencode() conventions required by PayFast.
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
 * PayFast checkout field order.
 *
 * The signature must use the order required by PayFast's
 * custom payment integration, not alphabetical ordering.
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

  "currency",
  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
] as const;

/**
 * Generate the PayFast MD5 checkout signature.
 */
export function generateSignature(
  data: Record<string, string>
): string {
  const config = getPayfastConfig();

  const passphrase = config.passphrase?.trim();

  // PayFast requires a passphrase for recurring subscriptions.
  if (data.subscription_type && !passphrase) {
    throw new Error(
      "PAYFAST_PASSPHRASE is required for recurring subscriptions."
    );
  }

  const parts: string[] = [];

  for (const key of CHECKOUT_FIELD_ORDER) {
    const value = data[key];

    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    ) {
      continue;
    }

    // PayFast's official PHP SDK treats "0" as empty, so a
    // cycles value of "0" (unlimited) is excluded from the
    // signature. It must still be sent in the checkout data.
    if (key === "cycles" && String(value).trim() === "0") {
      continue;
    }

    parts.push(`${key}=${encodeValue(String(value))}`);
  }

  let parameterString = parts.join("&");

  if (passphrase) {
    parameterString +=
      `${parameterString ? "&" : ""}` +
      `passphrase=${encodeValue(passphrase)}`;
  }

  return crypto
    .createHash("md5")
    .update(parameterString)
    .digest("hex")
    .toLowerCase();
}

/**
 * Build the PayFast checkout parameters.
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

    currency: "ZAR",

    subscription_type: "1",
    billing_date: billingDate,
    recurring_amount: amount,
    frequency: "3",
    cycles: "0",
  };
}

/**
 * Return the PayFast checkout URL.
 */
export function getPayFastUrl(): string {
  return PAYFAST_URL;
}

/**
 * Verify the PayFast Instant Transaction Notification signature.
 *
 * The signature is calculated from the received fields,
 * excluding the signature field itself.
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

  for (const [key, rawValue] of Object.entries(body)) {
    if (
      key === "signature" ||
      rawValue === undefined ||
      rawValue === null
    ) {
      continue;
    }

    parts.push(`${key}=${encodeValue(String(rawValue))}`);
  }

  let parameterString = parts.join("&");

  const passphrase = config.passphrase?.trim();

  if (passphrase) {
    parameterString +=
      `${parameterString ? "&" : ""}` +
      `passphrase=${encodeValue(passphrase)}`;
  }

  const expectedSignature = crypto
    .createHash("md5")
    .update(parameterString)
    .digest("hex")
    .toLowerCase();

  return (
    receivedSignature.trim().toLowerCase() ===
    expectedSignature
  );
}