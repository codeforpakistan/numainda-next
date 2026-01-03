import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { representatives } from '@/lib/db/schema/representatives';
import { representativeEmbeddings } from '@/lib/db/schema/representative-embeddings';
import { desc, ilike, or, and, eq, count, sql, cosineDistance } from 'drizzle-orm';
import { generateEmbedding } from '@/lib/ai/embedding';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const query = searchParams.get('query') || ''; // Semantic search
    const province = searchParams.get('province') || '';
    const party = searchParams.get('party') || '';
    const district = searchParams.get('district') || '';
    const constituencyCode = searchParams.get('constituency') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // If semantic search query is provided, use vector search
    if (query) {
      const queryEmbedding = await generateEmbedding(query);

      const similarity = sql<number>`1 - (${cosineDistance(
        representativeEmbeddings.embedding,
        queryEmbedding,
      )})`;

      const results = await db
        .select({
          id: representatives.id,
          name: representatives.name,
          nameClean: representatives.nameClean,
          constituency: representatives.constituency,
          constituencyCode: representatives.constituencyCode,
          constituencyName: representatives.constituencyName,
          district: representatives.district,
          province: representatives.province,
          party: representatives.party,
          imageUrl: representatives.imageUrl,
          imageLocalPath: representatives.imageLocalPath,
          phone: representatives.phone,
          latitude: representatives.latitude,
          longitude: representatives.longitude,
          similarity,
        })
        .from(representativeEmbeddings)
        .innerJoin(representatives, eq(representativeEmbeddings.representativeId, representatives.id))
        .orderBy(desc(similarity))
        .limit(limit)
        .offset(offset);

      // Transform imageLocalPath to public URL
      const resultsWithImages = results.map(rep => ({
        ...rep,
        imageUrl: rep.imageLocalPath
          ? `/representatives/${rep.imageLocalPath.split('/').pop()}`
          : rep.imageUrl,
      }));

      // Get total count for semantic search
      const [{ value: totalCount }] = await db
        .select({ value: count() })
        .from(representativeEmbeddings);

      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        data: resultsWithImages,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
        searchType: 'semantic',
      });
    }

    // Build filter conditions for traditional search
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(representatives.nameClean, `%${search}%`),
          ilike(representatives.constituency, `%${search}%`),
          ilike(representatives.constituencyName, `%${search}%`),
          ilike(representatives.district, `%${search}%`)
        )
      );
    }

    if (province) {
      conditions.push(ilike(representatives.province, `%${province}%`));
    }

    if (party) {
      conditions.push(ilike(representatives.party, `%${party}%`));
    }

    if (district) {
      conditions.push(ilike(representatives.district, `%${district}%`));
    }

    if (constituencyCode) {
      conditions.push(ilike(representatives.constituencyCode, `%${constituencyCode}%`));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch representatives with filters
    const reps = await db
      .select({
        id: representatives.id,
        name: representatives.name,
        nameClean: representatives.nameClean,
        constituency: representatives.constituency,
        constituencyCode: representatives.constituencyCode,
        constituencyName: representatives.constituencyName,
        district: representatives.district,
        province: representatives.province,
        party: representatives.party,
        imageUrl: representatives.imageUrl,
        imageLocalPath: representatives.imageLocalPath,
        phone: representatives.phone,
        latitude: representatives.latitude,
        longitude: representatives.longitude,
      })
      .from(representatives)
      .where(whereCondition)
      .orderBy(representatives.constituencyCode)
      .limit(limit)
      .offset(offset);

    // Transform imageLocalPath to public URL
    const repsWithImages = reps.map(rep => ({
      ...rep,
      imageUrl: rep.imageLocalPath
        ? `/representatives/${rep.imageLocalPath.split('/').pop()}`
        : rep.imageUrl,
    }));

    // Get total count
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(representatives)
      .where(whereCondition);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: repsWithImages,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      searchType: 'filtered',
    });
  } catch (error) {
    console.error('Failed to fetch representatives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch representatives' },
      { status: 500 }
    );
  }
}
