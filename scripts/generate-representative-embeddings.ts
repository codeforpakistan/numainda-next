/**
 * Generate Representative Embeddings for RAG
 *
 * Creates vector embeddings for all representatives in the database
 * to enable semantic search and chat integration.
 *
 * Usage: npm run generate:embeddings
 */

import { db } from "@/lib/db";
import { representatives } from "@/lib/db/schema/representatives";
import {
  representativeEmbeddings,
  createProfileEmbeddingContent,
  createEmbeddingMetadata,
} from "@/lib/db/schema/representative-embeddings";
import { generateEmbedding } from "@/lib/ai/embedding";
import { generateId } from "ai";

const BATCH_SIZE = 5; // Process 5 reps at a time
const DELAY_MS = 1000; // 1 second delay between batches (rate limiting)

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateRepresentativeEmbeddings() {
  console.log("🚀 Starting Representative Embedding Generation\n");

  try {
    // 1. Fetch all representatives
    console.log("📖 Fetching representatives from database...");
    const reps = await db.select().from(representatives);
    console.log(`✅ Found ${reps.length} representatives\n`);

    // 2. Check existing embeddings
    console.log("🔍 Checking for existing embeddings...");
    const existing = await db
      .select({ representativeId: representativeEmbeddings.representativeId })
      .from(representativeEmbeddings);

    const existingIds = new Set(existing.map((e) => e.representativeId));
    const repsToProcess = reps.filter((rep) => !existingIds.has(rep.id));

    console.log(`  - Existing embeddings: ${existingIds.size}`);
    console.log(`  - To process: ${repsToProcess.length}\n`);

    if (repsToProcess.length === 0) {
      console.log("✅ All representatives already have embeddings!");
      console.log("Run with --force to regenerate all embeddings.\n");
      process.exit(0);
    }

    // 3. Generate embeddings in batches
    console.log(`🔄 Generating embeddings for ${repsToProcess.length} representatives...`);
    console.log(`⏱️  Estimated time: ~${Math.ceil(repsToProcess.length / BATCH_SIZE)}  minutes\n`);

    let processed = 0;
    const errors: { rep: string; error: string }[] = [];

    for (let i = 0; i < repsToProcess.length; i += BATCH_SIZE) {
      const batch = repsToProcess.slice(i, i + BATCH_SIZE);

      console.log(`[Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(repsToProcess.length / BATCH_SIZE)}]`);

      // Process batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(async (rep) => {
          try {
            console.log(`  📝 Processing: ${rep.nameClean} (${rep.constituencyCode})`);

            // Create embedding content
            const content = createProfileEmbeddingContent({
              name: rep.name,
              nameClean: rep.nameClean,
              constituency: rep.constituency,
              constituencyName: rep.constituencyName,
              party: rep.party,
              province: rep.province,
              district: rep.district,
              phone: rep.phone,
              permanentAddress: rep.permanentAddress,
              islamabadAddress: rep.islamabadAddress,
              fatherName: rep.fatherName,
              oathTakingDate: rep.oathTakingDate,
            });

            // Generate embedding via OpenAI
            const embedding = await generateEmbedding(content);

            // Create metadata
            const metadata = createEmbeddingMetadata({
              province: rep.province,
              party: rep.party,
              constituency: rep.constituency,
              district: rep.district,
            });

            // Insert into database
            await db.insert(representativeEmbeddings).values({
              id: generateId(),
              representativeId: rep.id,
              content,
              embedding,
              contentType: "profile",
              metadata,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            console.log(`    ✅ Generated embedding (${content.length} chars)`);
            processed++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.log(`    ❌ Failed: ${errorMsg}`);
            errors.push({
              rep: `${rep.nameClean} (${rep.constituencyCode})`,
              error: errorMsg,
            });
          }
        })
      );

      // Rate limiting delay between batches
      if (i + BATCH_SIZE < repsToProcess.length) {
        console.log(`  ⏸️  Waiting ${DELAY_MS}ms (rate limiting)...\n`);
        await delay(DELAY_MS);
      }
    }

    console.log("\n✅ Embedding Generation Complete!\n");

    // 4. Summary
    console.log("📊 Summary:");
    console.log(`  ✅ Successfully processed: ${processed}`);
    console.log(`  ❌ Errors: ${errors.length}`);
    console.log(`  📈 Total in database: ${existingIds.size + processed}`);

    if (errors.length > 0) {
      console.log("\n⚠️  Failed Representatives:");
      errors.forEach(({ rep, error }) => {
        console.log(`  - ${rep}: ${error}`);
      });
    }

    // 5. Cost estimation
    const avgTokens = 500; // Average tokens per representative
    const totalTokens = processed * avgTokens;
    const costPer1k = 0.0001; // OpenAI text-embedding-ada-002 pricing
    const estimatedCost = (totalTokens / 1000) * costPer1k;

    console.log("\n💰 Cost Estimate:");
    console.log(`  Tokens processed: ~${totalTokens.toLocaleString()}`);
    console.log(`  Estimated cost: $${estimatedCost.toFixed(4)}`);

    console.log("\n🎯 Next Steps:");
    console.log("  1. Test vector search: npm run test:search");
    console.log("  2. Integrate into chat: Update app/api/chat/route.tsx");
    console.log("  3. Build UI: Create /representatives page\n");

    process.exit(errors.length > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  }
}

// Run the generator
generateRepresentativeEmbeddings();
