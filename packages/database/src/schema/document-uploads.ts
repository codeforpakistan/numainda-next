import { sql } from "drizzle-orm";
import { text, varchar, timestamp, pgTable, integer, jsonb } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "@/lib/utils";
import { relations } from 'drizzle-orm';
import { documents } from "./documents";

export const documentUploads = pgTable("document_uploads", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  documentId: varchar("document_id", { length: 191 }).references(() => documents.id),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, processing, completed, failed
  originalFileName: text("original_file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadProgress: integer("upload_progress").default(0),
  processingProgress: integer("processing_progress").default(0),
  error: text("error"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const insertDocumentUploadSchema = createSelectSchema(documentUploads)
  .extend({})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export type NewDocumentUploadParams = z.infer<typeof insertDocumentUploadSchema>;

export const documentUploadsRelations = relations(documentUploads, ({ one }) => ({
  document: one(documents, {
    fields: [documentUploads.documentId],
    references: [documents.id],
  }),
})); 