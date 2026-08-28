CREATE TYPE "public"."user_role" AS ENUM('user', 'reviewer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."kyc_audit_event" AS ENUM('case_created', 'upload_prepared', 'upload_completed', 'document_viewed', 'document_deleted', 'case_submitted', 'case_approved', 'case_rejected');--> statement-breakpoint
CREATE TYPE "public"."kyc_case_status" AS ENUM('draft', 'pending_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."kyc_document_status" AS ENUM('upload_pending', 'uploaded', 'pending_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."kyc_document_type" AS ENUM('drivers_license_front', 'drivers_license_back', 'selfie', 'proof_of_address');--> statement-breakpoint
CREATE TABLE "kyc_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"document_id" uuid,
	"actor_user_id" uuid NOT NULL,
	"event" "kyc_audit_event" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kyc_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "kyc_case_status" DEFAULT 'draft' NOT NULL,
	"rejection_reason" text,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kyc_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "kyc_document_type" NOT NULL,
	"status" "kyc_document_status" DEFAULT 'upload_pending' NOT NULL,
	"storage_key" text NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"checksum_sha256" varchar(64),
	"upload_expires_at" timestamp with time zone NOT NULL,
	"uploaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "kyc_audit_events" ADD CONSTRAINT "kyc_audit_events_case_id_kyc_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."kyc_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_audit_events" ADD CONSTRAINT "kyc_audit_events_document_id_kyc_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."kyc_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_audit_events" ADD CONSTRAINT "kyc_audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_cases" ADD CONSTRAINT "kyc_cases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_cases" ADD CONSTRAINT "kyc_cases_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_case_id_kyc_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."kyc_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kyc_audit_events_case_id_idx" ON "kyc_audit_events" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "kyc_audit_events_created_at_idx" ON "kyc_audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "kyc_cases_user_id_unique" ON "kyc_cases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "kyc_cases_status_idx" ON "kyc_cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "kyc_cases_submitted_at_idx" ON "kyc_cases" USING btree ("submitted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "kyc_documents_case_type_unique" ON "kyc_documents" USING btree ("case_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "kyc_documents_storage_key_unique" ON "kyc_documents" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "kyc_documents_user_id_idx" ON "kyc_documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "kyc_documents_status_idx" ON "kyc_documents" USING btree ("status");