import { describe, expect, it } from "vitest";
import { createUserSchema, resetPasswordFormSchema } from "@/features/users/schemas";

const valid = { username: "Maker01", name: "สมหญิง ทดสอบ", phone: "081-234-5678", role: "maker", password: "Maker-Pass1" };

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? [] : (result.error?.issues.map((issue) => issue.message) ?? []);
}

describe("create user form", () => {
  it("accepts a complete user and an empty phone", () => {
    expect(createUserSchema.safeParse(valid).success).toBe(true);
    expect(createUserSchema.safeParse({ ...valid, phone: "" }).success).toBe(true);
  });

  it("explains each problem in Thai", () => {
    expect(messages(createUserSchema.safeParse({ ...valid, username: "สมชาย" }))).toContain("ใช้ได้เฉพาะ a–z, 0–9, _ และ .");
    expect(messages(createUserSchema.safeParse({ ...valid, name: "  " }))).toContain("กรุณากรอกชื่อ-นามสกุล");
    expect(messages(createUserSchema.safeParse({ ...valid, phone: "โทร 081" }))).toContain(
      "เบอร์โทรใช้ได้เฉพาะตัวเลข + - ( ) และช่องว่าง",
    );
    expect(messages(createUserSchema.safeParse({ ...valid, role: "owner" }))).toContain("กรุณาเลือกบทบาท");
    expect(messages(createUserSchema.safeParse({ ...valid, password: "maker-pass1" }))).toContain(
      "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว",
    );
  });
});

describe("reset password form", () => {
  it("requires both fields to match", () => {
    expect(resetPasswordFormSchema.safeParse({ password: "New-Pass1", confirm: "New-Pass1" }).success).toBe(true);
    expect(messages(resetPasswordFormSchema.safeParse({ password: "New-Pass1", confirm: "New-Pass2" }))).toContain(
      "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
    );
  });
});
