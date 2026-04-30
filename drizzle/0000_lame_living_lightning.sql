CREATE TABLE "auth_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip" text NOT NULL,
	"user_agent" text,
	"success" boolean NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_pin" (
	"id" serial PRIMARY KEY NOT NULL,
	"hash" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_pin_changes" (
	"id" serial PRIMARY KEY NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "ph_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"note" text,
	"photo_drive_id" text NOT NULL,
	"photo_url" text NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "sync_failures" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_type" varchar(16) NOT NULL,
	"entry_id" integer NOT NULL,
	"target" varchar(16) NOT NULL,
	"error" text NOT NULL,
	"attempts" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "temperature_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"value_c" numeric(6, 2) NOT NULL,
	"value_f" numeric(6, 2) NOT NULL,
	"unit" varchar(1) NOT NULL,
	"note" text,
	"photo_drive_id" text NOT NULL,
	"photo_url" text NOT NULL,
	"sheet_row_synced" boolean DEFAULT false NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_attempts_ip_attempted_at_idx" ON "auth_attempts" USING btree ("ip","attempted_at");--> statement-breakpoint
CREATE INDEX "ph_entries_captured_at_idx" ON "ph_entries" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX "temperature_entries_captured_at_idx" ON "temperature_entries" USING btree ("captured_at");