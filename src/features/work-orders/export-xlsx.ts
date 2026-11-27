import "server-only";

import writeXlsxFile, { type Cell, type Row } from "write-excel-file/node";
import { formatDateTh } from "@/lib/format";
import type { WorkOrderDetail } from "./service";

/**
 * Excel export of the work-order search (user request 2026-11-27). Sheet 1 has
 * one row per work order with every field; sheet 2 has one row per vehicle.
 * Dates are real Excel dates in Thai time (Excel shows them in its own
 * calendar setting); money is a number formatted #,##0.00.
 */
export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const DATE_TIME = "dd/mm/yyyy hh:mm";
const MONEY = "#,##0.00";
const HEADER_FILL = "#FFC000"; // the yellow of the printed job order

/** Excel dates have no time zone: write the Thai wall-clock time. */
function excelDate(value: Date | null): Cell {
  return value ? { type: Date, value: new Date(value.getTime() + BANGKOK_OFFSET_MS), format: DATE_TIME } : null;
}

function money(value: string | null): Cell {
  return value === null ? null : { type: Number, value: Number(value), format: MONEY };
}

function amount(value: string | null): Cell {
  return value === null ? null : { type: Number, value: Number(value) };
}

function text(value: string | null | undefined): Cell {
  return value ? { type: String, value } : null;
}

function header(titles: string[]): Row {
  return titles.map((value) => ({ value, fontWeight: "bold", backgroundColor: HEADER_FILL, align: "center" }));
}

function vehicleSummary(order: WorkOrderDetail): string {
  return order.vehicles
    .map((line) => [line.vehicleTypeName, line.plateNo, line.driverName].filter(Boolean).join(" "))
    .filter(Boolean)
    .join("; ");
}

const ORDER_COLUMNS: [title: string, width: number, cell: (order: WorkOrderDetail) => Cell][] = [
  ["เลขที่ใบงาน", 16, (o) => text(o.workOrderNo)],
  ["สถานะ", 14, (o) => text(o.statusName)],
  ["ผู้ว่าจ้าง", 30, (o) => text(o.customerName)],
  ["ผู้สั่งงาน", 18, (o) => text(o.orderedBy)],
  ["สถานที่รับ", 28, (o) => text(o.pickupLocation)],
  ["ผู้ติดต่อ (ฝั่งรับ)", 18, (o) => text(o.pickupContactName)],
  ["เบอร์โทร (ฝั่งรับ)", 15, (o) => text(o.pickupContactPhone)],
  ["สถานที่ส่ง", 28, (o) => text(o.dropoffLocation)],
  ["ผู้ติดต่อ (ฝั่งส่ง)", 18, (o) => text(o.dropoffContactName)],
  ["เบอร์โทร (ฝั่งส่ง)", 15, (o) => text(o.dropoffContactPhone)],
  ["ค่าขนส่ง (บาท)", 14, (o) => money(o.transportFee)],
  ["วันเวลารับงาน", 17, (o) => excelDate(o.receiveAt)],
  ["วันเวลาส่งงาน", 17, (o) => excelDate(o.deliveryAt)],
  ["Job No., Shipment", 18, (o) => text(o.customerJobNo)],
  ["Remark", 30, (o) => text(o.remark)],
  ["จำนวนรถ", 9, (o) => ({ type: Number, value: o.vehicles.length })],
  ["รถ (ประเภท ทะเบียน คนขับ)", 40, (o) => text(vehicleSummary(o))],
  ["ค่าผ่านท่า (บาท)", 14, (o) => money(o.portFee)],
  ["ค่าเสียเวลา (บาท)", 14, (o) => money(o.demurrageFee)],
  ["จำนวนคืน", 9, (o) => ({ type: Number, value: o.overnightNights })],
  ["ค่าแรงค้างคืน (บาท)", 15, (o) => money(o.overnightLaborFee)],
  ["จำนวนคน", 9, (o) => ({ type: Number, value: o.extraWorkers })],
  ["ค่าแรงคน (บาท)", 14, (o) => money(o.extraWorkerFee)],
  ["สร้างโดย", 18, (o) => text(o.createdByName)],
  ["สร้างเมื่อ", 17, (o) => excelDate(o.createdAt)],
  ["แก้ไขล่าสุดโดย", 18, (o) => text(o.updatedByName)],
  ["แก้ไขล่าสุดเมื่อ", 17, (o) => excelDate(o.updatedAt)],
  ["ยกเลิกโดย", 18, (o) => text(o.cancelledByName)],
  ["ยกเลิกเมื่อ", 17, (o) => excelDate(o.cancelledAt)],
];

type LineOf = WorkOrderDetail["vehicles"][number];

const LINE_COLUMNS: [title: string, width: number, cell: (order: WorkOrderDetail, line: LineOf) => Cell][] = [
  ["เลขที่ใบงาน", 16, (o) => text(o.workOrderNo)],
  ["สถานะ", 14, (o) => text(o.statusName)],
  ["ผู้ว่าจ้าง", 30, (o) => text(o.customerName)],
  ["วันเวลารับงาน", 17, (o) => excelDate(o.receiveAt)],
  ["สถานที่รับ", 28, (o) => text(o.pickupLocation)],
  ["สถานที่ส่ง", 28, (o) => text(o.dropoffLocation)],
  ["คันที่", 7, (_, l) => ({ type: Number, value: l.lineNo })],
  ["ประเภทรถ", 14, (_, l) => text(l.vehicleTypeName)],
  ["ทะเบียน", 14, (_, l) => text(l.plateNo)],
  ["พนักงานขับรถ", 22, (_, l) => text(l.driverName)],
  ["เบอร์ พขร.", 15, (_, l) => text(l.driverPhone)],
  ["จำนวน", 10, (_, l) => amount(l.quantity)],
  ["หน่วย", 9, (_, l) => text(l.quantityUnit)],
  ["น้ำหนัก", 10, (_, l) => amount(l.weight)],
  ["หน่วยน้ำหนัก", 11, (_, l) => text(l.weightUnit)],
  ["ขนาด", 16, (_, l) => text(l.dimensions)],
];

export async function buildWorkOrdersWorkbook(orders: WorkOrderDetail[]): Promise<Uint8Array> {
  const orderRows: Row[] = [header(ORDER_COLUMNS.map(([title]) => title))];
  for (const order of orders) orderRows.push(ORDER_COLUMNS.map(([, , cell]) => cell(order)));

  const lineRows: Row[] = [header(LINE_COLUMNS.map(([title]) => title))];
  for (const order of orders) {
    for (const line of order.vehicles) lineRows.push(LINE_COLUMNS.map(([, , cell]) => cell(order, line)));
  }

  const buffer = await writeXlsxFile(
    [
      {
        data: orderRows,
        sheet: "ใบงาน",
        columns: ORDER_COLUMNS.map(([, width]) => ({ width })),
        stickyRowsCount: 1,
      },
      {
        data: lineRows,
        sheet: "รถในใบงาน",
        columns: LINE_COLUMNS.map(([, width]) => ({ width })),
        stickyRowsCount: 1,
      },
    ],
    { fontFamily: "Tahoma", fontSize: 10 },
  ).toBuffer();
  return new Uint8Array(buffer);
}

/** work-orders_25691127-1430.xlsx (Thai date and time of the export). */
export function exportFileName(now: Date): string {
  const shifted = new Date(now.getTime() + BANGKOK_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = formatDateTh(now).split("/").reverse().join("");
  return `work-orders_${day}-${pad(shifted.getUTCHours())}${pad(shifted.getUTCMinutes())}.xlsx`;
}
