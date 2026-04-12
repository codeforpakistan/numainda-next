import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { representatives } from '@/lib/db/schema/representatives';
import { eq } from 'drizzle-orm';
import { resolveRepresentativeImageUrl } from '@/lib/representative-image';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch representative by ID
    const rep = await db
      .select()
      .from(representatives)
      .where(eq(representatives.id, id))
      .limit(1);

    if (rep.length === 0) {
      return NextResponse.json(
        { error: 'Representative not found' },
        { status: 404 }
      );
    }

    const repWithImage = {
      ...rep[0],
      imageUrl: resolveRepresentativeImageUrl(rep[0].imageLocalPath, rep[0].imageUrl),
    };

    return NextResponse.json({
      data: repWithImage,
    });
  } catch (error) {
    console.error('Failed to fetch representative:', error);
    return NextResponse.json(
      { error: 'Failed to fetch representative' },
      { status: 500 }
    );
  }
}
