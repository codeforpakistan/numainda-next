import { sql } from "drizzle-orm";
import { text, varchar, timestamp, pgTable } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "@/lib/utils";
import { relations } from 'drizzle-orm';
import { embeddings } from "./embeddings";

export const documents = pgTable("documents", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  title: text("title").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // constitution, election_law, parliamentary_bulletin
  content: text("content").notNull(),
  originalFileName: text("original_file_name").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const insertDocumentSchema = createSelectSchema(documents)
  .extend({})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export type NewDocumentParams = z.infer<typeof insertDocumentSchema>;

export const documentsRelations = relations(documents, ({ many }) => ({
  embeddings: many(embeddings)
}));
