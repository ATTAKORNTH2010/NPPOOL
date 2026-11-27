import { db } from "@/db/client";
import { logActivity } from "@/features/activity/log";
import { buildWorkOrdersWorkbook, exportFileName, XLSX_MIME } from "@/features/work-orders/export-xlsx";
import { activeFilterCount, parseWorkOrderFilters } from "@/features/work-orders/filters";
import { exportWorkOrders } from "@/features/work-orders/service";
import { getCurrentUser } from "@/lib/dal";
import { hasPermission } from "@/lib/permissions";

/**
 * GET /api/work-orders/export?<the list's search> → .xlsx of every matching
 * work order (user request 2026-11-27). Answers JSON errors instead of
 * redirecting, because the list page downloads it with fetch().
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ message: "หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  }
  if (!hasPermission(user.role, "workOrder.export")) {
    return Response.json({ message: "คุณไม่มีสิทธิ์ส่งออกข้อมูลใบงาน" }, { status: 403 });
  }

  const url = new URL(request.url);
  const filters = parseWorkOrderFilters(url.searchParams);
  const now = new Date();
  const { orders, truncated } = await exportWorkOrders(db, filters);
  const file = await buildWorkOrdersWorkbook(orders);

  const searched = activeFilterCount(filters);
  logActivity(
    {
      userId: user.id,
      module: "workOrders",
      action: "export",
      detail: `ส่งออก Excel ${orders.length} ใบ${searched > 0 ? ` (ค้นหา ${searched} เงื่อนไข)` : " (ทั้งหมด)"}`,
      path: `${url.pathname}${url.search}`,
    },
    request.headers,
  );

  return new Response(file.buffer as ArrayBuffer, {
    headers: {
      "content-type": XLSX_MIME,
      "content-disposition": `attachment; filename="${exportFileName(now)}"`,
      "cache-control": "no-store",
      "x-export-count": String(orders.length),
      "x-export-truncated": truncated ? "1" : "0",
    },
  });
}
