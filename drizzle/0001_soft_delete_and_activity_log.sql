CREATE TABLE "activity_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "activity_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text,
	"module" text NOT NULL,
	"action" text NOT NULL,
	"entity_id" text,
	"detail" text,
	"path" text,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_occurred_at_idx" ON "activity_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "activity_logs_user_id_occurred_at_idx" ON "activity_logs" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "activity_logs_module_occurred_at_idx" ON "activity_logs" USING btree ("module","occurred_at");--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_deleted_check" CHECK (("work_orders"."deleted_at" is null) = ("work_orders"."deleted_by" is null));