import { describe, expect, it } from "vitest";
import { actionLabel, describePage, moduleLabel } from "@/features/activity/catalog";
import { requestInfo } from "@/features/activity/request-info";

// ADR-0012: which page views are logged, and under which function.
describe("activity catalog", () => {
  it("maps app pages to a function and a page name", () => {
    expect(describePage("/work-orders")).toEqual({ module: "workOrders", action: "view", name: "รายการใบงาน", entityId: null });
    expect(describePage("/work-orders/12/edit")).toEqual({
      module: "workOrders",
      action: "view",
      name: "แก้ไขใบงาน",
      entityId: "12",
    });
    expect(describePage("/work-orders/12/print")).toMatchObject({ action: "print", entityId: "12" });
    expect(describePage("/master/vehicle-types")).toMatchObject({ module: "vehicleTypes" });
    expect(describePage("/admin/activity")).toMatchObject({ module: "activity" });
  });

  it("ignores anything else", () => {
    for (const path of ["/login", "/api/activity", "/work-orders/abc", "/work-orders/1/delete", "/x"]) {
      expect(describePage(path)).toBeNull();
    }
  });

  it("labels stored keys in Thai and keeps unknown keys readable", () => {
    expect(moduleLabel("workOrders")).toBe("ใบงาน");
    expect(actionLabel("loginFailed")).toBe("เข้าสู่ระบบไม่สำเร็จ");
    expect(moduleLabel("legacy")).toBe("legacy");
  });

  it("takes the client address Vercel forwards", () => {
    expect(requestInfo(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1", "user-agent": "UA" }))).toEqual({
      ipAddress: "203.0.113.7",
      userAgent: "UA",
    });
    expect(requestInfo(new Headers({ "x-real-ip": "198.51.100.2" })).ipAddress).toBe("198.51.100.2");
    expect(requestInfo(null)).toEqual({ ipAddress: null, userAgent: null });
  });
});
