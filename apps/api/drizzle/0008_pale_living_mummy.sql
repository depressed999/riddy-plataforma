CREATE TYPE "public"."host_profile_status" AS ENUM('onboarding', 'active', 'suspended');--> statement-breakpoint
CREATE TABLE "host_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"bio" text,
	"support_phone" varchar(20),
	"status" "host_profile_status" DEFAULT 'onboarding' NOT NULL,
	"terms_accepted_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_availability_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"host_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" varchar(240),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_availability_blocks_end_after_start_check" CHECK ("vehicle_availability_blocks"."end_date" > "vehicle_availability_blocks"."start_date")
);
--> statement-breakpoint
ALTER TABLE "host_profiles" ADD CONSTRAINT "host_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_availability_blocks" ADD CONSTRAINT "vehicle_availability_blocks_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_availability_blocks" ADD CONSTRAINT "vehicle_availability_blocks_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "host_profiles_user_id_unique" ON "host_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "host_profiles_status_idx" ON "host_profiles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vehicle_availability_blocks_vehicle_idx" ON "vehicle_availability_blocks" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "vehicle_availability_blocks_host_idx" ON "vehicle_availability_blocks" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "vehicle_availability_blocks_dates_idx" ON "vehicle_availability_blocks" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_availability_blocks_period_unique" ON "vehicle_availability_blocks" USING btree ("vehicle_id","start_date","end_date");--> statement-breakpoint
ALTER TABLE "vehicle_availability_blocks" ADD CONSTRAINT "vehicle_availability_blocks_vehicle_period_excl" EXCLUDE USING gist ("vehicle_id" WITH =, daterange("start_date", "end_date", '[)') WITH &&);
