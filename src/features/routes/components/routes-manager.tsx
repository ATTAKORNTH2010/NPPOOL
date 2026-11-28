"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Controller } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityFormDialog } from "@/features/master-data/components/entity-form-dialog";
import { MasterDataTable } from "@/features/master-data/components/master-data-table";
import type { VehicleTypeRow } from "@/features/vehicle-types/service";
import { formatMoney } from "@/lib/format";
import { sortByThai } from "@/lib/thai-sort";
import { createRouteAction, deleteRouteAction, setRouteActiveAction, updateRouteAction } from "../actions";
import { routeDialogSchema, type RouteDialogValues, type RouteFormValues } from "../schemas";
import type { RouteRow } from "../service";
import { RouteRatesField } from "./route-rates-field";

const EMPTY: RouteDialogValues = { pickupLocation: "", dropoffLocation: "", vehicleTypeId: "", rates: [], draftPrice: "" };

/** A route saved before 2026-11-28: one price, no vehicle type, no prices by fuel price. */
const isLegacy = (row: RouteRow) => row.rates.length === 0 || row.vehicleTypeId === null;

export function RoutesManager({ rows, vehicleTypes }: { rows: RouteRow[]; vehicleTypes: VehicleTypeRow[] }) {
  const [creating, setCreating] = useState(false);
  const hasActiveType = vehicleTypes.some((type) => type.isActive);
  const legacyCount = rows.filter(isLegacy).length;
  // Both place boxes suggest every place already entered (BR-MD-04).
  const places = sortByThai(
    [...new Set(rows.flatMap((row) => [row.pickupLocation, row.dropoffLocation]))],
    (place) => place,
  );

  return (
    <>
      {hasActiveType ? null : (
        <Alert>
          <AlertTitle>ยังไม่มีประเภทรถที่ใช้งานอยู่</AlertTitle>
          <AlertDescription>
            <span>
              สถานที่รับ-ส่งต้องระบุประเภทรถ เพิ่มประเภทรถก่อน —{" "}
              <Link href="/master/vehicle-types" className="underline underline-offset-4">
                ไปที่หน้าประเภทรถ
              </Link>
            </span>
          </AlertDescription>
        </Alert>
      )}
      {legacyCount > 0 ? (
        <Alert>
          <AlertTitle>มี {legacyCount.toLocaleString("th-TH")} เส้นทางที่ยังเป็นข้อมูลแบบเดิม</AlertTitle>
          <AlertDescription>
            ยังไม่ระบุประเภทรถหรือราคาตามราคาน้ำมัน กดแก้ไขแต่ละเส้นทางเพื่อเพิ่ม ระหว่างนี้ใบงานยังใช้ราคาเดิมได้ตามปกติ
          </AlertDescription>
        </Alert>
      ) : null}
      <MasterDataTable
        rows={rows}
        columns={[
          { header: "สถานที่รับ", cell: (row) => row.pickupLocation },
          { header: "สถานที่ส่ง", cell: (row) => row.dropoffLocation },
          { header: "ประเภทรถ", cell: (row) => <VehicleTypeCell row={row} /> },
          { header: "ราคาขนส่ง (บาท)", cell: (row) => <PriceCell row={row} />, className: "text-right tabular-nums" },
        ]}
        getId={(row) => row.id}
        isActive={(row) => row.isActive}
        searchText={(row) => `${row.pickupLocation} ${row.dropoffLocation} ${row.vehicleTypeName ?? ""}`}
        describe={(row) => `${row.pickupLocation} → ${row.dropoffLocation}`}
        searchPlaceholder="ค้นหาสถานที่รับ สถานที่ส่ง หรือประเภทรถ"
        toolbar={
          <>
            {hasActiveType ? (
              <Button onClick={() => setCreating(true)}>
                <Plus />
                เพิ่มสถานที่รับ-ส่ง
              </Button>
            ) : (
              <Link href="/master/vehicle-types" className={buttonVariants({ variant: "outline" })}>
                เพิ่มประเภทรถก่อน
              </Link>
            )}
            {creating ? (
              <RouteFormDialog places={places} vehicleTypes={vehicleTypes} onClose={() => setCreating(false)} />
            ) : null}
          </>
        }
        renderEdit={(row, close) => (
          <RouteFormDialog row={row} places={places} vehicleTypes={vehicleTypes} onClose={close} />
        )}
        setActive={setRouteActiveAction}
        remove={deleteRouteAction}
      />
    </>
  );
}

