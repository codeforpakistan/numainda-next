import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { representatives } from '@/lib/db/schema/representatives';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Get available filter options for representatives
 * Returns unique values for provinces, parties, and districts
 */
export async function GET() {
  try {
    // Get unique provinces
    const provincesResult = await db
      .selectDistinct({ province: representatives.province })
      .from(representatives)
      .where(sql`${representatives.province} IS NOT NULL`)
      .orderBy(representatives.province);

    // Get unique parties
    const partiesResult = await db
      .selectDistinct({ party: representatives.party })
      .from(representatives)
      .where(sql`${representatives.party} IS NOT NULL`)
      .orderBy(representatives.party);

    // Get unique districts
    const districtsResult = await db
      .selectDistinct({ district: representatives.district })
      .from(representatives)
      .where(sql`${representatives.district} IS NOT NULL`)
      .orderBy(representatives.district);

    const provinces = provincesResult
      .map((r) => r.province)
      .filter((p): p is string => p !== null);

    const parties = partiesResult
      .map((r) => r.party)
      .filter((p): p is string => p !== null);

    const districts = districtsResult
      .map((r) => r.district)
      .filter((d): d is string => d !== null);

    return NextResponse.json({
      data: {
        provinces,
        parties,
        districts,
      },
    });
  } catch (error) {
    console.error('Failed to fetch filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}
