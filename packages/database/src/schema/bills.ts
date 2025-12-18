import { sql } from "drizzle-orm";
import { text, timestamp, pgTable, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from '@/lib/utils'

export const bills = pgTable("bills", {
  id: varchar("id", { length: 191 }).primaryKey().$defaultFn(() => nanoid()),
  title: text("title").notNull(),
  status: varchar("status", { length: 50 }).notNull(), // pending, passed, rejected
  summary: text("summary").notNull(),
  originalText: text("original_text").notNull(),
  passageDate: timestamp("passage_date"),
  sessionNumber: text("session_number"),
  billNumber: text("bill_number"),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const insertBillSchema = createSelectSchema(bills)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export type Bill = typeof bills.$inferSelect;
export type NewBillParams = typeof bills.$inferInsert; 