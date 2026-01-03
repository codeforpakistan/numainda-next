import { sql } from "drizzle-orm";
import { text, varchar, timestamp, pgTable, real, index } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "@/lib/utils";
import { relations } from "drizzle-orm";
import { representativeEmbeddings } from "./representative-embeddings";

/**
 * Representatives table stores National Assembly member information
 *
 * Data sources:
 * - Scraped from na.gov.pk
 * - Geocoded constituency coordinates
 * - Profile images stored locally or in S3
 */
export const representatives = pgTable(
  "representatives",
  {
    // Primary key
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),

    // Basic Information
    name: text("name").notNull(),
    nameClean: text("name_clean").notNull(), // Without titles (Mr., Dr., etc.)
    fatherName: text("father_name"),

    // Constituency Details
    constituency: text("constituency").notNull(), // Full: "NA-2Swat-I"
    constituencyCode: varchar("constituency_code", { length: 20 }).notNull(), // "NA-2"
    constituencyName: text("constituency_name"), // "Swat-I"
    district: text("district"), // "Swat"
    province: varchar("province", { length: 100 }), // "Khyber Pukhtunkhwa", "Punjab", etc.

    // Political Info
    party: varchar("party", { length: 100 }).notNull(), // "IND", "PML(N)", "PPP", etc.
    oathTakingDate: timestamp("oath_taking_date"),

    // Contact Information
    phone: varchar("phone", { length: 50 }),
    permanentAddress: text("permanent_address"),
    islamabadAddress: text("islamabad_address"),

    // Profile & Media
    profileUrl: text("profile_url"), // Link to NA website profile
    imageUrl: text("image_url"), // Original image URL from NA website
    imageLocalPath: text("image_local_path"), // Local file path
    imageS3Key: text("image_s3_key"), // S3 key if uploaded to cloud
    profileHtml: text("profile_html"), // Raw HTML from profile page for future parsing

    // Geographic Data (for location-based search)
    latitude: real("latitude"), // Constituency centroid
    longitude: real("longitude"), // Constituency centroid
    boundaryData: text("boundary_data"), // JSON string of boundary coordinates (future)

    // Search & Indexing
    searchVector: text("search_vector"), // PostgreSQL tsvector for full-text search

    // Metadata
    scrapedAt: timestamp("scraped_at"),
    geocodedAt: timestamp("geocoded_at"),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    // Indexes for fast lookups
    constituencyCodeIdx: index("representatives_constituency_code_idx").on(table.constituencyCode),
    provinceIdx: index("representatives_province_idx").on(table.province),
    partyIdx: index("representatives_party_idx").on(table.party),
    districtIdx: index("representatives_district_idx").on(table.district),
    nameCleanIdx: index("representatives_name_clean_idx").on(table.nameClean),
    // GIS index for location queries (requires PostGIS extension in future)
    // locationIdx: index("representatives_location_idx").using("gist", sql`point(longitude, latitude)`),
  })
);

// Relations
export const representativesRelations = relations(representatives, ({ many }) => ({
  embeddings: many(representativeEmbeddings),
}));

// Zod Schemas for validation
export const insertRepresentativeSchema = createSelectSchema(representatives)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export const updateRepresentativeSchema = insertRepresentativeSchema.partial();

// TypeScript types
export type Representative = typeof representatives.$inferSelect;
export type NewRepresentative = typeof representatives.$inferInsert;
export type UpdateRepresentative = z.infer<typeof updateRepresentativeSchema>;

/**
 * Helper function to create a search vector from representative data
 * Used for PostgreSQL full-text search
 */
export function createSearchVector(rep: Partial<Representative>): string {
  const fields = [
    rep.name,
    rep.nameClean,
    rep.constituencyCode,
    rep.constituencyName,
    rep.district,
    rep.province,
    rep.party,
  ]
    .filter(Boolean)
    .join(" ");

  return fields;
}
