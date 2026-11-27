"use client";

import { Plus } from "lucide-react";
import { useId, useState } from "react";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { EntityFormDialog } from "@/features/master-data/components/entity-form-dialog";
import { MasterDataTable } from "@/features/master-data/components/master-data-table";
import { formatMoney } from "@/lib/format";
import { sortByThai } from "@/lib/thai-sort";
import { createRouteAction, deleteRouteAction, setRouteActiveAction, updateRouteAction } from "../actions";
import { routeSchema, type RouteFormValues } from "../schemas";
import type { RouteRow } from "../service";

const EMPTY: RouteFormValues = { pickupLocation: "", dropoffLocation: "", price: "" };

export function RoutesManager({ rows }: { rows: RouteRow[] }) {
  const [creating, setCreating] = useState(false);
  // Both place boxes suggest every place already entered (BR-MD-04).
  const places = sortByThai(
    [...new Set(rows.flatMap((row) => [row.pickupLocation, row.dropoffLocation]))],
    (place) => place,
  );

  return (
    <MasterDataTable
      rows={rows}
      columns={[
        { header: "สถานที่รับ", cell: (row) => row.pickupLocation },
        { header: "สถานที่ส่ง", cell: (row) => row.dropoffLocation },
        { header: "ราคา (บาท)", cell: (row) => formatMoney(row.price), className: "text-right tabular-nums" },
      ]}
      getId={(row) => row.id}
      isActive={(row) => row.isActive}
      searchText={(row) => `${row.pickupLocation} ${row.dropoffLocation}`}
      describe={(row) => `${row.pickupLocation} → ${row.dropoffLocation}`}
      searchPlaceholder="ค้นหาสถานที่รับหรือส่ง"
      toolbar={
        <>
          <Button onClick={() => setCreating(true)}>
            <Plus />
            เพิ่มสถานที่รับ-ส่ง
          </Button>
          {creating ? <RouteFormDialog places={places} onClose={() => setCreating(false)} /> : null}
        </>
      }
      renderEdit={(row, close) => <RouteFormDialog row={row} places={places} onClose={close} />}
      setActive={setRouteActiveAction}
      remove={deleteRouteAction}
    />
  );
}

function RouteFormDialog({ row, places, onClose }: { row?: RouteRow; places: string[]; onClose: () => void }) {
  const listId = useId();
  return (
    <EntityFormDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={row ? "แก้ไขสถานที่รับ-ส่ง" : "เพิ่มสถานที่รับ-ส่ง"}
      schema={routeSchema}
      defaultValues={
        row ? { pickupLocation: row.pickupLocation, dropoffLocation: row.dropoffLocation, price: row.price } : EMPTY
      }
      submit={(values) => (row ? updateRouteAction({ ...values, id: row.id }) : createRouteAction(values))}
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
          <TextField
            control={form.control}
            name="price"
            label="ราคา (บาท)"
            inputMode="decimal"
            description="ไม่ติดลบ ทศนิยมไม่เกิน 2 ตำแหน่ง เช่น 3500 หรือ 3,500.50"
          />
        </>
      )}
    </EntityFormDialog>
  );
}
