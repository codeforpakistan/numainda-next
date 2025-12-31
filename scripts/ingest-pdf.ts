#!/usr/bin/env tsx

/**
 * CLI Script to ingest PDF files into Numainda database
 *
 * Usage:
 *   tsx scripts/ingest-pdf.ts <pdf-path> --title "Document Title" --type bill [options]
 *
 * Required:
 *   pdf-path                    Path to the PDF file
 *   --title <string>            Title of the document
 *   --type <string>             Type: bill, constitution, election_law, parliamentary_bulletin
 *
 * Optional (for bills):
 *   --bill-number <string>      Bill number (e.g., "Bill No. 123")
 *   --session-number <string>   Session number
 *   --status <string>           Status: pending, passed, rejected (default: passed)
 *   --passage-date <string>     Passage date (YYYY-MM-DD)
 *
 * Optional (for parliamentary bulletins):
 *   --date <string>             Bulletin date (YYYY-MM-DD)
 *
 * Examples:
 *   tsx scripts/ingest-pdf.ts ./my-bill.pdf --title "Finance Bill 2024" --type bill --status passed
 *   tsx scripts/ingest-pdf.ts ./bulletin.pdf --title "Daily Bulletin" --type parliamentary_bulletin --date 2024-12-31
 */

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { db } from '../lib/db';
import { documents } from '../lib/db/schema/documents';
import { embeddings as embeddingsTable } from '../lib/db/schema/embeddings';
import { bills } from '../lib/db/schema/bills';
import { generateEmbeddings } from '../lib/ai/embedding';
import { createProceeding } from '../lib/proceedings';
import { nanoid } from 'nanoid';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to detect section headers
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

// Helper function to detect timestamps or dates
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
  console.log('📄 Loading PDF...');
  const loader = new PDFLoader(filePath, {
    splitPages: true,
    parsedItemSeparator: '\n',
  });

  const docs = await loader.load();
  console.log(`✓ Loaded ${docs.length} pages`);
  return docs.map(d => d.pageContent).join('\n');
}

async function generateBillSummary(text: string): Promise<string> {
  console.log('🤖 Generating AI summary...');
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
  console.log('🤖 Generating proceeding summary...');
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
            content: 'You are an expert in parliamentary proceedings. Summarize the key discussions, decisions, and actions from this parliamentary bulletin.'
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

async function ingestDocument(options: {
  filePath: string;
  title: string;
  type: string;
  billNumber?: string;
  sessionNumber?: string;
  status?: string;
  passageDate?: string;
  bulletinDate?: string;
}) {
  const { filePath, title, type } = options;

  console.log('\n🚀 Starting PDF ingestion...');
  console.log(`   File: ${filePath}`);
  console.log(`   Title: ${title}`);
  console.log(`   Type: ${type}\n`);

  // Extract text
  const text = await extractTextFromPDF(filePath);
  console.log(`✓ Extracted ${text.length} characters\n`);

  // Create document record
  console.log('💾 Creating document record...');
  const [document] = await db
    .insert(documents)
    .values({
      title,
      type,
      content: text,
      originalFileName: path.basename(filePath),
    })
    .returning();
  console.log(`✓ Document created with ID: ${document.id}\n`);

  // Split into chunks
  console.log('✂️  Splitting into chunks...');
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 300,
    separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],
    keepSeparator: true,
  });

  const chunks = await splitter.createDocuments([text]);
  console.log(`✓ Created ${chunks.length} chunks\n`);

  // Generate embeddings in batches
  console.log('🔮 Generating embeddings...');
  const batchSize = 5;
  const embeddingsArray = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(chunks.length / batchSize);

    process.stdout.write(`   Batch ${batchNum}/${totalBatches}... `);

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
    console.log('✓');

    // Delay between batches
    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Store embeddings
  console.log('\n💾 Storing embeddings...');
  await db.insert(embeddingsTable).values(
    embeddingsArray.flat().map(({ embedding, content, metadata }) => ({
      id: nanoid(),
      resourceId: document.id,
      embedding,
      content,
      metadata
    }))
  );
  console.log(`✓ Stored ${embeddingsArray.flat().length} embeddings\n`);

  // Handle document type-specific processing
  if (type === 'bill') {
    console.log('📋 Processing as bill...');
    const summary = await generateBillSummary(text);

    await db.insert(bills).values({
      title,
      status: options.status || 'passed',
      summary,
      originalText: text,
      billNumber: options.billNumber || null,
      sessionNumber: options.sessionNumber || null,
      passageDate: options.passageDate ? new Date(options.passageDate) : null,
    });
    console.log('✓ Bill record created\n');
  } else if (type === 'parliamentary_bulletin') {
    console.log('📰 Processing as parliamentary bulletin...');
    const summary = await generateProceedingSummary(text);

    await createProceeding({
      title,
      date: options.bulletinDate || new Date().toISOString().split('T')[0],
      summary,
      originalText: text,
    });
    console.log('✓ Proceeding record created\n');
  }

  console.log('✅ Ingestion complete!');
  console.log(`   Document ID: ${document.id}`);
  console.log(`   Total embeddings: ${embeddingsArray.flat().length}`);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
CLI Script to ingest PDF files into Numainda database

Usage:
  tsx scripts/ingest-pdf.ts <pdf-path> --title "Document Title" --type bill [options]

Required:
  pdf-path                    Path to the PDF file
  --title <string>            Title of the document
  --type <string>             Type: bill, constitution, election_law, parliamentary_bulletin

Optional (for bills):
  --bill-number <string>      Bill number
  --session-number <string>   Session number
  --status <string>           Status: pending, passed, rejected (default: passed)
  --passage-date <string>     Passage date (YYYY-MM-DD)

Optional (for parliamentary bulletins):
  --date <string>             Bulletin date (YYYY-MM-DD)

Examples:
  tsx scripts/ingest-pdf.ts ./my-bill.pdf --title "Finance Bill 2024" --type bill --status passed
  tsx scripts/ingest-pdf.ts ./bulletin.pdf --title "Daily Bulletin" --type parliamentary_bulletin --date 2024-12-31
`);
    process.exit(0);
  }

  const filePath = args[0];
  const options: any = { filePath };

  for (let i = 1; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];

    switch (key) {
      case 'title':
        options.title = value;
        break;
      case 'type':
        options.type = value;
        break;
      case 'bill-number':
        options.billNumber = value;
        break;
      case 'session-number':
        options.sessionNumber = value;
        break;
      case 'status':
        options.status = value;
        break;
      case 'passage-date':
        options.passageDate = value;
        break;
      case 'date':
        options.bulletinDate = value;
        break;
    }
  }

  // Validate required fields
  if (!options.title) {
    console.error('❌ Error: --title is required');
    process.exit(1);
  }

  if (!options.type) {
    console.error('❌ Error: --type is required');
    process.exit(1);
  }

  const validTypes = ['bill', 'constitution', 'election_law', 'parliamentary_bulletin'];
  if (!validTypes.includes(options.type)) {
    console.error(`❌ Error: --type must be one of: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found: ${filePath}`);
    process.exit(1);
  }

  return options;
}

// Main execution
async function main() {
  try {
    const options = parseArgs();
    await ingestDocument(options);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
