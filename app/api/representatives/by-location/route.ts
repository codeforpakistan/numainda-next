import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { representatives } from '@/lib/db/schema/representatives';
import { sql, isNotNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Find representatives by location (lat/lng)
 * Uses Haversine formula to calculate distance
 *
 * Query params:
 * - lat: latitude (required)
 * - lng: longitude (required)
 * - radius: search radius in km (default: 50)
 * - limit: max results (default: 10)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const radius = parseFloat(searchParams.get('radius') || '50'); // km
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Valid lat and lng parameters are required' },
        { status: 400 }
      );
    }

    // Use subquery to calculate distance, then filter
    const results = await db.execute(sql`
      SELECT * FROM (
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
      ) as with_distance
      WHERE distance <= ${radius}
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
        radius,
      },
    });
  } catch (error) {
    console.error('Failed to fetch representatives by location:', error);
    return NextResponse.json(
      { error: 'Failed to fetch representatives by location' },
      { status: 500 }
    );
  }
}
