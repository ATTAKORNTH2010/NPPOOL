CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limits_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"username" text,
	"display_username" text,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"phone" text,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "customers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"address" text NOT NULL,
	"phone" text NOT NULL,
	"tax_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "drivers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "routes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"pickup_location" text NOT NULL,
	"dropoff_location" text NOT NULL,
	"price" numeric(14, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "routes_price_check" CHECK ("routes"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "vehicle_types" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "vehicle_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "vehicle_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "vehicles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"plate_no" text NOT NULL,
	"vehicle_type_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "vehicles_plate_no_unique" UNIQUE("plate_no")
);
--> statement-breakpoint
CREATE TABLE "work_order_counters" (
	"period" text PRIMARY KEY NOT NULL,
	"last_no" integer NOT NULL,
	CONSTRAINT "work_order_counters_last_no_check" CHECK ("work_order_counters"."last_no" >= 1)
);
--> statement-breakpoint
CREATE TABLE "work_order_vehicles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "work_order_vehicles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"work_order_id" integer NOT NULL,
	"line_no" smallint NOT NULL,
	"vehicle_type_id" integer,
	"driver_id" integer,
	"vehicle_id" integer,
	"driver_phone" text,
	"quantity" numeric(12, 2),
	"quantity_unit" text,
	"weight" numeric(12, 2),
	"weight_unit" text,
	"dimensions" text,
	CONSTRAINT "work_order_vehicles_line_unique" UNIQUE("work_order_id","line_no"),
	CONSTRAINT "work_order_vehicles_quantity_check" CHECK (coalesce("work_order_vehicles"."quantity", 0) >= 0),
	CONSTRAINT "work_order_vehicles_weight_check" CHECK (coalesce("work_order_vehicles"."weight", 0) >= 0)
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "work_orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"work_order_no" text NOT NULL,
	"customer_id" integer NOT NULL,
	"ordered_by" text,
	"status_code" smallint DEFAULT 1 NOT NULL,
	"pickup_location" text,
	"pickup_contact_name" text,
	"pickup_contact_phone" text,
	"dropoff_location" text,
	"dropoff_contact_name" text,
	"dropoff_contact_phone" text,
	"receive_at" timestamp with time zone,
	"delivery_at" timestamp with time zone,
	"customer_job_no" text,
	"remark" text,
	"transport_fee" numeric(14, 2),
	"port_fee" numeric(14, 2),
	"demurrage_fee" numeric(14, 2),
	"overnight_nights" smallint DEFAULT 0 NOT NULL,
	"overnight_labor_fee" numeric(14, 2),
	"extra_workers" smallint DEFAULT 0 NOT NULL,
	"extra_worker_fee" numeric(14, 2),
	"cancelled_at" timestamp with time zone,
	"cancelled_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	CONSTRAINT "work_orders_work_order_no_unique" UNIQUE("work_order_no"),
	CONSTRAINT "work_orders_fees_check" CHECK (coalesce("work_orders"."transport_fee", 0) >= 0 and coalesce("work_orders"."port_fee", 0) >= 0 and coalesce("work_orders"."demurrage_fee", 0) >= 0 and coalesce("work_orders"."overnight_labor_fee", 0) >= 0 and coalesce("work_orders"."extra_worker_fee", 0) >= 0),
	CONSTRAINT "work_orders_overnight_nights_check" CHECK ("work_orders"."overnight_nights" between 0 and 15),
	CONSTRAINT "work_orders_extra_workers_check" CHECK ("work_orders"."extra_workers" between 0 and 15),
	CONSTRAINT "work_orders_dates_check" CHECK ("work_orders"."delivery_at" is null or "work_orders"."receive_at" is null or "work_orders"."delivery_at" >= "work_orders"."receive_at"),
	CONSTRAINT "work_orders_cancelled_check" CHECK (("work_orders"."status_code" = 2) = ("work_orders"."cancelled_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "work_statuses" (
	"code" smallint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_types" ADD CONSTRAINT "vehicle_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_types" ADD CONSTRAINT "vehicle_types_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_vehicle_type_id_vehicle_types_id_fk" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_vehicles" ADD CONSTRAINT "work_order_vehicles_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_vehicles" ADD CONSTRAINT "work_order_vehicles_vehicle_type_id_vehicle_types_id_fk" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_vehicles" ADD CONSTRAINT "work_order_vehicles_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_vehicles" ADD CONSTRAINT "work_order_vehicles_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_status_code_work_statuses_code_fk" FOREIGN KEY ("status_code") REFERENCES "public"."work_statuses"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "customers_name_idx" ON "customers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "drivers_name_idx" ON "drivers" USING btree ("first_name","last_name");--> statement-breakpoint
CREATE INDEX "routes_pickup_location_idx" ON "routes" USING btree ("pickup_location");--> statement-breakpoint
CREATE INDEX "routes_dropoff_location_idx" ON "routes" USING btree ("dropoff_location");--> statement-breakpoint
CREATE INDEX "vehicles_vehicle_type_id_idx" ON "vehicles" USING btree ("vehicle_type_id");--> statement-breakpoint
CREATE INDEX "work_order_vehicles_driver_id_idx" ON "work_order_vehicles" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "work_order_vehicles_vehicle_id_idx" ON "work_order_vehicles" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "work_order_vehicles_vehicle_type_id_idx" ON "work_order_vehicles" USING btree ("vehicle_type_id");--> statement-breakpoint
CREATE INDEX "work_orders_customer_id_idx" ON "work_orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "work_orders_status_code_idx" ON "work_orders" USING btree ("status_code");--> statement-breakpoint
CREATE INDEX "work_orders_receive_at_idx" ON "work_orders" USING btree ("receive_at");