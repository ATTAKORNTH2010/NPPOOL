import { formatDateTh, formatTimeTh } from "@/lib/format";
import type { WorkOrderDetail } from "../service";
import { WORK_STATUS } from "../statuses";

/**
 * ใบสั่งปฏิบัติงาน (WO-12, ADR-0005 A) laid out like the user's paper form
 * (docs/PrintForm/README.md): A4 landscape, yellow #FFC000 headers, "-" for
 * empty boxes. Several vehicles get one row each. Fields the work order does
 * not have yet (Ref.No, CS Name, AWB No., district/province) print "-".
 */
const DASH = "-";
const MIN_VEHICLE_ROWS = 5;

function show(value: string | null | undefined): string {
  const text = value?.trim();
  return text ? text : DASH;
}

function amount(value: string | null, unit: string | null): string {
  if (value === null) return DASH;
  const number = Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
  return unit ? `${number} ${unit}` : number;
}

function contact(name: string | null, phone: string | null): string {
  return show([name, phone].filter(Boolean).join(" "));
}

const cell = "border border-black px-1.5 py-0.5 align-middle";
const head = `${cell} bg-[#FFC000] text-center font-bold`;

export function JobOrderSheet({ order }: { order: WorkOrderDetail }) {
  const lines = order.vehicles;
  const vehicleRows = Math.max(MIN_VEHICLE_ROWS, lines.length);
  const cargoLines = lines.length > 0 ? lines : [null];
  const cancelled = order.statusCode === WORK_STATUS.CANCELLED;

  return (
    <article className="job-order mx-auto w-[277mm] bg-white text-[11pt] leading-snug text-black">
      <header className="mb-2 flex items-end gap-4">
        <div className="flex w-[70mm] items-baseline gap-1" aria-label="NP POOL GROUP">
          <span className="text-[20pt] font-bold tracking-tight text-[#E06A1B] italic">N.P.</span>
          <span className="text-[20pt] font-bold tracking-tight text-[#1F6F3A] italic">POOL</span>
          <span className="text-[8pt] font-bold text-[#1F6F3A]">GROUP</span>
        </div>
        <h1 className="text-[26pt] leading-none font-bold underline underline-offset-4">ใบสั่งปฏิบัติงาน</h1>
        {cancelled ? (
          <span className="ml-auto rounded border-2 border-red-700 px-3 py-1 text-[14pt] font-bold text-red-700">
            ยกเลิกแล้ว
          </span>
        ) : null}
      </header>

      <div className="grid grid-cols-[95mm_45mm_1fr] gap-[2mm]">
        <table className="w-full border-collapse">
          <tbody>
            <InfoRow label="NP Job No" value={order.workOrderNo} />
            <InfoRow label="DHL Job" value={show(order.customerJobNo)} />
            <InfoRow label="Ref.No" value={DASH} />
            <InfoRow label="ผู้ว่าจ้าง" value={order.customerName} strong />
            <InfoRow label="CS Name" value={DASH} />
          </tbody>
        </table>

        <table className="w-full border-collapse text-center">
          <tbody>
            <tr>
              <th className={`${cell} font-bold`}>วันที่รับ</th>
            </tr>
            <tr>
              <td className={`${cell} h-[9mm] text-[13pt] font-bold`}>{order.receiveAt ? formatDateTh(order.receiveAt) : DASH}</td>
            </tr>
            <tr>
              <th className={`${cell} font-bold`}>เวลารับ</th>
            </tr>
            <tr>
              <td className={`${cell} h-[9mm] text-[13pt] font-bold`}>{order.receiveAt ? formatTimeTh(order.receiveAt) : DASH}</td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse text-center">
          <thead>
            <tr>
              <th className={`${cell} w-[24%] font-bold`}>ประเภทรถ</th>
              <th className={`${cell} w-[42%] font-bold`}>พขร</th>
              <th className={`${cell} font-bold`}>ทะเบียน</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: vehicleRows }, (_, index) => {
              const line = lines[index];
              return (
                <tr key={index} className="h-[6.5mm]">
                  <td className={`${cell} font-bold`}>{line ? show(line.vehicleTypeName) : ""}</td>
                  <td className={cell}>
                    {line ? show([line.driverName, line.driverPhone].filter(Boolean).join(" ")) : ""}
                  </td>
                  <td className={cell}>{line ? show(line.plateNo) : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-[4mm] grid grid-cols-2 gap-[2mm]">
        <Place title="*ต้นทาง*" place={order.pickupLocation} contact={contact(order.pickupContactName, order.pickupContactPhone)} />
        <Place
          title="*ปลายทาง*"
          place={order.dropoffLocation}
          contact={contact(order.dropoffContactName, order.dropoffContactPhone)}
        />
      </div>

      <table className="mt-[4mm] w-full border-collapse text-center">
        <thead>
          <tr>
            <th className={`${head} w-[30%] text-[13pt]`}>AWB No.</th>
            <th className={`${head} w-[12%] text-[13pt]`}>จำนวน</th>
            <th className={`${head} w-[12%] text-[13pt]`}>น้ำหนัก</th>
            <th className={`${head} w-[14%] text-[13pt]`}>ขนาด</th>
            <th className={`${head} text-[13pt]`}>หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {cargoLines.map((line, index) => (
            <tr key={index} className="h-[10mm]">
              <td className={`${cell} font-bold`}>{DASH}</td>
              <td className={`${cell} font-bold`}>{line ? amount(line.quantity, line.quantityUnit) : DASH}</td>
              <td className={`${cell} font-bold`}>{line ? amount(line.weight, line.weightUnit) : DASH}</td>
              <td className={cell}>{line ? show(line.dimensions) : DASH}</td>
              {index === 0 ? (
                <td rowSpan={cargoLines.length} className={`${cell} text-left align-top whitespace-pre-line`}>
                  {show(order.remark)}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <tr className="h-[8mm]">
      <th className={`${cell} w-[26mm] text-left font-bold`}>{label}</th>
      <td className={`${cell} ${strong ? "text-[13pt] font-bold" : ""}`}>{value}</td>
    </tr>
  );
}

function Place({ title, place, contact }: { title: string; place: string | null; contact: string }) {
  return (
    <table className="w-full border-collapse">
      <tbody>
        <tr>
          <th colSpan={2} className={`${head} text-[14pt]`}>
            {title}
          </th>
        </tr>
        <tr>
          <td colSpan={2} className={`${cell} h-[18mm] text-center text-[22pt] leading-tight font-bold`}>
            {show(place)}
          </td>
        </tr>
        <tr>
          <td colSpan={2} className={`${cell} h-[7mm] text-center`}>
            {DASH}
          </td>
        </tr>
        <tr>
          <td colSpan={2} className={`${cell} h-[7mm] text-center`}>
            {DASH}
          </td>
        </tr>
        <tr>
          <th className={`${head} w-[25mm] text-[12pt]`}>ผู้ติดต่อ</th>
          <td className={`${cell} text-[12pt] font-bold`}>{contact}</td>
        </tr>
      </tbody>
    </table>
  );
}
