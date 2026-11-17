import { sql } from "drizzle-orm"
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

import { nanoid } from "@/lib/utils"

/**
 * Additive ledger beside the restored corpus.
 *
 * A listing is a source link. Its content hash stays null until bytes are stored.
 * A revision is immutable and is keyed by listing plus content hash.
 * A sync run records whether one source scope finished enumerating.
 * These tables do not replace documents, embeddings, bills, or proceedings.
 */

export const syncRuns = pgTable(
  "sync_runs",
  {
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    house: varchar("house", { length: 64 }).notNull(),
    scope: text("scope").notNull(),
    dryRun: boolean("dry_run").notNull().default(true),
    enumerationComplete: boolean("enumeration_complete")
      .notNull()
      .default(false),
    listingsSeen: integer("listings_seen").notNull().default(0),
    notes: text("notes"),
    error: text("error"),
    startedAt: timestamp("started_at")
      .notNull()
      .default(sql`now()`),
    finishedAt: timestamp("finished_at"),
  },
  (table) => ({
    houseScopeStartedIdx: index("sync_runs_house_scope_started_idx").on(
      table.house,
      table.scope,
      table.startedAt
    ),
  })
)

export const sourceListings = pgTable(
  "source_listings",
  {
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    house: varchar("house", { length: 64 }).notNull(),
    kind: varchar("kind", { length: 64 }).notNull(),
    listingUrl: text("listing_url").notNull(),
    listedOn: date("listed_on"),
    sessionLabel: text("session_label"),
    filenameLabel: text("filename_label"),
    contentHash: text("content_hash"),
    missingAt: timestamp("missing_at"),
    missingRunId: varchar("missing_run_id", { length: 191 }).references(
      () => syncRuns.id
    ),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    listingUrlIdx: uniqueIndex("source_listings_listing_url_idx").on(
      table.listingUrl
    ),
    houseKindListedOnIdx: index("source_listings_house_kind_listed_on_idx").on(
      table.house,
      table.kind,
      table.listedOn
    ),
  })
)

export const sourceRevisions = pgTable(
  "source_revisions",
  {
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    listingId: varchar("listing_id", { length: 191 })
      .notNull()
      .references(() => sourceListings.id),
    contentHash: text("content_hash").notNull(),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    listingHashIdx: uniqueIndex("source_revisions_listing_hash_idx").on(
      table.listingId,
      table.contentHash
    ),
  })
)

export type SyncRun = typeof syncRuns.$inferSelect
export type SourceListing = typeof sourceListings.$inferSelect
export type SourceRevision = typeof sourceRevisions.$inferSelect
