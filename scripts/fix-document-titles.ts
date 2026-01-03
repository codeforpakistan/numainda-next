#!/usr/bin/env tsx

/**
 * Script to fix ugly document titles by generating proper titles from content
 *
 * Usage:
 *   tsx scripts/fix-document-titles.ts [options]
 *
 * Options:
 *   --dry-run          Show what would be changed without updating
 *   --limit <number>   Limit number of documents to process
 *   --filter <string>  Only process titles containing this string
 *
 * Examples:
 *   tsx scripts/fix-document-titles.ts --dry-run
 *   tsx scripts/fix-document-titles.ts --filter "administrator" --limit 50
 */

import { db } from '../lib/db';
import { documents } from '../lib/db/schema/documents';
import { bills } from '../lib/db/schema/bills';
import { eq, like, or } from 'drizzle-orm';

async function generateProperTitle(content: string, originalTitle: string): Promise<string> {
  try {
    // Take first 3000 characters of content for title generation
    const excerpt = content.substring(0, 3000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing legal documents and creating concise, descriptive titles. Generate a clear, professional title that captures the main subject of the document. The title should be 3-8 words, title case, and descriptive. Do not include "Bill" or "Act" unless it\'s in the original name.'
          },
          {
            role: 'user',
            content: `Generate a proper title for this legal document. Current title: "${originalTitle}"\n\nDocument excerpt:\n${excerpt}`
          }
        ],
        temperature: 0.3,
        max_tokens: 50,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let newTitle = data.choices[0].message.content.trim();

    // Remove quotes if present
    newTitle = newTitle.replace(/^["']|["']$/g, '');

    // Ensure title is not too long
    if (newTitle.length > 100) {
      newTitle = newTitle.substring(0, 97) + '...';
    }

    return newTitle;
  } catch (error: any) {
    console.error('   ⚠️  Error generating title:', error.message);
    // Fallback: clean up the original title
    return cleanupTitle(originalTitle);
  }
}

function cleanupTitle(title: string): string {
  // Remove common ugly patterns
  let cleaned = title
    .replace(/^administrator/i, '')
    .replace(/^admin/i, '')
    .replace(/[0-9a-f]{32}/gi, '') // Remove MD5 hashes
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/%20/g, ' ')
    .replace(/\((\d+)\)$/, '') // Remove (1), (2) etc at end
    .trim();

  // If nothing left or too short, use original
  if (cleaned.length < 3) {
    cleaned = title;
  }

  // Title case
  cleaned = cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return cleaned;
}

function shouldFixTitle(title: string): boolean {
  // Check if title looks ugly
  const uglyPatterns = [
    /^administrator[0-9a-f]{32}/i,
    /^admin[0-9a-f]{32}/i,
    /^[0-9a-f]{32}/i,
    /\%20/,
    /^[0-9]+\([0-9]+\)/,
    /^64b[0-9a-f]+_/,
  ];

  return uglyPatterns.some(pattern => pattern.test(title));
}

async function main() {
  const args = process.argv.slice(2);

  let dryRun = false;
  let limit: number | null = null;
  let filter: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--limit') {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--filter') {
      filter = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Script to fix ugly document titles

Usage:
  tsx scripts/fix-document-titles.ts [options]

Options:
  --dry-run          Show what would be changed without updating
  --limit <number>   Limit number of documents to process
  --filter <string>  Only process titles containing this string

Examples:
  tsx scripts/fix-document-titles.ts --dry-run
  tsx scripts/fix-document-titles.ts --filter "administrator" --limit 50
`);
      process.exit(0);
    }
  }

  console.log('\n🔧 Document Title Fixer\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Fetch documents with ugly titles
  console.log('📋 Fetching documents...');

  let query = db.select().from(documents);

  if (filter) {
    query = query.where(like(documents.title, `%${filter}%`)) as any;
  }

  const allDocs = await query;

  // Filter for ugly titles
  const docsToFix = allDocs.filter(doc => shouldFixTitle(doc.title));

  if (limit) {
    docsToFix.splice(limit);
  }

  console.log(`   Found ${allDocs.length} total documents`);
  console.log(`   ${docsToFix.length} need title fixes\n`);

  if (docsToFix.length === 0) {
    console.log('✅ No documents need fixing!');
    process.exit(0);
  }

  console.log('═'.repeat(60));

  let fixed = 0;
  let failed = 0;

  for (let i = 0; i < docsToFix.length; i++) {
    const doc = docsToFix[i];
    console.log(`\n[${i + 1}/${docsToFix.length}] ${doc.title}`);

    try {
      // Generate new title
      process.stdout.write('   🤖 Generating title... ');
      const newTitle = await generateProperTitle(doc.content, doc.title);
      console.log('✓');

      console.log(`   Old: "${doc.title}"`);
      console.log(`   New: "${newTitle}"`);

      if (!dryRun) {
        // Update document title
        await db
          .update(documents)
          .set({ title: newTitle })
          .where(eq(documents.id, doc.id));

        // Also update bill title if it exists
        const [bill] = await db
          .select()
          .from(bills)
          .where(eq(bills.originalText, doc.content))
          .limit(1);

        if (bill) {
          await db
            .update(bills)
            .set({ title: newTitle })
            .where(eq(bills.id, bill.id));
          console.log('   ✓ Updated document and bill');
        } else {
          console.log('   ✓ Updated document');
        }
      }

      fixed++;

      // Small delay to avoid rate limits
      if (i < docsToFix.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error: any) {
      console.error(`   ❌ Failed: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   ✅ Fixed: ${fixed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📁 Total: ${docsToFix.length}`);

  if (dryRun) {
    console.log('\n💡 Run without --dry-run to apply changes');
  } else {
    console.log('\n✅ All titles updated!');
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
