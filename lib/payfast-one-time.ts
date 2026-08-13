import crypto from "node:crypto";
import { getPayfastConfig } from "@/lib/env";

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

const ONE_TIME_FIELD_ORDER = [
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
] as const;

export function generateOneTimeSignature(
  data: Record<string, string>
): string {
  const config = getPayfastConfig();
  const parts: string[] = [];

  for (const key of ONE_TIME_FIELD_ORDER) {
    const value = data[key];
    if (!value) continue;
    parts.push(`${key}=${encodeValue(String(value))}`);
  }

  let parameterString = parts.join("&");
  const passphrase = config.passphrase?.trim();
  if (passphrase) {
    parameterString += `${parameterString ? "&" : ""}passphrase=${encodeValue(passphrase)}`;
  }

  return crypto
    .createHash("md5")
    .update(parameterString)
    .digest("hex")
    .toLowerCase();
}

export function buildBookingCheckoutParams(
  bookingId: string,
  amount: number,
  serviceName: string,
  email: string,
  firstName: string,
  lastName: string
): Record<string, string> {
  const config = getPayfastConfig();
  const paymentId = bookingId.replace(/-/g, "");

  return {
    merchant_id: config.merchantId.trim(),
    merchant_key: config.merchantKey.trim(),
    return_url: config.returnUrl.trim(),
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/professional/bookings?payment=cancelled`,
    notify_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/payfast/booking-notify`,
    name_first: firstName.trim(),
    name_last: lastName.trim(),
    email_address: email.trim(),
    m_payment_id: paymentId,
    amount: Number(amount).toFixed(2),
    item_name: serviceName.trim(),
    item_description: `Booking payment for ${serviceName}`,
    currency: "ZAR",
  };
}

export function getPayFastUrl(): string {
  return (
    process.env.PAYFAST_URL ??
    "https://www.payfast.co.za/eng/process"
  );
}
