CREATE TABLE IF NOT EXISTS "email_subscriptions" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"pehchan_id" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp,
	"include_bills" boolean DEFAULT true NOT NULL,
	"include_proceedings" boolean DEFAULT true NOT NULL,
	"include_representatives" boolean DEFAULT true NOT NULL,
	"constituency_code" varchar(20),
	"province" varchar(100),
	"last_digest_sent_at" timestamp,
	"verification_token" varchar(255),
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_subscriptions_email_idx" ON "email_subscriptions" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_subscriptions_pehchan_id_idx" ON "email_subscriptions" USING btree ("pehchan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_subscriptions_is_active_idx" ON "email_subscriptions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_subscriptions_is_verified_idx" ON "email_subscriptions" USING btree ("is_verified");