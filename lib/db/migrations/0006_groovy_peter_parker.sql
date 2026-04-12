ALTER TABLE "representatives" ALTER COLUMN "constituency" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "representatives" ALTER COLUMN "constituency_code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "representatives" ALTER COLUMN "party" SET DATA TYPE varchar(200);--> statement-breakpoint
ALTER TABLE "representatives" ADD COLUMN "assembly" varchar(32) DEFAULT 'national' NOT NULL;--> statement-breakpoint
ALTER TABLE "representatives" ADD COLUMN "seat_type" varchar(32) DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "representatives" ADD COLUMN "sequence_number" integer;--> statement-breakpoint
ALTER TABLE "representatives" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "representatives" ADD COLUMN "party_code" varchar(16);--> statement-breakpoint
ALTER TABLE "representatives" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "representatives" ADD COLUMN "facebook_handle" text;--> statement-breakpoint
ALTER TABLE "representatives" ADD COLUMN "profile_source_id" text;--> statement-breakpoint
ALTER TABLE "representatives" ADD COLUMN "provenance_note" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "representatives_party_code_idx" ON "representatives" USING btree ("party_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "representatives_assembly_idx" ON "representatives" USING btree ("assembly");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "representatives_seat_type_idx" ON "representatives" USING btree ("seat_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "representatives_assembly_constituency_idx" ON "representatives" USING btree ("assembly","constituency_code");