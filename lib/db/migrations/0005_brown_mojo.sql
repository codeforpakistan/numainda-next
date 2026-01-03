CREATE TABLE IF NOT EXISTS "representative_embeddings" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"representative_id" varchar(191) NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "representatives" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_clean" text NOT NULL,
	"father_name" text,
	"constituency" text NOT NULL,
	"constituency_code" varchar(20) NOT NULL,
	"constituency_name" text,
	"district" text,
	"province" varchar(100),
	"party" varchar(100) NOT NULL,
	"oath_taking_date" timestamp,
	"phone" varchar(50),
	"permanent_address" text,
	"islamabad_address" text,
	"profile_url" text,
	"image_url" text,
	"image_local_path" text,
	"image_s3_key" text,
	"profile_html" text,
	"latitude" real,
	"longitude" real,
	"boundary_data" text,
	"search_vector" text,
	"scraped_at" timestamp,
	"geocoded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "representative_embeddings" ADD CONSTRAINT "representative_embeddings_representative_id_representatives_id_fk" FOREIGN KEY ("representative_id") REFERENCES "public"."representatives"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "representative_embedding_index" ON "representative_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "representative_embeddings_rep_id_idx" ON "representative_embeddings" USING btree ("representative_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "representative_embeddings_content_type_idx" ON "representative_embeddings" USING btree ("content_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "representatives_constituency_code_idx" ON "representatives" USING btree ("constituency_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "representatives_province_idx" ON "representatives" USING btree ("province");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "representatives_party_idx" ON "representatives" USING btree ("party");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "representatives_district_idx" ON "representatives" USING btree ("district");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "representatives_name_clean_idx" ON "representatives" USING btree ("name_clean");