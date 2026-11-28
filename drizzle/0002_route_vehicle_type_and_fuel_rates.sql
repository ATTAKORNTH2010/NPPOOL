CREATE TABLE "route_rates" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "route_rates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"route_id" integer NOT NULL,
	"fuel_price" smallint NOT NULL,
	"price" numeric(14, 2) NOT NULL,
	CONSTRAINT "route_rates_route_fuel_price_unique" UNIQUE("route_id","fuel_price"),
	CONSTRAINT "route_rates_fuel_price_check" CHECK ("route_rates"."fuel_price" between 25 and 50),
	CONSTRAINT "route_rates_price_check" CHECK ("route_rates"."price" >= 0)
);
--> statement-breakpoint
ALTER TABLE "routes" ALTER COLUMN "price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "vehicle_type_id" integer;--> statement-breakpoint
ALTER TABLE "route_rates" ADD CONSTRAINT "route_rates_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_vehicle_type_id_vehicle_types_id_fk" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "routes_vehicle_type_id_idx" ON "routes" USING btree ("vehicle_type_id");