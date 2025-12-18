CREATE TABLE IF NOT EXISTS "document_uploads" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"document_id" varchar(191),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"original_file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"upload_progress" integer DEFAULT 0,
	"processing_progress" integer DEFAULT 0,
	"error" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_uploads" ADD CONSTRAINT "document_uploads_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
