import crypto from "node:crypto";
import { PLANS } from "@/lib/plans";
import { getPayfastConfig } from "@/lib/env";
import type { SubscriptionPlan } from "@/types/database";

const PAYFAST_URL =
  process.env.PAYFAST_URL ??
  "https://sandbox.payfast.co.za/eng/process";

/**
 * PayFast uses PHP's urlencode() behaviour:
 * - spaces => +
 * - uppercase percent encoding
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
 * IMPORTANT:
 * This is NOT alphabetical order.
 * PayFast checkout signatures use the order
 * in which the checkout attributes are documented.
 */
export const CHECKOUT_FIELD_ORDER = [
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

  for (const key of CHECKOUT_FIELD_ORDER) {
    const value = data[key];

    if (value !== undefined && value !== null && value !== "") {
      parts.push(`${key}=${encodeValue(value)}`);
    }
  }

  let parameterString = parts.join("&");

  // PayFast requires the passphrase AFTER the checkout fields.
  if (config.passphrase?.trim()) {
    parameterString += `&passphrase=${encodeValue(
      config.passphrase
    )}`;
  }

  if (debug) {
    console.log("========== PAYFAST SIGNATURE DEBUG ==========");
    console.log("Parameter string:");
    console.log(parameterString);
    console.log("");

    console.log(
      "MD5:",
      crypto.createHash("md5").update(parameterString).digest("hex")
    );

    console.log("============================================");
  }

  return crypto
    .createHash("md5")
    .update(parameterString)
    .digest("hex")
    .toLowerCase();
}

/**
 * Build the data that will actually be sent to PayFast.
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

    // Recurring subscription
    subscription_type: "1",
    billing_date: billingDate,
    recurring_amount: amount,
    frequency: "3",
    cycles: "0",
  };
}

export function getPayFastUrl(): string {
  return PAYFAST_URL;
}