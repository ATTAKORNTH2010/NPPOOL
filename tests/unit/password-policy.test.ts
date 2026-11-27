import { describe, expect, it } from "vitest";
import { passwordSchema, usernameSchema } from "@/lib/auth/password-policy";

describe("passwordSchema (AUTH-05)", () => {
  it("accepts a password with upper, lower, digit and symbol of 8+ chars", () => {
    expect(passwordSchema.safeParse("Np-Pool2026").success).toBe(true);
  });

  it.each([
    ["too short", "Ab1!xyz"],
    ["no upper case", "np-pool2026"],
    ["no lower case", "NP-POOL2026"],
    ["no digit", "Np-Pool-x"],
    ["no symbol", "NpPool2026"],
  ])("rejects a password with %s", (_label, value) => {
    expect(passwordSchema.safeParse(value).success).toBe(false);
  });
});

describe("usernameSchema", () => {
  it("accepts a–z, 0–9, underscore and dot (3–30 chars)", () => {
    expect(usernameSchema.safeParse("maker.01").success).toBe(true);
    expect(usernameSchema.safeParse("Admin_1").success).toBe(true);
  });

  it.each(["ab", "a".repeat(31), "ผู้ใช้", "user-01", "user@np"])("rejects %s", (value) => {
    expect(usernameSchema.safeParse(value).success).toBe(false);
  });
});
