import { sql } from "drizzle-orm";
import { text, varchar, timestamp, pgTable, real, index, integer } from "drizzle-orm/pg-core";
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

    // Assembly & seat classification
    assembly: varchar("assembly", { length: 32 })
      .notNull()
      .default("national"), // "national" | "kp" | "punjab" | "sindh" | "balochistan"
    seatType: varchar("seat_type", { length: 32 })
      .notNull()
      .default("general"), // "general" | "women_reserved" | "minority_reserved"
    sequenceNumber: integer("sequence_number"),

    // Basic Information
    name: text("name").notNull(),
    nameClean: text("name_clean").notNull(), // Without titles (Mr., Dr., etc.)
    fatherName: text("father_name"),
    age: integer("age"),

    // Constituency Details
    constituency: text("constituency"), // Full: "NA-2Swat-I" (nullable for provincial reserved seats without composed form)
    constituencyCode: varchar("constituency_code", { length: 20 }), // "NA-2", "PK-1", "WR-1", nullable for Balochistan etc.
    constituencyName: text("constituency_name"), // "Swat-I"
    district: text("district"), // "Swat"
    province: varchar("province", { length: 100 }), // "Khyber Pukhtunkhwa", "Punjab", etc.

    // Political Info
    party: varchar("party", { length: 200 }).notNull(), // raw full name from source
    partyCode: varchar("party_code", { length: 16 }), // canonical: "PTI", "PMLN", "PPP", "IND", "JUIF", ...
    oathTakingDate: timestamp("oath_taking_date"),

    // Contact Information
    email: text("email"),
    phone: varchar("phone", { length: 50 }),
    facebookHandle: text("facebook_handle"),
    permanentAddress: text("permanent_address"),
    islamabadAddress: text("islamabad_address"),

    // Profile & Media
    profileUrl: text("profile_url"), // Link to assembly website profile
    profileSourceId: text("profile_source_id"), // e.g. pabalochistan member-profile id
    imageUrl: text("image_url"), // Original image URL from source website
    imageLocalPath: text("image_local_path"), // Local file path / public-relative (e.g. "kp/foo.jpg")
    imageS3Key: text("image_s3_key"), // S3 key if uploaded to cloud
    profileHtml: text("profile_html"), // Raw HTML from profile page for future parsing

    // Data provenance
    provenanceNote: text("provenance_note"), // Free-form caveats about source quality

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
    partyCodeIdx: index("representatives_party_code_idx").on(table.partyCode),
    districtIdx: index("representatives_district_idx").on(table.district),
    nameCleanIdx: index("representatives_name_clean_idx").on(table.nameClean),
    assemblyIdx: index("representatives_assembly_idx").on(table.assembly),
    seatTypeIdx: index("representatives_seat_type_idx").on(table.seatType),
    assemblyConstituencyIdx: index("representatives_assembly_constituency_idx").on(
      table.assembly,
      table.constituencyCode,
    ),
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
