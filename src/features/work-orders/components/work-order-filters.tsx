"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { DateRangeField, type DateRangeValue } from "@/components/form/date-range-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { filtersToSearchParams, parseWorkOrderFilters, type WorkOrderFilters } from "../filters";

type TextKey = "no" | "customer" | "orderedBy" | "pickup" | "dropoff" | "vehicle";

const TEXT_FIELDS: { key: TextKey; label: string; placeholder: string }[] = [
  { key: "no", label: "เลขที่ใบงาน", placeholder: "เช่น NP2569" },
  { key: "customer", label: "ผู้ว่าจ้าง", placeholder: "ชื่อบางส่วนก็ได้" },
  { key: "orderedBy", label: "ผู้สั่งงาน", placeholder: "ชื่อผู้สั่งงาน" },
  { key: "pickup", label: "สถานที่รับ", placeholder: "ชื่อสถานที่" },
  { key: "dropoff", label: "สถานที่ส่ง", placeholder: "ชื่อสถานที่" },
  { key: "vehicle", label: "รถ", placeholder: "ทะเบียนหรือประเภทรถ" },
];

const ALL = "all";

/**
 * Search box of the work-order list (WO-16, user request 2026-11-27). The
 * search goes into the URL, so paging, the Excel export and the back button
 * keep it. The page re-mounts this form when the URL changes.
 */
export function WorkOrderFiltersForm({
  filters,
  statuses,
}: {
  filters: WorkOrderFilters;
  statuses: { code: number; name: string }[];
}) {
  const router = useRouter();
  const ids = { status: useId(), receive: useId(), delivery: useId(), feeMin: useId() };
  const [text, setText] = useState<Record<TextKey, string>>({
    no: filters.no ?? "",
    customer: filters.customer ?? "",
    orderedBy: filters.orderedBy ?? "",
    pickup: filters.pickup ?? "",
    dropoff: filters.dropoff ?? "",
    vehicle: filters.vehicle ?? "",
  });
  const [status, setStatus] = useState(filters.status === null ? ALL : String(filters.status));
  const [receive, setReceive] = useState<DateRangeValue>({ from: filters.receiveFrom ?? "", to: filters.receiveTo ?? "" });
  const [delivery, setDelivery] = useState<DateRangeValue>({
    from: filters.deliveryFrom ?? "",
    to: filters.deliveryTo ?? "",
  });
  const [feeMin, setFeeMin] = useState(filters.feeMin ?? "");
  const [feeMax, setFeeMax] = useState(filters.feeMax ?? "");

  const statusItems = [{ value: ALL, label: "ทุกสถานะ" }, ...statuses.map((s) => ({ value: String(s.code), label: s.name }))];

  function search(event: React.FormEvent) {
    event.preventDefault();
    const raw = new URLSearchParams({
      ...text,
      status: status === ALL ? "" : status,
      receiveFrom: receive.from,
      receiveTo: receive.to,
      deliveryFrom: delivery.from,
      deliveryTo: delivery.to,
      feeMin,
      feeMax,
    });
    const query = filtersToSearchParams(parseWorkOrderFilters(raw)).toString();
    router.push(query ? `/work-orders?${query}` : "/work-orders");
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={search} className="grid gap-4" role="search" aria-label="ค้นหาใบงาน">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEXT_FIELDS.slice(0, 3).map((field) => (
              <TextFilter key={field.key} field={field} value={text[field.key]} onChange={(v) => setText({ ...text, [field.key]: v })} />
            ))}
            <Field>
              <FieldLabel htmlFor={ids.status}>สถานะ</FieldLabel>
              <Select items={statusItems} value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
                <SelectTrigger id={ids.status} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {TEXT_FIELDS.slice(3).map((field) => (
              <TextFilter key={field.key} field={field} value={text[field.key]} onChange={(v) => setText({ ...text, [field.key]: v })} />
            ))}
            <Field>
              <FieldLabel htmlFor={ids.feeMin}>ค่าขนส่ง (บาท)</FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id={ids.feeMin}
                  inputMode="decimal"
                  placeholder="ตั้งแต่"
                  value={feeMin}
                  onChange={(event) => setFeeMin(event.target.value)}
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  aria-label="ค่าขนส่งถึง (บาท)"
                  inputMode="decimal"
                  placeholder="ถึง"
                  value={feeMax}
                  onChange={(event) => setFeeMax(event.target.value)}
                />
              </div>
            </Field>
            <Field className="sm:col-span-1 lg:col-span-2">
              <FieldLabel htmlFor={ids.receive}>วันที่รับงาน</FieldLabel>
              <DateRangeField id={ids.receive} value={receive} onChange={setReceive} />
            </Field>
            <Field className="sm:col-span-1 lg:col-span-2">
              <FieldLabel htmlFor={ids.delivery}>วันที่ส่งงาน</FieldLabel>
              <DateRangeField id={ids.delivery} value={delivery} onChange={setDelivery} />
            </Field>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/work-orders")}>
              <X />
              ล้างการค้นหา
            </Button>
            <Button type="submit">
              <Search />
              ค้นหา
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function TextFilter({
  field,
  value,
  onChange,
}: {
  field: { key: TextKey; label: string; placeholder: string };
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
      <Input
        id={id}
        type="search"
        placeholder={field.placeholder}
        value={value}
        maxLength={100}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}
