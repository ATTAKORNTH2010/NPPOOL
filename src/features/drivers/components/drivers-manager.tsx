"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { EntityFormDialog } from "@/features/master-data/components/entity-form-dialog";
import { MasterDataTable } from "@/features/master-data/components/master-data-table";
import { createDriverAction, deleteDriverAction, setDriverActiveAction, updateDriverAction } from "../actions";
import { driverSchema, type DriverFormValues } from "../schemas";
import type { DriverRow } from "../service";

const EMPTY: DriverFormValues = { firstName: "", lastName: "", phone: "" };

/** “ชื่อ นามสกุล”, the way dropdowns show a driver (BR-MD-03). */
const fullName = (row: DriverRow) => `${row.firstName} ${row.lastName}`;

export function DriversManager({ rows }: { rows: DriverRow[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <MasterDataTable
      rows={rows}
      columns={[
        { header: "ชื่อ-นามสกุล", cell: (row) => <span className="font-medium">{fullName(row)}</span> },
        { header: "เบอร์โทร", cell: (row) => row.phone || "—" },
      ]}
      getId={(row) => row.id}
      isActive={(row) => row.isActive}
      searchText={(row) => `${fullName(row)} ${row.phone ?? ""}`}
      describe={fullName}
      searchPlaceholder="ค้นหาชื่อ นามสกุล หรือเบอร์โทร"
      toolbar={
        <>
          <Button onClick={() => setCreating(true)}>
            <Plus />
            เพิ่มพนักงานขับรถ
          </Button>
          {creating ? <DriverFormDialog onClose={() => setCreating(false)} /> : null}
        </>
      }
      renderEdit={(row, close) => <DriverFormDialog row={row} onClose={close} />}
      setActive={setDriverActiveAction}
      remove={deleteDriverAction}
    />
  );
}

function DriverFormDialog({ row, onClose }: { row?: DriverRow; onClose: () => void }) {
  return (
    <EntityFormDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={row ? "แก้ไขพนักงานขับรถ" : "เพิ่มพนักงานขับรถ"}
      schema={driverSchema}
      defaultValues={row ? { firstName: row.firstName, lastName: row.lastName, phone: row.phone ?? "" } : EMPTY}
      submit={(values) => (row ? updateDriverAction({ ...values, id: row.id }) : createDriverAction(values))}
    >
      {(form) => (
        <>
          <TextField control={form.control} name="firstName" label="ชื่อ" />
          <TextField control={form.control} name="lastName" label="นามสกุล" />
          <TextField control={form.control} name="phone" label="เบอร์โทร (ไม่บังคับ)" type="tel" inputMode="tel" />
        </>
      )}
    </EntityFormDialog>
  );
}
