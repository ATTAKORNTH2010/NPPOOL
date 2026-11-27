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
import { createVehicleAction, deleteVehicleAction, setVehicleActiveAction, updateVehicleAction } from "../actions";
import { vehicleSchema, type VehicleFormValues } from "../schemas";
import type { VehicleRow } from "../service";

const EMPTY: VehicleFormValues = { plateNo: "", vehicleTypeId: "" };

export function VehiclesManager({ rows, vehicleTypes }: { rows: VehicleRow[]; vehicleTypes: VehicleTypeRow[] }) {
  const [creating, setCreating] = useState(false);
  const hasActiveType = vehicleTypes.some((type) => type.isActive);

  return (
    <>
      {hasActiveType ? null : (
        <Alert>
          <AlertTitle>ยังไม่มีประเภทรถที่ใช้งานอยู่</AlertTitle>
          <AlertDescription>
            <span>
              เพิ่มประเภทรถก่อน จึงจะเพิ่มรถได้ —{" "}
              <Link href="/master/vehicle-types" className="underline underline-offset-4">
                ไปที่หน้าประเภทรถ
              </Link>
            </span>
          </AlertDescription>
        </Alert>
      )}
      <MasterDataTable
        rows={rows}
        columns={[
          { header: "ทะเบียน", cell: (row) => <span className="font-medium">{row.plateNo}</span> },
          { header: "ประเภทรถ", cell: (row) => row.vehicleTypeName },
        ]}
        getId={(row) => row.id}
        isActive={(row) => row.isActive}
        searchText={(row) => `${row.plateNo} ${row.vehicleTypeName}`}
        describe={(row) => `รถทะเบียน ${row.plateNo}`}
        searchPlaceholder="ค้นหาทะเบียนหรือประเภทรถ"
        toolbar={
          <>
            {hasActiveType ? (
              <Button onClick={() => setCreating(true)}>
                <Plus />
                เพิ่มรถ
              </Button>
            ) : (
              <Link href="/master/vehicle-types" className={buttonVariants({ variant: "outline" })}>
                เพิ่มประเภทรถก่อน
              </Link>
            )}
            {creating ? <VehicleFormDialog vehicleTypes={vehicleTypes} onClose={() => setCreating(false)} /> : null}
          </>
        }
        renderEdit={(row, close) => <VehicleFormDialog row={row} vehicleTypes={vehicleTypes} onClose={close} />}
        setActive={setVehicleActiveAction}
        remove={deleteVehicleAction}
      />
    </>
  );
}

function VehicleFormDialog({
  row,
  vehicleTypes,
  onClose,
}: {
  row?: VehicleRow;
  vehicleTypes: VehicleTypeRow[];
  onClose: () => void;
}) {
  const typeFieldId = useId();
  // Active types, plus the vehicle's current type even if it was deactivated later.
  const items = vehicleTypes
    .filter((type) => type.isActive || type.id === row?.vehicleTypeId)
    .map((type) => ({ value: String(type.id), label: type.isActive ? type.name : `${type.name} (ปิดใช้งาน)` }));

  return (
    <EntityFormDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={row ? "แก้ไขข้อมูลรถ" : "เพิ่มรถ"}
      schema={vehicleSchema}
      defaultValues={row ? { plateNo: row.plateNo, vehicleTypeId: String(row.vehicleTypeId) } : EMPTY}
      submit={(values) => (row ? updateVehicleAction({ ...values, id: row.id }) : createVehicleAction(values))}
    >
      {(form) => (
        <>
          <TextField control={form.control} name="plateNo" label="ทะเบียน" placeholder="เช่น 70-1234 กรุงเทพมหานคร" />
          <Controller
            name="vehicleTypeId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={typeFieldId}>ประเภทรถ</FieldLabel>
                <Select
                  items={items}
                  value={field.value || null}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger id={typeFieldId} className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="เลือกประเภทรถ" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
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
        </>
      )}
    </EntityFormDialog>
  );
}