function VehicleTypeCell({ row }: { row: RouteRow }) {
  if (!row.vehicleTypeName) return <span className="text-muted-foreground">ยังไม่ระบุ</span>;
  return row.vehicleTypeActive === false ? `${row.vehicleTypeName} (ปิดใช้งาน)` : row.vehicleTypeName;
}

/** One price, or the lowest–highest with how many fuel prices it covers. */
function PriceCell({ row }: { row: RouteRow }) {
  const { rates } = row;
  if (rates.length === 0) {
    if (!row.legacyPrice) return <span className="text-muted-foreground">—</span>;
    return (
      <>
        {formatMoney(row.legacyPrice)}
        <span className="block text-xs text-muted-foreground">ราคาเดิม</span>
      </>
    );
  }
  const first = rates[0];
  const last = rates[rates.length - 1];
  if (!first || !last) return null;
  if (rates.length === 1) {
    return (
      <>
        {formatMoney(first.price)}
        <span className="block text-xs text-muted-foreground">น้ำมัน {first.fuelPrice} บาท</span>
      </>
    );
  }
  // Display only: the strings are compared as numbers, never added up.
  const sorted = rates.map((rate) => rate.price).sort((a, b) => Number(a) - Number(b));
  const low = sorted[0] ?? first.price;
  const high = sorted[sorted.length - 1] ?? last.price;
  return (
    <>
      {low === high ? formatMoney(low) : `${formatMoney(low)} – ${formatMoney(high)}`}
      <span className="block text-xs text-muted-foreground">
        {rates.length} ราคา · น้ำมัน {first.fuelPrice}–{last.fuelPrice} บาท
      </span>
    </>
  );
}

function toDialogValues(row: RouteRow): RouteDialogValues {
  return {
    pickupLocation: row.pickupLocation,
    dropoffLocation: row.dropoffLocation,
    vehicleTypeId: row.vehicleTypeId === null ? "" : String(row.vehicleTypeId),
    rates: row.rates.map((rate) => ({ fuelPrice: String(rate.fuelPrice), price: rate.price })),
    // An old route offers its single price in the add row, ready to file under a fuel price.
    draftPrice: row.rates.length === 0 && row.legacyPrice ? row.legacyPrice : "",
  };
}

function RouteFormDialog({
  row,
  places,
  vehicleTypes,
  onClose,
}: {
  row?: RouteRow;
  places: string[];
  vehicleTypes: VehicleTypeRow[];
  onClose: () => void;
}) {
  const listId = useId();
  const typeFieldId = useId();
  // Active types, plus the route's current type even if it was deactivated later.
  const typeItems = vehicleTypes
    .filter((type) => type.isActive || type.id === row?.vehicleTypeId)
    .map((type) => ({ value: String(type.id), label: type.isActive ? type.name : `${type.name} (ปิดใช้งาน)` }));

  // The add row's draft stays in the browser; the server gets the route and its list.
  function submit(values: RouteDialogValues) {
    const route: RouteFormValues = {
      pickupLocation: values.pickupLocation,
      dropoffLocation: values.dropoffLocation,
      vehicleTypeId: values.vehicleTypeId,
      rates: values.rates,
    };
    return row ? updateRouteAction({ ...route, id: row.id }) : createRouteAction(route);
  }

  return (
    <EntityFormDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={row ? "แก้ไขสถานที่รับ-ส่ง" : "เพิ่มสถานที่รับ-ส่ง"}
      schema={routeDialogSchema}
      defaultValues={row ? toDialogValues(row) : EMPTY}
      submit={submit}
      className="sm:max-w-lg"
    >
      {(form) => (
        <>
          <datalist id={listId}>
            {places.map((place) => (
              <option key={place} value={place} />
            ))}
          </datalist>
          <TextField control={form.control} name="pickupLocation" label="สถานที่รับ" list={listId} />
          <TextField control={form.control} name="dropoffLocation" label="สถานที่ส่ง" list={listId} />
          <Controller
            name="vehicleTypeId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={typeFieldId}>ประเภทรถ</FieldLabel>
                <Select items={typeItems} value={field.value || null} onValueChange={(value) => field.onChange(value ?? "")}>
                  <SelectTrigger id={typeFieldId} ref={field.ref} className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="เลือกประเภทรถ" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <RouteRatesField
            control={form.control}
            legacyPrice={row && row.rates.length === 0 ? row.legacyPrice : null}
          />
        </>
      )}
    </EntityFormDialog>
  );
}
