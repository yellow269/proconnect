import crypto from "crypto";
import { PLANS } from "@/lib/plans";
import { getPayfastConfig } from "@/lib/env";
import type { SubscriptionPlan } from "@/types/database";

const PAYFAST_URL =
  process.env.PAYFAST_URL ??
  "https://www.payfast.co.za/eng/process";

/**
 * Matches PHP urlencode():
 * - spaces become +
 * - ~ ! * ' ( ) are percent encoded
 * - percent encoding uses uppercase hex
 */
function encodeValue(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/~/g, "%7E")
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

/**
 * PayFast Custom Integration field order.
 *
 * IMPORTANT:
 * The passphrase is NOT included here.
 * PayFast requires it to be appended LAST.
 */
const CHECKOUT_FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "notify_method",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "currency",
  "payment_method",
  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
  "subscription_notify_email",
  "subscription_notify_webhook",
  "subscription_notify_buyer",
] as const;

/**
 * Generate PayFast checkout signature.
 */
export function generateSignature(
  data: Record<string, string>,
  debug = false
): string {
  const config = getPayfastConfig();

  const parts: string[] = [];

  // Add checkout fields in PayFast's required order.
  for (const key of CHECKOUT_FIELD_ORDER) {
    const value = data[key];

    if (value !== undefined && value !== null && value !== "") {
      parts.push(`${key}=${encodeValue(String(value).trim())}`);
    }
  }

  // IMPORTANT:
  // PayFast requires the passphrase to be added LAST.
  if (config.passphrase && config.passphrase.trim() !== "") {
    parts.push(
      `passphrase=${encodeValue(config.passphrase.trim())}`
    );
  }

  const parameterString = parts.join("&");

  if (debug) {
    console.log("========== PAYFAST SIGNATURE DEBUG ==========");
    console.log("Parameter string:", parameterString);
    console.log("Signature:", crypto
      .createHash("md5")
      .update(parameterString)
      .digest("hex"));
    console.log("=============================================");
  }

  return crypto
    .createHash("md5")
    .update(parameterString)
    .digest("hex");
}

/**
 * Build PayFast checkout parameters.
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
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,

    return_url: config.returnUrl,
    cancel_url: config.cancelUrl,
    notify_url: config.notifyUrl,

    name_first: firstName,
    name_last: lastName,
    email_address: email,

    m_payment_id: paymentId,

    amount,
    item_name: PLANS[plan].name,
    item_description: PLANS[plan].description,

    subscription_type: "1",
    billing_date: billingDate,
    recurring_amount: amount,
    frequency: "3",
    cycles: "0",
  };
}

/**
 * Verify a PayFast ITN signature.
 */
export function verifySignature(
  body: Record<string, string>
): boolean {
  const config = getPayfastConfig();

  const receivedSignature = body.signature;

  if (!receivedSignature) {
    return false;
  }

  const parts: string[] = [];

  // ITN signature must use the received fields,
  // in the order they were posted.
  for (const [key, value] of Object.entries(body)) {
    if (key === "signature") {
      continue;
    }

    if (value !== undefined && value !== null && value !== "") {
      parts.push(
        `${key}=${encodeValue(String(value).trim())}`
      );
    }
  }

  if (config.passphrase && config.passphrase.trim() !== "") {
    parts.push(
      `passphrase=${encodeValue(config.passphrase.trim())}`
    );
  }

  const parameterString = parts.join("&");

  const expectedSignature = crypto
    .createHash("md5")
    .update(parameterString)
    .digest("hex");

  return receivedSignature.toLowerCase() === expectedSignature;
}

export function getPayFastUrl(): string {
  return PAYFAST_URL;
}