/**
 * Master data (docs/design/03-database.md section 3.3). Rows are deactivated
 * instead of deleted once referenced (ADR-0010).
 */
import { sql } from "drizzle-orm";
import { check, index, integer, numeric, pgTable, smallint, text } from "drizzle-orm/pg-core";
import { auditColumns, idColumn, isActiveColumn } from "./columns";

export const customers = pgTable(
  "customers",
  {
    id: idColumn(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    phone: text("phone").notNull(),
    taxId: text("tax_id").notNull(),
    isActive: isActiveColumn(),
    ...auditColumns(),
  },
  (t) => [index("customers_name_idx").on(t.name)],
);

export const drivers = pgTable(
  "drivers",
  {
    id: idColumn(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone"),
    isActive: isActiveColumn(),
    ...auditColumns(),
  },
  (t) => [index("drivers_name_idx").on(t.firstName, t.lastName)],
);

export const vehicleTypes = pgTable("vehicle_types", {
  id: idColumn(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  sortOrder: smallint("sort_order").notNull().default(0),
  isActive: isActiveColumn(),
  ...auditColumns(),
});

export const vehicles = pgTable(
  "vehicles",
  {
    id: idColumn(),
    plateNo: text("plate_no").notNull().unique(),
    vehicleTypeId: integer("vehicle_type_id")
      .notNull()
      .references(() => vehicleTypes.id),
    isActive: isActiveColumn(),
    ...auditColumns(),
  },
  (t) => [index("vehicles_vehicle_type_id_idx").on(t.vehicleTypeId)],
);

/** คู่สถานที่รับ → ส่ง พร้อมราคา (legacy Location_From_To) */
export const routes = pgTable(
  "routes",
  {
    id: idColumn(),
    pickupLocation: text("pickup_location").notNull(),
    dropoffLocation: text("dropoff_location").notNull(),
    price: numeric("price", { precision: 14, scale: 2 }).notNull(),
    isActive: isActiveColumn(),
    ...auditColumns(),
  },
  (t) => [
    check("routes_price_check", sql`${t.price} >= 0`),
    index("routes_pickup_location_idx").on(t.pickupLocation),
    index("routes_dropoff_location_idx").on(t.dropoffLocation),
  ],
);
