import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { representatives } from '@/lib/db/schema/representatives';
import { sql, isNotNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Find nearest representatives to a location
 * Always returns the closest N representatives regardless of distance
 *
 * Query params:
 * - lat: latitude (required)
 * - lng: longitude (required)
 * - limit: number of nearest reps (default: 5)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Valid lat and lng parameters are required' },
        { status: 400 }
      );
    }

    // Use raw SQL query with Haversine formula for distance calculation
    const results = await db.execute(sql`
      SELECT
        id,
        name,
        name_clean as "nameClean",
        constituency,
        constituency_code as "constituencyCode",
        constituency_name as "constituencyName",
        district,
        province,
        party,
        image_url as "imageUrl",
        image_local_path as "imageLocalPath",
        phone,
        latitude,
        longitude,
        permanent_address as "permanentAddress",
        islamabad_address as "islamabadAddress",
        (
          6371 * acos(
            cos(radians(${lat}))
            * cos(radians(latitude))
            * cos(radians(longitude) - radians(${lng}))
            + sin(radians(${lat}))
            * sin(radians(latitude))
          )
        ) as distance
      FROM representatives
      WHERE latitude IS NOT NULL
      ORDER BY distance
      LIMIT ${limit}
    `);

    // Transform imageLocalPath to public URL
    const resultsWithImages = results.map((rep: any) => ({
      ...rep,
      imageUrl: rep.imageLocalPath
        ? `/representatives/${rep.imageLocalPath.split('/').pop()}`
        : rep.imageUrl,
    }));

    return NextResponse.json({
      data: resultsWithImages,
      query: {
        lat,
        lng,
        limit,
      },
    });
  } catch (error) {
    console.error('Failed to fetch nearby representatives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nearby representatives' },
      { status: 500 }
    );
  }
}
