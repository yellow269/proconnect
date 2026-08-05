import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validation/auth";

describe("authentication validation", () => {
  it("rejects malformed credentials", () => expect(loginSchema.safeParse({ email: "nope", password: "short" }).success).toBe(false));
  it("accepts a matching registration", () => expect(registerSchema.safeParse({ email: "user@example.com", password: "password123", confirmPassword: "password123", fullName: "Test User", role: "customer" }).success).toBe(true));
});
