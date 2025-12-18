import { sql } from "drizzle-orm";
import { text, timestamp, pgTable, serial, jsonb } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const chatThreads = pgTable("chat_threads", {
  id: serial("id").primaryKey(),
  pehchanId: text("pehchan_id").notNull(),
  title: text("title").notNull(),
  messages: jsonb("messages").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const insertThreadSchema = createSelectSchema(chatThreads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ChatThread = typeof chatThreads.$inferSelect;
export type NewChatThread = typeof chatThreads.$inferInsert; 