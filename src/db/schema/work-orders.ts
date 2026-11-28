/**
 * Work orders (docs/design/03-database.md sections 3.1, 3.2, 3.4).
 */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { auditColumns, idColumn } from "./columns";
import { customers, drivers, vehicles, vehicleTypes } from "./master-data";

const money = (name: string) => numeric(name, { precision: 14, scale: 2 });

export const workStatuses = pgTable("work_statuses", {
  code: smallint("code").primaryKey(),
  name: text("name").notNull(),
  sortOrder: smallint("sort_order").notNull().default(0),
});

/** One row per month: period = Buddhist year + month in Asia/Bangkok, e.g. "256911" (ADR-0007). */
export const workOrderCounters = pgTable(
  "work_order_counters",
  {
    period: text("period").primaryKey(),
    lastNo: integer("last_no").notNull(),
  },
  (t) => [check("work_order_counters_last_no_check", sql`${t.lastNo} >= 1`)],
);

export const workOrders = pgTable(
  "work_orders",
  {
    id: idColumn(),
    workOrderNo: text("work_order_no").notNull().unique(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id),
    orderedBy: text("ordered_by"),
    statusCode: smallint("status_code")
      .notNull()
      .default(1)
      .references(() => workStatuses.code),
    pickupLocation: text("pickup_location"),
    pickupContactName: text("pickup_contact_name"),
    pickupContactPhone: text("pickup_contact_phone"),
    dropoffLocation: text("dropoff_location"),
    dropoffContactName: text("dropoff_contact_name"),
    dropoffContactPhone: text("dropoff_contact_phone"),
    receiveAt: timestamp("receive_at", { withTimezone: true }),
    deliveryAt: timestamp("delivery_at", { withTimezone: true }),
    customerJobNo: text("customer_job_no"),
    remark: text("remark"),
    transportFee: money("transport_fee"),
    /**
     * Diesel price (whole baht per litre, 25–50) the transport fee was looked
     * up at in the route's price list (D40, 2026-11-28); null when not chosen.
     */
    fuelPrice: smallint("fuel_price"),
    portFee: money("port_fee"),
    demurrageFee: money("demurrage_fee"),
    overnightNights: smallint("overnight_nights").notNull().default(0),
    overnightLaborFee: money("overnight_labor_fee"),
    extraWorkers: smallint("extra_workers").notNull().default(0),
    extraWorkerFee: money("extra_worker_fee"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledBy: text("cancelled_by").references(() => users.id),
    // "ลบใบงาน" hides the row everywhere but keeps it (ADR-0010 addendum, 2026-11-27).
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: text("deleted_by").references(() => users.id),
    ...auditColumns(),
    // A work order is always created and last changed by a signed-in user.
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => users.id),
  },
  (t) => [
    check(
      "work_orders_fees_check",
      sql`coalesce(${t.transportFee}, 0) >= 0 and coalesce(${t.portFee}, 0) >= 0 and coalesce(${t.demurrageFee}, 0) >= 0 and coalesce(${t.overnightLaborFee}, 0) >= 0 and coalesce(${t.extraWorkerFee}, 0) >= 0`,
    ),
    // Same range as route_rates.fuel_price.
    check("work_orders_fuel_price_check", sql`${t.fuelPrice} is null or ${t.fuelPrice} between 25 and 50`),
    check("work_orders_overnight_nights_check", sql`${t.overnightNights} between 0 and 15`),
    check("work_orders_extra_workers_check", sql`${t.extraWorkers} between 0 and 15`),
    check(
      "work_orders_dates_check",
      sql`${t.deliveryAt} is null or ${t.receiveAt} is null or ${t.deliveryAt} >= ${t.receiveAt}`,
    ),
    // Status 2 (ยกเลิก) and cancelled_at always go together (ADR-0010).
    check("work_orders_cancelled_check", sql`(${t.statusCode} = 2) = (${t.cancelledAt} is not null)`),
    check("work_orders_deleted_check", sql`(${t.deletedAt} is null) = (${t.deletedBy} is null)`),
    index("work_orders_customer_id_idx").on(t.customerId),
    index("work_orders_status_code_idx").on(t.statusCode),
    index("work_orders_receive_at_idx").on(t.receiveAt),
  ],
);

export const workOrderVehicles = pgTable(
  "work_order_vehicles",
  {
    id: idColumn(),
    workOrderId: integer("work_order_id")
      .notNull()
      .references(() => workOrders.id, { onDelete: "cascade" }),
    lineNo: smallint("line_no").notNull(),
    vehicleTypeId: integer("vehicle_type_id").references(() => vehicleTypes.id),
    driverId: integer("driver_id").references(() => drivers.id),
    vehicleId: integer("vehicle_id").references(() => vehicles.id),
    driverPhone: text("driver_phone"),
    quantity: numeric("quantity", { precision: 12, scale: 2 }),
    quantityUnit: text("quantity_unit"),
    weight: numeric("weight", { precision: 12, scale: 2 }),
    weightUnit: text("weight_unit"),
    dimensions: text("dimensions"),
  },
  (t) => [
    unique("work_order_vehicles_line_unique").on(t.workOrderId, t.lineNo),
    check("work_order_vehicles_quantity_check", sql`coalesce(${t.quantity}, 0) >= 0`),
    check("work_order_vehicles_weight_check", sql`coalesce(${t.weight}, 0) >= 0`),
    index("work_order_vehicles_driver_id_idx").on(t.driverId),
    index("work_order_vehicles_vehicle_id_idx").on(t.vehicleId),
    index("work_order_vehicles_vehicle_type_id_idx").on(t.vehicleTypeId),
  ],
);
