CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('draft', 'active', 'inactive', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('car', 'motorcycle');--> statement-breakpoint
CREATE TABLE "vehicle_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"storage_key" varchar(512) NOT NULL,
	"alt_text" varchar(240) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"type" "vehicle_type" NOT NULL,
	"make" varchar(80) NOT NULL,
	"model" varchar(120) NOT NULL,
	"year" integer NOT NULL,
	"description" text NOT NULL,
	"daily_rate" numeric(10, 2) NOT NULL,
	"transmission" varchar(40) NOT NULL,
	"fuel_type" varchar(40) NOT NULL,
	"seats" integer NOT NULL,
	"city" varchar(120) NOT NULL,
	"state" varchar(2) NOT NULL,
	"location" geometry(point) NOT NULL,
	"status" "vehicle_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vehicle_images_vehicle_id_idx" ON "vehicle_images" USING btree ("vehicle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_images_storage_key_unique" ON "vehicle_images" USING btree ("storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_images_one_cover_per_vehicle" ON "vehicle_images" USING btree ("vehicle_id") WHERE "vehicle_images"."is_cover" = true;--> statement-breakpoint
CREATE INDEX "vehicles_owner_id_idx" ON "vehicles" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "vehicles_status_idx" ON "vehicles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vehicles_location_gist_idx" ON "vehicles" USING gist ("location");--> statement-breakpoint
CREATE INDEX "vehicles_make_model_idx" ON "vehicles" USING btree ("make","model");
