import crypto from "crypto";
import { PLANS } from "@/lib/plans";
import { getPayfastConfig } from "@/lib/env";
import type { SubscriptionPlan } from "@/types/database";

/**
 * PayFast payment URL.
 *
 * LIVE:
 * https://www.payfast.co.za/eng/process
 *
 * SANDBOX:
 * https://sandbox.payfast.co.za/eng/process
 */
const PAYFAST_URL =
  process.env.PAYFAST_URL ??
  "https://sandbox.payfast.co.za/eng/process";

/**
 * PayFast checkout field order.
 *
 * IMPORTANT:
 * PayFast requires the fields to be used in the order
 * specified by their Custom Integration documentation.
 *
 * The passphrase is NOT included here.
 * It is appended separately at the very end of the
 * signature string.
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
 * PHP urlencode() compatible encoding.
 *
 * PayFast requires:
 * - spaces => +
 * - special characters URL encoded
 * - uppercase hexadecimal encoding
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
 * Generate PayFast MD5 security signature.
 *
 * PayFast's required process:
 *
 * 1. Take all non-empty checkout fields.
 * 2. Keep them in PayFast's documented order.
 * 3. URL encode the values.
 * 4. Join them with "&".
 * 5. Append:
 *
 *      &passphrase=YOUR_PASSPHRASE
 *
 * 6. MD5 the complete string.
 */
export function generateSignature(
  data: Record<string, string>,
  debug = false
): string {
  const config = getPayfastConfig();

  const parts: string[] = [];

  for (const key of CHECKOUT_FIELD_ORDER) {
    const value = data[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      parts.push(
        `${key}=${encodeValue(String(value).trim())}`
      );
    }
  }

  let signatureString = parts.join("&");

  /**
   * IMPORTANT:
   * The passphrase MUST be the final parameter.
   */
  if (config.passphrase && config.passphrase.trim() !== "") {
    signatureString +=
      `&passphrase=${encodeValue(config.passphrase.trim())}`;
  }

  if (debug) {
    console.log(
      "========== PAYFAST SIGNATURE DEBUG =========="
    );

    console.log(
      "Signature fields:",
      parts.map((part) => {
        // Don't expose secrets in logs.
        if (
          part.startsWith("merchant_key=") ||
          part.startsWith("passphrase=")
        ) {
          return "[REDACTED]";
        }

        return part;
      })
    );

    console.log(
      "Passphrase included:",
      Boolean(config.passphrase)
    );

    console.log(
      "Signature string length:",
      signatureString.length
    );

    console.log(
      "Generated signature:",
      crypto
        .createHash("md5")
        .update(signatureString)
        .digest("hex")
    );

    console.log(
      "=============================================="
    );
  }

  return crypto
    .createHash("md5")
    .update(signatureString)
    .digest("hex");
}

/**
 * Build the parameters that will be submitted to PayFast.
 *
 * This is for a recurring subscription.
 */
export function buildCheckoutParams(
  subscriptionId: string,
  plan: Exclude<SubscriptionPlan, "free">,
  email: string,
  firstName: string,
  lastName: string
): Record<string, string> {
  const config = getPayfastConfig();

  /**
   * Start billing tomorrow.
   */
  const tomorrow = new Date();

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  const billingDate =
    `${tomorrow.getFullYear()}-` +
    `${String(tomorrow.getMonth() + 1).padStart(2, "0")}-` +
    `${String(tomorrow.getDate()).padStart(2, "0")}`;

  /**
   * PayFast m_payment_id must be unique.
   */
  const paymentId =
    subscriptionId.replace(/-/g, "");

  const planConfig = PLANS[plan];

  /**
   * Build the actual PayFast checkout fields.
   *
   * IMPORTANT:
   * Do not add PAYFAST_PASSPHRASE here.
   *
   * It is only used when generating the signature.
   */
  const raw: Record<string, string> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,

    return_url: config.returnUrl,
    cancel_url: config.cancelUrl,
    notify_url: config.notifyUrl,

    name_first: firstName,
    name_last: lastName,
    email_address: email,

    m_payment_id: paymentId,

    /**
     * PayFast amount must be a decimal value.
     * Example: "150.00"
     */
    amount: Number(planConfig.amount).toFixed(2),

    item_name: planConfig.name,
    item_description: planConfig.description,

    /**
     * Recurring subscription.
     *
     * 1 = subscription
     * 3 = monthly
     * 0 = indefinite
     */
    subscription_type: "1",

    billing_date: billingDate,

    recurring_amount:
      Number(planConfig.amount).toFixed(2),

    frequency: "3",

    cycles: "0",
  };

  /**
   * Return the fields in PayFast's required order.
   */
  const ordered: Record<string, string> = {};

  for (const key of CHECKOUT_FIELD_ORDER) {
    if (
      raw[key] !== undefined &&
      raw[key] !== null &&
      raw[key] !== ""
    ) {
      ordered[key] = raw[key];
    }
  }

  return ordered;
}

/**
 * Verify a PayFast ITN signature.
 *
 * IMPORTANT:
 * For ITN verification, PayFast says the signature
 * must be generated from ALL fields posted by PayFast,
 * excluding the signature itself.
 *
 * We therefore preserve the incoming object order rather
 * than filtering it through CHECKOUT_FIELD_ORDER.
 */
export function verifySignature(
  body: Record<string, string>
): boolean {
  const config = getPayfastConfig();

  const receivedSignature = body.signature;

  if (!receivedSignature) {
    console.error(
      "[PayFast ITN] Missing signature"
    );

    return false;
  }

  const parts: string[] = [];

  for (const [key, value] of Object.entries(body)) {
    /**
     * Do not include the signature itself.
     */
    if (key === "signature") {
      continue;
    }

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      parts.push(
        `${key}=${encodeValue(String(value).trim())}`
      );
    }
  }

  let signatureString = parts.join("&");

  /**
   * Passphrase must be appended at the end.
   */
  if (config.passphrase && config.passphrase.trim() !== "") {
    signatureString +=
      `&passphrase=${encodeValue(config.passphrase.trim())}`;
  }

  const expectedSignature = crypto
    .createHash("md5")
    .update(signatureString)
    .digest("hex");

  const valid =
    receivedSignature.toLowerCase() ===
    expectedSignature.toLowerCase();

  console.log(
    "[PayFast ITN] Signature valid:",
    valid
  );

  return valid;
}

/**
 * Get the configured PayFast URL.
 */
export function getPayFastUrl(): string {
  return PAYFAST_URL;
}