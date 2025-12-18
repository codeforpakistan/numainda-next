import { generateId } from 'ai';
import { index, pgTable, text, varchar, vector, jsonb } from 'drizzle-orm/pg-core';
import { documents } from './documents';
import { relations } from 'drizzle-orm';

export const embeddings = pgTable(
  'embeddings',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => generateId()),
    resourceId: varchar('resource_id', { length: 191 })
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
    metadata: jsonb('metadata').notNull(),
  },
  table => ({
    embeddingIndex: index('embeddingIndex').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops'),
    ),
  }),
);

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  document: one(documents, {
    fields: [embeddings.resourceId],
    references: [documents.id],
  }),
}));