#!/usr/bin/env tsx

/**
 * Batch PDF Ingestion Script
 *
 * Processes all PDF files in a directory and ingests them into Numainda database
 *
 * Usage:
 *   tsx scripts/batch-ingest.ts [directory] [options]
 *
 * Arguments:
 *   directory                   Directory containing PDFs (default: ./docs)
 *   --type <string>            Document type for all files (default: bill)
 *   --status <string>          Bill status for all files (default: passed)
 *   --skip-existing            Skip files that are already in database
 *   --dry-run                  Show what would be processed without processing
 *
 * Examples:
 *   tsx scripts/batch-ingest.ts
 *   tsx scripts/batch-ingest.ts ./docs --type bill --status passed
 *   tsx scripts/batch-ingest.ts ./docs --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { db } from '../lib/db';
import { documents } from '../lib/db/schema/documents';
import { embeddings as embeddingsTable } from '../lib/db/schema/embeddings';
import { bills } from '../lib/db/schema/bills';
import { generateEmbeddings } from '../lib/ai/embedding';
import { createProceeding } from '../lib/proceedings';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

// Helper functions (same as ingest-pdf.ts)
function detectSection(content: string): string | null {
  const sectionPatterns = [
    /^#{1,6}\s+(.+)$/m,
    /^([A-Z][A-Za-z\s]{2,}:)/m,
    /^(\d+\.\d*\s+[A-Z][A-Za-z\s]{2,})/m,
    /^([A-Z][A-Za-z\s]{2,})$/m,
  ];

  for (const pattern of sectionPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function detectTimestamp(content: string): string | null {
  const datePatterns = [
    /\b(\d{4}-\d{2}-\d{2})\b/,
    /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/,
    /\b(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\b/
  ];

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

async function extractTextFromPDF(filePath: string): Promise<string> {
  const loader = new PDFLoader(filePath, {
    splitPages: true,
    parsedItemSeparator: '\n',
  });

  const docs = await loader.load();
  return docs.map(d => d.pageContent).join('\n');
}

async function generateBillSummary(text: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a legal expert specializing in summarizing legislative bills. Create clear, concise summaries that highlight the key points, main objectives, and potential impacts of the bill.'
          },
          {
            role: 'user',
            content: `Please provide a concise summary of this bill: ${text.substring(0, 8000)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error: any) {
    console.error('⚠️  Error generating summary:', error.message);
    return 'Summary generation failed.';
  }
}

async function generateProceedingSummary(text: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in parliamentary proceedings. Summarize the key discussions, decisions, and actions from this parliamentary bulletin in a detailed manner.'
          },
          {
            role: 'user',
            content: `Please provide a detailed summary of this parliamentary proceeding: ${text.substring(0, 8000)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error: any) {
    console.error('⚠️  Error generating summary:', error.message);
    return 'Summary generation failed.';
  }
}

// Extract date from filename (e.g., "bulletin-2024-12-31.pdf" or "31-12-2024.pdf")
function extractDateFromFilename(fileName: string): string {
  const patterns = [
    /(\d{4}-\d{2}-\d{2})/,  // 2024-12-31
    /(\d{2}-\d{2}-\d{4})/,  // 31-12-2024
    /(\d{8})/,               // 20241231
  ];

  for (const pattern of patterns) {
    const match = fileName.match(pattern);
    if (match) {
      const dateStr = match[1];
      // Try to parse and format as YYYY-MM-DD
      if (dateStr.length === 8) {
        // Handle 20241231 format
        return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
      } else if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 4) {
          // Already YYYY-MM-DD
          return dateStr;
        } else if (parts[2].length === 4) {
          // DD-MM-YYYY, convert to YYYY-MM-DD
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
    }
  }

  // Default to today's date if no date found
  return new Date().toISOString().split('T')[0];
}

async function checkIfProcessed(fileName: string): Promise<boolean> {
  const existing = await db
    .select()
    .from(documents)
    .where(eq(documents.originalFileName, fileName))
    .limit(1);

  return existing.length > 0;
}

async function ingestDocument(options: {
  filePath: string;
  title: string;
  type: string;
  status?: string;
  date?: string;
  skipExisting?: boolean;
}) {
  const { filePath, title, type, status } = options;
  const fileName = path.basename(filePath);

  // Check if already processed
  if (options.skipExisting && await checkIfProcessed(fileName)) {
    console.log(`⏭️  Skipping (already processed): ${fileName}\n`);
    return { skipped: true };
  }

  console.log(`\n📄 Processing: ${fileName}`);
  console.log(`   Title: ${title}`);

  // Extract text
  const text = await extractTextFromPDF(filePath);
  const pages = text.split('\n').filter(l => l.includes('Page')).length || 'unknown';
  console.log(`   ✓ Extracted ${text.length.toLocaleString()} characters from ${pages} pages`);

  // Create document record
  const [document] = await db
    .insert(documents)
    .values({
      title,
      type,
      content: text,
      originalFileName: fileName,
    })
    .returning();

  // Split into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 300,
    separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],
    keepSeparator: true,
  });

  const chunks = await splitter.createDocuments([text]);
  console.log(`   ✓ Created ${chunks.length} chunks`);

  // Generate embeddings in batches
  process.stdout.write('   🔮 Embeddings: ');
  const batchSize = 5;
  const embeddingsArray = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    const batchEmbeddings = await Promise.all(
      batch.map(chunk => generateEmbeddings({
        pageContent: chunk.pageContent,
        metadata: {
          pageNumber: chunk.metadata.pageNumber || 1,
          section: detectSection(chunk.pageContent),
          timestamp: detectTimestamp(chunk.pageContent),
        }
      }))
    );

    embeddingsArray.push(...batchEmbeddings);
    process.stdout.write('▓');

    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  console.log(` ✓ (${embeddingsArray.flat().length})`);

  // Store embeddings
  await db.insert(embeddingsTable).values(
    embeddingsArray.flat().map(({ embedding, content, metadata }) => ({
      id: nanoid(),
      resourceId: document.id,
      embedding,
      content,
      metadata
    }))
  );

  // Handle document type-specific processing
  if (type === 'bill') {
    process.stdout.write('   🤖 Bill Summary: ');
    const summary = await generateBillSummary(text);

    await db.insert(bills).values({
      title,
      status: status || 'passed',
      summary,
      originalText: text,
      billNumber: null,
      sessionNumber: null,
      passageDate: null,
    });
    console.log('✓');
  } else if (type === 'parliamentary_bulletin') {
    process.stdout.write('   🤖 Proceeding Summary: ');
    const summary = await generateProceedingSummary(text);

    // Extract or use provided date
    const bulletinDate = options.date || extractDateFromFilename(fileName);

    await createProceeding({
      title,
      date: bulletinDate,
      summary,
      originalText: text,
    });
    console.log(`✓ (${bulletinDate})`);
  }

  console.log(`   ✅ Complete (ID: ${document.id})`);

  return {
    skipped: false,
    documentId: document.id,
    embeddings: embeddingsArray.flat().length
  };
}

// Extract title from filename
function extractTitle(fileName: string): string {
  // Remove .pdf extension
  let title = fileName.replace(/\.pdf$/i, '');

  // Replace common separators with spaces
  title = title.replace(/[_-]/g, ' ');

  // Capitalize properly
  title = title.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return title;
}

// Get all PDF files in directory
function getPDFFiles(directory: string): string[] {
  try {
    const files = fs.readdirSync(directory);
    return files
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(file => path.join(directory, file))
      .sort();
  } catch (error) {
    console.error(`❌ Error reading directory: ${directory}`);
    return [];
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Batch PDF Ingestion Script

Usage:
  tsx scripts/batch-ingest.ts [directory] [options]

Arguments:
  directory                   Directory containing PDFs (default: ./docs)
  --type <string>            Document type (default: bill)
  --status <string>          Bill status (default: passed)
  --limit <number>           Process only first N files
  --skip-existing            Skip files already in database
  --dry-run                  Preview without processing

Examples:
  tsx scripts/batch-ingest.ts
  tsx scripts/batch-ingest.ts ./docs --skip-existing
  tsx scripts/batch-ingest.ts ./my-bills --limit 100
  tsx scripts/batch-ingest.ts ./my-bills --type bill --status pending
`);
    process.exit(0);
  }

  const options: any = {
    directory: './docs',
    type: 'bill',
    status: 'passed',
    date: null,
    limit: null,
    skipExisting: false,
    dryRun: false,
  };

  // First non-flag argument is directory
  if (args[0] && !args[0].startsWith('--')) {
    options.directory = args[0];
  }

  // Parse flags
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type') {
      options.type = args[i + 1];
      i++;
    } else if (args[i] === '--status') {
      options.status = args[i + 1];
      i++;
    } else if (args[i] === '--date') {
      options.date = args[i + 1];
      i++;
    } else if (args[i] === '--limit') {
      options.limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--skip-existing') {
      options.skipExisting = true;
    } else if (args[i] === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
}

// Main execution
async function main() {
  console.log('\n🚀 Batch PDF Ingestion\n');

  const options = parseArgs();
  let pdfFiles = getPDFFiles(options.directory);

  if (pdfFiles.length === 0) {
    console.log(`❌ No PDF files found in: ${options.directory}`);
    process.exit(1);
  }

  const totalFiles = pdfFiles.length;

  // Apply limit if specified
  if (options.limit && options.limit > 0) {
    pdfFiles = pdfFiles.slice(0, options.limit);
    console.log(`📂 Found ${totalFiles} PDF file(s), processing first ${pdfFiles.length}`);
  } else {
    console.log(`📂 Found ${pdfFiles.length} PDF file(s) in: ${options.directory}`);
  }

  console.log(`📋 Type: ${options.type} | Status: ${options.status}\n`);

  if (options.dryRun) {
    console.log('🔍 DRY RUN - Files that would be processed:\n');
    for (const file of pdfFiles) {
      const fileName = path.basename(file);
      const title = extractTitle(fileName);
      const alreadyProcessed = await checkIfProcessed(fileName);
      const status = alreadyProcessed && options.skipExisting ? '⏭️  SKIP' : '✅ PROCESS';
      console.log(`${status} ${fileName}`);
      console.log(`         → ${title}\n`);
    }
    console.log('Run without --dry-run to process files.');
    process.exit(0);
  }

  console.log('═'.repeat(60));

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < pdfFiles.length; i++) {
    const file = pdfFiles[i];
    const fileName = path.basename(file);
    const title = extractTitle(fileName);

    console.log(`\n[${i + 1}/${pdfFiles.length}] ${fileName}`);

    try {
      const result = await ingestDocument({
        filePath: file,
        title,
        type: options.type,
        status: options.status,
        date: options.date,
        skipExisting: options.skipExisting,
      });

      if (result.skipped) {
        skipped++;
      } else {
        processed++;
      }
    } catch (error: any) {
      console.error(`   ❌ Failed: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   ✅ Processed: ${processed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📁 Total: ${pdfFiles.length}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
