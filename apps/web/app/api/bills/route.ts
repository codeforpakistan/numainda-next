import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bills } from '@/lib/db/schema/bills';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic'; // Disable caching for this route

export async function GET() {
  try {
    const allBills = await db.query.bills.findMany({
      orderBy: [desc(bills.createdAt)],
    });
    return NextResponse.json(allBills);
  } catch (error) {
    console.error('Failed to fetch bills:', error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
} 