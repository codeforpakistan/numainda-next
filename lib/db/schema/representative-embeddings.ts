import { generateId } from "ai";
import { index, pgTable, text, varchar, vector, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { representatives } from "./representatives";
import { relations } from "drizzle-orm";

/**
 * Representative Embeddings table for RAG (Retrieval-Augmented Generation)
 *
 * Stores vector embeddings of representative information for AI chat integration.
 * Multiple embeddings per representative allow for different content types:
 * - profile: Basic info (name, constituency, party, contact)
 * - bio: Detailed biography and career info
 * - activities: Parliamentary activities, committee work, etc.
 *
 * Vector dimensions: 1536 (OpenAI text-embedding-ada-002)
 * Similarity search: Cosine similarity via HNSW index
 */
export const representativeEmbeddings = pgTable(
  "representative_embeddings",
  {
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => generateId()),

    // Foreign key to representatives
    representativeId: varchar("representative_id", { length: 191 })
      .notNull()
      .references(() => representatives.id, { onDelete: "cascade" }),

    // Content that was embedded
    content: text("content").notNull(),

    // Vector embedding (1536 dimensions for OpenAI)
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),

    // Type of content embedded
    contentType: varchar("content_type", { length: 50 }).notNull(),
    // Possible values:
    // - "profile": Basic representative info
    // - "bio": Biography and career history
    // - "contact": Contact information and addresses
    // - "activities": Parliamentary activities
    // - "committees": Committee memberships

    // Metadata for additional context
    // Example: { province: "Punjab", party: "PML(N)", constituency: "NA-2" }
    // This helps with filtering results after vector search
    metadata: text("metadata"), // JSON string

    // Timestamps
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    // HNSW index for fast cosine similarity search
    // This enables efficient nearest-neighbor queries on the embedding vector
    embeddingIndex: index("representative_embedding_index").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),

    // Index on representativeId for fast lookups
    representativeIdIdx: index("representative_embeddings_rep_id_idx").on(
      table.representativeId
    ),

    // Index on contentType for filtering by embedding type
    contentTypeIdx: index("representative_embeddings_content_type_idx").on(
      table.contentType
    ),
  })
);

// Relations
export const representativeEmbeddingsRelations = relations(
  representativeEmbeddings,
  ({ one }) => ({
    representative: one(representatives, {
      fields: [representativeEmbeddings.representativeId],
      references: [representatives.id],
    }),
  })
);

// TypeScript types
export type RepresentativeEmbedding = typeof representativeEmbeddings.$inferSelect;
export type NewRepresentativeEmbedding = typeof representativeEmbeddings.$inferInsert;

/**
 * Helper: Create profile embedding content
 *
 * Formats representative data into a text string suitable for embedding.
 * This is what the AI will "read" when answering questions about representatives.
 */
export function createProfileEmbeddingContent(rep: {
  name: string;
  nameClean: string;
  constituency: string;
  constituencyName?: string | null;
  party: string;
  province?: string | null;
  district?: string | null;
  phone?: string | null;
  permanentAddress?: string | null;
  islamabadAddress?: string | null;
  fatherName?: string | null;
  oathTakingDate?: Date | null;
}): string {
  const parts: string[] = [];

  // Basic info
  parts.push(`Representative: ${rep.name}`);
  if (rep.fatherName) parts.push(`Father: ${rep.fatherName}`);

  // Constituency
  parts.push(`Constituency: ${rep.constituency}`);
  if (rep.constituencyName) parts.push(`Area: ${rep.constituencyName}`);
  if (rep.district) parts.push(`District: ${rep.district}`);
  if (rep.province) parts.push(`Province: ${rep.province}`);

  // Political
  parts.push(`Party: ${rep.party}`);
  if (rep.oathTakingDate) {
    parts.push(`Oath Date: ${rep.oathTakingDate.toLocaleDateString()}`);
  }

  // Contact
  if (rep.phone) parts.push(`Phone: ${rep.phone}`);
  if (rep.permanentAddress) parts.push(`Permanent Address: ${rep.permanentAddress}`);
  if (rep.islamabadAddress) parts.push(`Islamabad Address: ${rep.islamabadAddress}`);

  return parts.join("\n");
}

/**
 * Helper: Create metadata JSON for filtering
 */
export function createEmbeddingMetadata(rep: {
  province?: string | null;
  party: string;
  constituency: string;
  district?: string | null;
}): string {
  return JSON.stringify({
    province: rep.province || null,
    party: rep.party,
    constituency: rep.constituency,
    district: rep.district || null,
  });
}
