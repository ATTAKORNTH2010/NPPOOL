"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { EntityFormDialog } from "@/features/master-data/components/entity-form-dialog";
import { MasterDataTable } from "@/features/master-data/components/master-data-table";
import {
  createVehicleTypeAction,
  deleteVehicleTypeAction,
  setVehicleTypeActiveAction,
  updateVehicleTypeAction,
} from "../actions";
import { vehicleTypeSchema, type VehicleTypeFormValues } from "../schemas";
import type { VehicleTypeRow } from "../service";

const EMPTY: VehicleTypeFormValues = { code: "", name: "", sortOrder: "0" };

export function VehicleTypesManager({ rows }: { rows: VehicleTypeRow[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <MasterDataTable
      rows={rows}
      columns={[
        { header: "ลำดับ", cell: (row) => row.sortOrder, className: "w-16 text-right tabular-nums" },
        { header: "รหัส", cell: (row) => <span className="font-mono">{row.code}</span> },
        { header: "ชื่อประเภทรถ", cell: (row) => <span className="font-medium">{row.name}</span> },
      ]}
      getId={(row) => row.id}
      isActive={(row) => row.isActive}
      searchText={(row) => `${row.code} ${row.name}`}
      describe={(row) => row.name}
      searchPlaceholder="ค้นหารหัสหรือชื่อประเภทรถ"
      toolbar={
        <>
          <Button onClick={() => setCreating(true)}>
            <Plus />
            เพิ่มประเภทรถ
          </Button>
          {creating ? <VehicleTypeFormDialog onClose={() => setCreating(false)} /> : null}
        </>
      }
      renderEdit={(row, close) => <VehicleTypeFormDialog row={row} onClose={close} />}
      setActive={setVehicleTypeActiveAction}
      remove={deleteVehicleTypeAction}
    />
  );
}

function VehicleTypeFormDialog({ row, onClose }: { row?: VehicleTypeRow; onClose: () => void }) {
  return (
    <EntityFormDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={row ? "แก้ไขประเภทรถ" : "เพิ่มประเภทรถ"}
      schema={vehicleTypeSchema}
      defaultValues={row ? { code: row.code, name: row.name, sortOrder: String(row.sortOrder) } : EMPTY}
      submit={(values) => (row ? updateVehicleTypeAction({ ...values, id: row.id }) : createVehicleTypeAction(values))}
    >
      {(form) => (
        <>
          <TextField
            control={form.control}
            name="code"
            label="รหัส"
            description="สั้น ๆ ไม่ซ้ำ ใช้ภาษาไทยหรืออังกฤษได้ เช่น 4W, 6W, 6ล้อ"
          />
          <TextField control={form.control} name="name" label="ชื่อประเภทรถ" placeholder="เช่น รถกระบะ 4 ล้อ" />
          <TextField
            control={form.control}
            name="sortOrder"
            label="ลำดับการแสดง"
            inputMode="numeric"
            description="เลขน้อยแสดงก่อนในรายการให้เลือก"
          />
        </>
      )}
    </EntityFormDialog>
  );
}
