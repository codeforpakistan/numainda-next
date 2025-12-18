CREATE TABLE IF NOT EXISTS "bills" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"status" varchar(50) NOT NULL,
	"summary" text NOT NULL,
	"original_text" text NOT NULL,
	"passage_date" timestamp,
	"session_number" text,
	"bill_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
