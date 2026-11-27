"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { EntityFormDialog } from "@/features/master-data/components/entity-form-dialog";
import { MasterDataTable } from "@/features/master-data/components/master-data-table";
import { formatTaxId } from "@/lib/format";
import {
  createCustomerAction,
  deleteCustomerAction,
  setCustomerActiveAction,
  updateCustomerAction,
} from "../actions";
import { customerSchema, type CustomerFormValues } from "../schemas";
import type { CustomerRow } from "../service";

const EMPTY: CustomerFormValues = { name: "", address: "", phone: "", taxId: "" };

export function CustomersManager({ rows }: { rows: CustomerRow[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <MasterDataTable
      rows={rows}
      columns={[
        { header: "ชื่อบริษัท", cell: (row) => <span className="font-medium">{row.name}</span> },
        {
          header: "ที่อยู่",
          cell: (row) => <span className="line-clamp-2 max-w-xs whitespace-normal">{row.address}</span>,
        },
        { header: "เบอร์โทร", cell: (row) => row.phone },
        { header: "เลขผู้เสียภาษี", cell: (row) => formatTaxId(row.taxId), className: "whitespace-nowrap" },
      ]}
      getId={(row) => row.id}
      isActive={(row) => row.isActive}
      searchText={(row) => `${row.name} ${row.address} ${row.phone} ${row.taxId}`}
      describe={(row) => row.name}
      searchPlaceholder="ค้นหาชื่อ ที่อยู่ เบอร์ หรือเลขผู้เสียภาษี"
      toolbar={
        <>
          <Button onClick={() => setCreating(true)}>
            <Plus />
            เพิ่มผู้ว่าจ้าง
          </Button>
          {creating ? <CustomerFormDialog onClose={() => setCreating(false)} /> : null}
        </>
      }
      renderEdit={(row, close) => <CustomerFormDialog row={row} onClose={close} />}
      setActive={setCustomerActiveAction}
      remove={deleteCustomerAction}
    />
  );
}

function CustomerFormDialog({ row, onClose }: { row?: CustomerRow; onClose: () => void }) {
  return (
    <EntityFormDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={row ? "แก้ไขผู้ว่าจ้าง" : "เพิ่มผู้ว่าจ้าง"}
      schema={customerSchema}
      defaultValues={
        row ? { name: row.name, address: row.address, phone: row.phone, taxId: formatTaxId(row.taxId) } : EMPTY
      }
      submit={(values) => (row ? updateCustomerAction({ ...values, id: row.id }) : createCustomerAction(values))}
    >
      {(form) => (
        <>
          <TextField control={form.control} name="name" label="ชื่อบริษัท" />
          <TextField control={form.control} name="address" label="ที่อยู่" multiline />
          <TextField control={form.control} name="phone" label="เบอร์โทรศัพท์" type="tel" inputMode="tel" />
          <TextField
            control={form.control}
            name="taxId"
            label="เลขประจำตัวผู้เสียภาษี"
            inputMode="numeric"
            description="13 หลัก จะพิมพ์ขีดหรือไม่ก็ได้"
          />
        </>
      )}
    </EntityFormDialog>
  );
}
