import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parliamentaryProceedings } from '@/lib/db/schema/parliamentary-proceedings';
import { desc, ilike, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic'; // Disable caching for this route

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    // Build search condition
    const searchCondition = search
      ? ilike(parliamentaryProceedings.title, `%${search}%`)
      : undefined;

    // Fetch paginated proceedings
    const proceedings = await db
      .select({
        id: parliamentaryProceedings.id,
        title: parliamentaryProceedings.title,
        date: parliamentaryProceedings.date,
        createdAt: parliamentaryProceedings.createdAt,
      })
      .from(parliamentaryProceedings)
      .where(searchCondition)
      .orderBy(desc(parliamentaryProceedings.date))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(parliamentaryProceedings)
      .where(searchCondition);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: proceedings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Failed to fetch proceedings:', error);
    return NextResponse.json({ error: 'Failed to fetch proceedings' }, { status: 500 });
  }
}
