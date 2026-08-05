import crypto from "crypto";
import { PLANS } from "@/lib/plans";
import type { SubscriptionPlan } from "@/types/database";

const PAYFAST_URL = process.env.PAYFAST_URL ?? "https://sandbox.payfast.co.za/eng/process";
const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID ?? "";
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY ?? "";
const PASSPHRASE = process.env.PAYFAST_PASSPHRASE ?? "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function encodeValue(v: string): string {
  return encodeURIComponent(v).replace(/%20/g, "+").replace(/!/g, "%21").replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\*/g, "%2A");
}

export function generateSignature(data: Record<string, string>): string {
  const keys = Object.keys(data).filter((k) => k !== "signature" && data[k] !== "" && data[k] !== undefined).sort();

  let str = "";
  for (const key of keys) {
    str += `${key}=${encodeValue(data[key])}&`;
  }
  str = str.slice(0, -1);

  if (PASSPHRASE) {
    str += `&passphrase=${encodeValue(PASSPHRASE)}`;
  }

  return crypto.createHash("md5").update(str).digest("hex");
}

export function buildCheckoutParams(subscriptionId: string, plan: Exclude<SubscriptionPlan, "free">, email: string, firstName: string, lastName: string): Record<string, string> {
  const today = new Date();
  const billingDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return {
    merchant_id: MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    return_url: `${SITE_URL}/dashboard/subscription?status=success`,
    cancel_url: `${SITE_URL}/dashboard/subscription?status=cancelled`,
    notify_url: `${SITE_URL}/api/payfast/notify`,
    m_payment_id: subscriptionId,
    amount: PLANS[plan].amount,
    item_name: PLANS[plan].name,
    item_description: PLANS[plan].description,
    email_address: email,
    name_first: firstName,
    name_last: lastName,
    subscription_type: "1",
    billing_date: billingDate,
    recurring_amount: PLANS[plan].amount,
    frequency: "3",
    cycles: "0",
  };
}

export function verifySignature(body: Record<string, string>): boolean {
  const receivedSignature = body.signature;
  if (!receivedSignature) return false;

  const params = { ...body };
  delete params.signature;

  const keys = Object.keys(params).filter((k) => params[k] !== "" && params[k] !== undefined).sort();

  let str = "";
  for (const key of keys) {
    str += `${key}=${encodeValue(params[key])}&`;
  }
  str = str.slice(0, -1);

  if (PASSPHRASE) {
    str += `&passphrase=${encodeValue(PASSPHRASE)}`;
  }

  const expected = crypto.createHash("md5").update(str).digest("hex");
  return receivedSignature === expected;
}

export function getPayFastUrl(): string {
  return PAYFAST_URL;
}
