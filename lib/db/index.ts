import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as documents from './schema/documents';
import * as embeddings from './schema/embeddings';
import * as bills from './schema/bills';
import * as chatThreads from './schema/chat-threads';
import * as representatives from './schema/representatives';
import * as representativeEmbeddings from './schema/representative-embeddings';
import { env } from "@/lib/env.mjs";

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client, {
  schema: {
    ...documents,
    ...embeddings,
    ...bills,
    ...chatThreads,
    ...representatives,
    ...representativeEmbeddings,
  },
});

