CREATE TABLE IF NOT EXISTS "source_listings" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"house" varchar(64) NOT NULL,
	"kind" varchar(64) NOT NULL,
	"listing_url" text NOT NULL,
	"listed_on" date,
	"session_label" text,
	"filename_label" text,
	"content_hash" text,
	"missing_at" timestamp,
	"missing_run_id" varchar(191),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "source_revisions" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"listing_id" varchar(191) NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_runs" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"house" varchar(64) NOT NULL,
	"scope" text NOT NULL,
	"dry_run" boolean DEFAULT true NOT NULL,
	"enumeration_complete" boolean DEFAULT false NOT NULL,
	"listings_seen" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"error" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "source_listings" ADD CONSTRAINT "source_listings_missing_run_id_sync_runs_id_fk" FOREIGN KEY ("missing_run_id") REFERENCES "public"."sync_runs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "source_revisions" ADD CONSTRAINT "source_revisions_listing_id_source_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."source_listings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "source_listings_listing_url_idx" ON "source_listings" USING btree ("listing_url");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "source_listings_house_kind_listed_on_idx" ON "source_listings" USING btree ("house","kind","listed_on");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "source_revisions_listing_hash_idx" ON "source_revisions" USING btree ("listing_id","content_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_runs_house_scope_started_idx" ON "sync_runs" USING btree ("house","scope","started_at");