/**
 * Import Representatives Data from Scraped JSON
 *
 * Loads the representatives-detailed.json file and imports all
 * representative data into the database.
 *
 * Usage: npm run import:representatives
 */

import { db } from "@/lib/db";
import { representatives } from "@/lib/db/schema/representatives";
import fs from "fs/promises";
import path from "path";
import { nanoid } from "@/lib/utils";

interface ScrapedRepresentative {
  constituency: string;
  constituencyCode: string;
  constituencyName: string;
  name: string;
  nameClean: string;
  party: string;
  permanentAddress: string;
  islamabadAddress: string;
  phone: string;
  profileUrl: string;
  imageUrl: string;
  imageLocalPath?: string;
  province?: string;
  district?: string;
  fatherName?: string;
  oathTakingDate?: string;
  profileHtml?: string;
}

const DATA_FILE = path.join(
  process.cwd(),
  "data",
  "representatives",
  "representatives-detailed.json"
);

async function importRepresentatives() {
  console.log("🚀 Starting Representative Data Import\n");

  try {
    // 1. Read the scraped data
    console.log("📖 Reading scraped data...");
    const fileContent = await fs.readFile(DATA_FILE, "utf-8");
    const scrapedData: ScrapedRepresentative[] = JSON.parse(fileContent);
    console.log(`✅ Found ${scrapedData.length} representatives in file\n`);

    // 2. Check if data already exists
    const existingCount = await db
      .select({ count: representatives.id })
      .from(representatives);

    if (existingCount.length > 0) {
      console.log(
        `⚠️  Warning: Database already contains ${existingCount.length} representatives`
      );
      console.log("This will add more records. Press Ctrl+C to cancel, or wait 5 seconds...\n");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // 3. Transform and validate data
    console.log("🔄 Transforming data for database...");

    const transformedData = scrapedData.map((rep) => {
      // Parse oath taking date if exists
      let oathTakingDate: Date | undefined;
      if (rep.oathTakingDate) {
        try {
          // Format: "29-02-2024" → Date
          const [day, month, year] = rep.oathTakingDate.split("-");
          oathTakingDate = new Date(`${year}-${month}-${day}`);
        } catch (e) {
          console.warn(`  ⚠️  Invalid date for ${rep.nameClean}: ${rep.oathTakingDate}`);
        }
      }

      return {
        id: nanoid(),
        name: rep.name,
        nameClean: rep.nameClean,
        fatherName: rep.fatherName || null,
        constituency: rep.constituency,
        constituencyCode: rep.constituencyCode,
        constituencyName: rep.constituencyName || null,
        district: rep.district || null,
        province: rep.province || null,
        party: rep.party,
        oathTakingDate: oathTakingDate || null,
        phone: rep.phone || null,
        permanentAddress: rep.permanentAddress || null,
        islamabadAddress: rep.islamabadAddress || null,
        profileUrl: rep.profileUrl || null,
        imageUrl: rep.imageUrl || null,
        imageLocalPath: rep.imageLocalPath || null,
        imageS3Key: null, // Will be populated if we upload to S3
        profileHtml: rep.profileHtml || null,
        latitude: null, // Will be populated by geocoding script
        longitude: null,
        boundaryData: null,
        searchVector: null, // Will be populated by search indexing
        scrapedAt: new Date(),
        geocodedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    console.log(`✅ Transformed ${transformedData.length} records\n`);

    // 4. Insert data in batches
    console.log("💾 Inserting data into database...");
    const BATCH_SIZE = 50;

    for (let i = 0; i < transformedData.length; i += BATCH_SIZE) {
      const batch = transformedData.slice(i, i + BATCH_SIZE);
      await db.insert(representatives).values(batch);

      const progress = Math.min(i + BATCH_SIZE, transformedData.length);
      console.log(`  ✅ Inserted ${progress}/${transformedData.length} representatives`);
    }

    console.log("\n✅ Import Complete!\n");

    // 5. Generate statistics
    console.log("📊 Generating statistics...");

    const stats = await db
      .select({
        total: representatives.id,
        province: representatives.province,
        party: representatives.party,
      })
      .from(representatives);

    const byProvince: Record<string, number> = {};
    const byParty: Record<string, number> = {};

    stats.forEach((row) => {
      const province = row.province || "Unknown";
      const party = row.party || "Unknown";
      byProvince[province] = (byProvince[province] || 0) + 1;
      byParty[party] = (byParty[party] || 0) + 1;
    });

    console.log("\n📈 Summary:");
    console.log(`  Total representatives: ${stats.length}`);
    console.log("\n  By Province:");
    Object.entries(byProvince)
      .sort(([, a], [, b]) => b - a)
      .forEach(([province, count]) => {
        console.log(`    ${province}: ${count}`);
      });
    console.log("\n  By Party:");
    Object.entries(byParty)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Top 10 parties
      .forEach(([party, count]) => {
        console.log(`    ${party}: ${count}`);
      });

    console.log("\n✨ Done!");
    console.log("\n🎯 Next Steps:");
    console.log("  1. Run migration: npm run db:migrate");
    console.log("  2. Generate embeddings: npm run generate:embeddings");
    console.log("  3. Test search: npm run test:search\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  }
}

// Run the import
importRepresentatives();
