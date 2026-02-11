import { sql } from "drizzle-orm";
import { text, varchar, timestamp, pgTable, boolean, index } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "@/lib/utils";

/**
 * Email subscriptions table for monthly digest
 * Supports both authenticated (Pehchan) and unauthenticated users
 */
export const emailSubscriptions = pgTable(
  "email_subscriptions",
  {
    // Primary key
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),

    // Email address (always required)
    email: varchar("email", { length: 255 }).notNull(),

    // Optional Pehchan integration
    pehchanId: varchar("pehchan_id", { length: 20 }), // CNIC from Pehchan

    // Subscription preferences
    isActive: boolean("is_active").notNull().default(true),
    subscribedAt: timestamp("subscribed_at").notNull().default(sql`now()`),
    unsubscribedAt: timestamp("unsubscribed_at"),

    // Digest preferences
    includeBills: boolean("include_bills").notNull().default(true),
    includeProceedings: boolean("include_proceedings").notNull().default(true),
    includeRepresentatives: boolean("include_representatives").notNull().default(true),

    // Representative-specific filtering
    constituencyCode: varchar("constituency_code", { length: 20 }), // Optional: filter by constituency
    province: varchar("province", { length: 100 }), // Optional: filter by province

    // Last digest sent
    lastDigestSentAt: timestamp("last_digest_sent_at"),

    // Verification
    verificationToken: varchar("verification_token", { length: 255 }), // For email verification
    isVerified: boolean("is_verified").notNull().default(false),

    // Tracking
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    emailIdx: index("email_subscriptions_email_idx").on(table.email),
    pehchanIdx: index("email_subscriptions_pehchan_id_idx").on(table.pehchanId),
    activeIdx: index("email_subscriptions_is_active_idx").on(table.isActive),
    verifiedIdx: index("email_subscriptions_is_verified_idx").on(table.isVerified),
  })
);

// Zod schemas
export const insertEmailSubscriptionSchema = createSelectSchema(emailSubscriptions)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial({
    pehchanId: true,
    unsubscribedAt: true,
    lastDigestSentAt: true,
    verificationToken: true,
    constituencyCode: true,
    province: true,
  });

export const updateEmailSubscriptionSchema = createSelectSchema(emailSubscriptions)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    email: true,
    pehchanId: true,
  })
  .partial();

export type EmailSubscription = typeof emailSubscriptions.$inferSelect;
export type NewEmailSubscription = typeof emailSubscriptions.$inferInsert;
