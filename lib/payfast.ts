import crypto from "crypto";
import { PLANS } from "@/lib/plans";
import { getPayfastConfig } from "@/lib/env";
import type { SubscriptionPlan } from "@/types/database";

const PAYFAST_URL = process.env.PAYFAST_URL ?? "https://sandbox.payfast.co.za/eng/process";

// Matches PHP's urlencode(): space → +, ~!*'() → %XX, -_. and alphanumeric → as-is
function encodeValue(v: string): string {
  return encodeURIComponent(v)
    .replace(/%20/g, "+")
    .replace(/~/g, "%7E")
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

// Matches official PHP SDK: filters to known fields, uksort by CHECKOUT_FIELD_ORDER
export function generateSignature(data: Record<string, string>, debug = false): string {
  const config = getPayfastConfig();

  // Build attribute map: known PayFast fields only, plus passphrase
  const attrMap: Record<string, string> = {};
  for (const key of Object.keys(data)) {
    if (CHECKOUT_FIELD_ORDER.includes(key)) {
      attrMap[key] = data[key];
    }
  }
  if (config.passphrase && config.passphrase !== "") {
    attrMap["passphrase"] = config.passphrase;
  }

  // Sort by CHECKOUT_FIELD_ORDER (matches PHP SDK's uksort)
  const pfOutput: string[] = [];
  for (const key of CHECKOUT_FIELD_ORDER) {
    const val = attrMap[key];
    if (val !== "" && val !== undefined && val !== null) {
      pfOutput.push(`${key}=${encodeValue(val.trim())}`);
    }
  }

  const getString = pfOutput.join("&");

  if (debug) {
    console.log("========== SIGNATURE DEBUG ==========");
    console.log("attrMap keys:", Object.keys(attrMap));
    console.log("field order used:", CHECKOUT_FIELD_ORDER.filter((k) => k in attrMap));
    console.log("getString:", getString);
    console.log("=====================================");
  }

  return crypto.createHash("md5").update(getString).digest("hex");
}

// PayFast Custom Integration field order (matches official PHP SDK exactly)
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
  "passphrase",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
  "subscription_notify_email",
  "subscription_notify_webhook",
  "subscription_notify_buyer",
];

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
  const billingDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  const paymentId = subscriptionId.replace(/-/g, "");

  // Build in PayFast documentation order
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
    amount: PLANS[plan].amount,
    item_name: PLANS[plan].name,
    item_description: PLANS[plan].description,
    subscription_type: "1",
    billing_date: billingDate,
    recurring_amount: PLANS[plan].amount,
    frequency: "3",
    cycles: "0",
  };

  // Return in documentation order (for correct signature generation)
  const ordered: Record<string, string> = {};
  for (const key of CHECKOUT_FIELD_ORDER) {
    if (raw[key] !== undefined) {
      ordered[key] = raw[key];
    }
  }

  return ordered;
}

// ITN verification: same logic as generateSignature per PHP SDK
export function verifySignature(body: Record<string, string>): boolean {
  const config = getPayfastConfig();
  const receivedSignature = body.signature;
  if (!receivedSignature) return false;

  // Build attribute map: known PayFast fields only (skip signature), plus passphrase
  const attrMap: Record<string, string> = {};
  for (const key of Object.keys(body)) {
    if (key === "signature") continue;
    if (CHECKOUT_FIELD_ORDER.includes(key)) {
      attrMap[key] = body[key];
    }
  }
  if (config.passphrase && config.passphrase !== "") {
    attrMap["passphrase"] = config.passphrase;
  }

  // Sort by CHECKOUT_FIELD_ORDER (matches PHP SDK's uksort)
  const pfOutput: string[] = [];
  for (const key of CHECKOUT_FIELD_ORDER) {
    const val = attrMap[key];
    if (val !== "" && val !== undefined && val !== null) {
      pfOutput.push(`${key}=${encodeValue(val.trim())}`);
    }
  }

  const getString = pfOutput.join("&");
  const expected = crypto.createHash("md5").update(getString).digest("hex");
  return receivedSignature === expected;
}

export function getPayFastUrl(): string {
  return PAYFAST_URL;
}
