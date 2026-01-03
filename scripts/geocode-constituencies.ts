/**
 * Geocode Constituencies Script
 *
 * Adds latitude/longitude coordinates to all representatives
 * by geocoding their constituency locations using OpenStreetMap Nominatim API.
 *
 * Usage: npm run geocode:constituencies
 *
 * Features:
 * - Skips already geocoded representatives
 * - Rate limiting: 1 request per second (Nominatim requirement)
 * - Multiple fallback strategies for best accuracy
 * - Progress tracking and error reporting
 */

import { db } from '@/lib/db';
import { representatives } from '@/lib/db/schema/representatives';
import { eq, isNull } from 'drizzle-orm';
import { geocodeWithRateLimit } from '@/lib/services/geocoding';

async function geocodeConstituencies() {
  console.log('🌍 Starting Constituency Geocoding\n');

  try {
    // 1. Fetch representatives without coordinates
    console.log('📖 Fetching representatives...');
    const reps = await db
      .select()
      .from(representatives)
      .where(isNull(representatives.latitude));

    console.log(`✅ Found ${reps.length} constituencies to geocode\n`);

    if (reps.length === 0) {
      console.log('✅ All constituencies already geocoded!');
      console.log('Run with --force to re-geocode all constituencies.\n');
      process.exit(0);
    }

    // 2. Estimate time
    const estimatedMinutes = Math.ceil(reps.length / 60);
    console.log(`⏱️  Estimated time: ~${estimatedMinutes} minutes (1 req/sec)\n`);

    // 3. Geocode each constituency
    console.log('🔄 Geocoding constituencies...\n');

    let geocoded = 0;
    let failed = 0;
    const errors: { rep: string; constituency: string; error: string }[] = [];

    for (let i = 0; i < reps.length; i++) {
      const rep = reps[i];

      console.log(
        `[${i + 1}/${reps.length}] ${rep.constituencyCode} - ${rep.nameClean}`
      );
      console.log(`  📍 Geocoding: ${rep.constituencyName || rep.constituency}`);

      try {
        // Geocode with rate limiting
        const result = await geocodeWithRateLimit(
          rep.constituencyName || rep.constituency,
          rep.district,
          rep.province,
          1000 // 1 second delay
        );

        if (result) {
          // Update database with coordinates
          await db
            .update(representatives)
            .set({
              latitude: result.latitude,
              longitude: result.longitude,
              geocodedAt: new Date(),
            })
            .where(eq(representatives.id, rep.id));

          console.log(`    ✅ Geocoded: ${result.latitude}, ${result.longitude}`);
          console.log(`    📌 Location: ${result.displayName}`);
          console.log(`    🎯 Accuracy: ${result.accuracy}`);
          geocoded++;
        } else {
          console.log(`    ❌ No results found`);
          failed++;
          errors.push({
            rep: rep.nameClean,
            constituency: rep.constituencyName || rep.constituency,
            error: 'No geocoding results found',
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`    ❌ Error: ${errorMsg}`);
        failed++;
        errors.push({
          rep: rep.nameClean,
          constituency: rep.constituencyName || rep.constituency,
          error: errorMsg,
        });
      }

      console.log(''); // Empty line for spacing
    }

    console.log('✅ Geocoding Complete!\n');

    // 4. Summary
    console.log('📊 Summary:');
    console.log(`  ✅ Successfully geocoded: ${geocoded}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📈 Success rate: ${((geocoded / reps.length) * 100).toFixed(1)}%`);

    // Get total count from database
    const allReps = await db.select().from(representatives);
    const geocodedCount = allReps.filter((r) => r.latitude !== null).length;
    console.log(`  🌍 Total geocoded in database: ${geocodedCount}/${allReps.length}\n`);

    // 5. Show errors if any
    if (errors.length > 0) {
      console.log('⚠️  Failed Geocodings:\n');
      errors.forEach(({ rep, constituency, error }) => {
        console.log(`  - ${rep} (${constituency})`);
        console.log(`    Error: ${error}\n`);
      });
    }

    // 6. Next steps
    console.log('🎯 Next Steps:');
    console.log('  1. Review failed geocodings and manually add coordinates if needed');
    console.log('  2. Create API routes: npm run dev');
    console.log('  3. Build UI: Create /representatives page\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the geocoder
geocodeConstituencies();
