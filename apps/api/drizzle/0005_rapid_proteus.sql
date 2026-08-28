CREATE TYPE "public"."payment_action_status" AS ENUM('processing', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_action_type" AS ENUM('cancel', 'refund');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('card', 'pix');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('created', 'pending', 'in_process', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back', 'error');--> statement-breakpoint
CREATE TABLE "payment_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"type" "payment_action_type" NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"provider_action_id" text,
	"amount" numeric(12, 2),
	"status" "payment_action_status" DEFAULT 'processing' NOT NULL,
	"failure_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_key" text NOT NULL,
	"provider_payment_id" text NOT NULL,
	"action" text NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"provider_payment_id" text,
	"idempotency_key" uuid NOT NULL,
	"method" "payment_method" NOT NULL,
	"payment_method_id" text NOT NULL,
	"payment_type_id" text,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"status_detail" text,
	"pix_qr_code" text,
	"pix_qr_code_base64" text,
	"pix_ticket_url" text,
	"failure_message" text,
	"approved_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_actions" ADD CONSTRAINT "payment_actions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_actions_idempotency_key_unique" ON "payment_actions" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payment_actions_payment_id_idx" ON "payment_actions" USING btree ("payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_webhook_events_event_key_unique" ON "payment_webhook_events" USING btree ("event_key");--> statement-breakpoint
CREATE INDEX "payment_webhook_events_provider_id_idx" ON "payment_webhook_events" USING btree ("provider_payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idempotency_key_unique" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_payment_id_unique" ON "payments" USING btree ("provider_payment_id");--> statement-breakpoint
CREATE INDEX "payments_booking_id_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");