import { sql } from "drizzle-orm";
import { text, timestamp, pgTable, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from '@/lib/utils'

export const parliamentaryProceedings = pgTable("parliamentary_proceedings", {
  id: varchar("id", { length: 191 }).primaryKey().$defaultFn(() => nanoid()),
  title: text("title").notNull(),
  date: text("date").notNull(),
  summary: text("summary").notNull(),
  originalText: text("original_text").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

// Schema for proceedings
export const insertProceedingSchema = createSelectSchema(parliamentaryProceedings)
  .extend({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  })
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export type NewProceedingParams = z.infer<typeof insertProceedingSchema>;