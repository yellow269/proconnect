import { z } from "zod";

export const loginSchema = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(8, "Password must be at least 8 characters") });
export const registerSchema = loginSchema.extend({ fullName: z.string().trim().min(2).max(80), role: z.enum(["customer", "professional"]), confirmPassword: z.string() }).refine((v) => v.password === v.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
export const emailSchema = z.object({ email: z.string().trim().email("Enter a valid email") });
export const resetSchema = z.object({ password: z.string().min(8).max(72), confirmPassword: z.string() }).refine((v) => v.password === v.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
