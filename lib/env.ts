import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

export function getPublicEnv() {
  return publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
}

export function getPayfastConfig() {
  return {
    merchantId: process.env.PAYFAST_MERCHANT_ID ?? "",
    merchantKey: process.env.PAYFAST_MERCHANT_KEY ?? "",
    passphrase: process.env.PAYFAST_PASSPHRASE ?? "",
    returnUrl: process.env.PAYFAST_RETURN_URL ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/dashboard/subscription?status=success`,
    cancelUrl: process.env.PAYFAST_CANCEL_URL ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/dashboard/subscription?status=cancelled`,
    notifyUrl: process.env.PAYFAST_NOTIFY_URL ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/payfast/notify`,
  };
}
