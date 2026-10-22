import { z } from "zod";

export const loginSchema = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(8, "Password must be at least 8 characters") });
export const registerSchema = loginSchema.extend({ fullName: z.string().trim().min(2).max(80), role: z.enum(["customer", "professional"]), confirmPassword: z.string() }).refine((v) => v.password === v.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
export const emailSchema = z.object({ email: z.string().trim().email("Enter a valid email") });

/**
 * Characters that must never appear in a redirect destination. The WHATWG
 * URL parser treats `\` as `/` in special URLs and strips tab/CR/LF before
 * resolving, so `/\evil.com` or `/\t//evil.com` would otherwise pass a naive
 * "starts with / but not //" check and resolve to https://evil.com.
 */
const UNSAFE_REDIRECT_CHARS = /[\\\u0000-\u001F\u007F\u2028\u2029]/;

/**
 * Resolves the post-login redirect destination. Only same-origin absolute
 * paths are honoured (shared with app/auth/callback/route.ts); anything else
 * falls back to the default dashboard so a crafted `next` value can never
 * turn the login form into an open redirect.
 */
export function resolvePostLoginPath(next: string | null | undefined): string {
  if (
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !UNSAFE_REDIRECT_CHARS.test(next)
  ) {
    return next;
  }
  return "/dashboard";
}
export const resetSchema = z.object({ password: z.string().min(8).max(72), confirmPassword: z.string() }).refine((v) => v.password === v.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
