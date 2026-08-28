CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "btree_gist";--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"renter_id" uuid NOT NULL,
	"pickup_date" date NOT NULL,
	"return_date" date NOT NULL,
	"daily_rate" numeric(10, 2) NOT NULL,
	"total_days" integer NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_return_after_pickup_check" CHECK ("bookings"."return_date" > "bookings"."pickup_date"),
	CONSTRAINT "bookings_total_days_check" CHECK ("bookings"."total_days" > 0),
	CONSTRAINT "bookings_daily_rate_check" CHECK ("bookings"."daily_rate" >= 0),
	CONSTRAINT "bookings_total_price_check" CHECK ("bookings"."total_price" >= 0)
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_renter_id_users_id_fk" FOREIGN KEY ("renter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_period_excl" EXCLUDE USING gist ("vehicle_id" WITH =, daterange("pickup_date", "return_date", '[)') WITH &&) WHERE ("status" IN ('pending', 'confirmed'));--> statement-breakpoint
CREATE INDEX "bookings_vehicle_id_idx" ON "bookings" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "bookings_renter_id_idx" ON "bookings" USING btree ("renter_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_pickup_return_idx" ON "bookings" USING btree ("pickup_date","return_date");
