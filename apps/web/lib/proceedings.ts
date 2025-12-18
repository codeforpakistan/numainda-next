import { db } from '@/lib/db'
import { desc, eq } from 'drizzle-orm'
import { parliamentaryProceedings } from '@/lib/db/schema/parliamentary-proceedings'
import { NewProceedingParams } from '@/lib/db/schema/parliamentary-proceedings'

export async function getProceedings() {
  return await db
    .select({
      id: parliamentaryProceedings.id,
      title: parliamentaryProceedings.title,
      date: parliamentaryProceedings.date,
      createdAt: parliamentaryProceedings.createdAt,
    })
    .from(parliamentaryProceedings)
    .orderBy(desc(parliamentaryProceedings.date));
}

export async function getProceeding(id: string) {
  const results = await db
    .select()
    .from(parliamentaryProceedings)
    .where(eq(parliamentaryProceedings.id, id))
    .limit(1);
  
  return results[0] || null;
}

export async function createProceeding({
  title,
  date,
  summary,
  originalText,
}: NewProceedingParams) {
  const [result] = await db
    .insert(parliamentaryProceedings)
    .values({
      title,
      date,
      summary,
      originalText,
    })
    .returning();
  
  return result;
} 