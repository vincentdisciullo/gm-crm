CREATE TYPE "public"."activity_channel" AS ENUM('email', 'linkedin', 'call', 'meeting', 'event', 'website', 'referral');--> statement-breakpoint
CREATE TYPE "public"."activity_direction" AS ENUM('outbound', 'inbound');--> statement-breakpoint
CREATE TYPE "public"."activity_outcome" AS ENUM('no_reply', 'replied', 'meeting_booked', 'not_interested');--> statement-breakpoint
CREATE TYPE "public"."company_type" AS ENUM('prospect', 'client', 'partner');--> statement-breakpoint
CREATE TYPE "public"."contact_source" AS ENUM('outbound', 'website', 'email', 'referral', 'other');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurred_on" date NOT NULL,
	"direction" "activity_direction" NOT NULL,
	"channel" "activity_channel" NOT NULL,
	"contact_id" uuid NOT NULL,
	"outcome" "activity_outcome",
	"notes" text,
	"followed_up_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"type" "company_type" DEFAULT 'prospect' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"linkedin_url" text,
	"company_id" uuid,
	"role" text,
	"source" "contact_source",
	"next_step" text,
	"next_step_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_contact_idx" ON "activities" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "activities_occurred_idx" ON "activities" USING btree ("occurred_on");--> statement-breakpoint
CREATE INDEX "contacts_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "contacts_next_step_idx" ON "contacts" USING btree ("next_step_date");