CREATE TABLE IF NOT EXISTS "chat_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"pehchan_id" text NOT NULL,
	"title" text NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
