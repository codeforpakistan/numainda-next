#!/usr/bin/env tsx

/**
 * Orders of the Day Crawler & Vectorizer
 *
 * Scrapes https://na.gov.pk/en/ordersoftheday.php to extract PDF links,
 * downloads PDFs, and ingests them into the Numainda database using the
 * existing document processing pipeline.
 *
 * Usage:
 *   tsx scripts/scrape-orders-of-the-day.ts [options]
 *
 * Options:
 *   --scrape-only       Only scrape metadata + download PDFs, don't ingest
 *   --ingest-only       Only ingest already-downloaded PDFs
 *   --skip-existing     Skip files already in database
 *   --dry-run           Preview what would be processed
 *   --limit <n>         Process only first N orders
 *   --session <name>    Only process a specific session (partial match)
 *
 * Examples:
 *   tsx scripts/scrape-orders-of-the-day.ts
 *   tsx scripts/scrape-orders-of-the-day.ts --scrape-only --limit 3
 *   tsx scripts/scrape-orders-of-the-day.ts --ingest-only --limit 2
 *   tsx scripts/scrape-orders-of-the-day.ts --session "23rd Session"
 */

import { chromium, type Browser } from 'playwright';
import fs from 'fs/promises';
import { existsSync, createWriteStream } from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { db } from '../lib/db';
import { documents } from '../lib/db/schema/documents';
import { embeddings as embeddingsTable } from '../lib/db/schema/embeddings';
import { generateEmbeddings } from '../lib/ai/embedding';
import { createProceeding } from '../lib/proceedings';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

// ─── Constants ───────────────────────────────────────────────────────────────

const BASE_URL = 'https://na.gov.pk';
const ORDERS_URL = `${BASE_URL}/en/ordersoftheday.php`;
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'orders-of-the-day');
const PDFS_DIR = path.join(OUTPUT_DIR, 'pdfs');
const METADATA_FILE = path.join(OUTPUT_DIR, 'orders-metadata.json');
const DELAY_BETWEEN_TABS = 500;
const DELAY_BETWEEN_DOWNLOADS = 1000;

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderMetadata {
  session: string;
  dateText: string;
  date: string; // YYYY-MM-DD
  pdfUrl: string;
  fileName: string;
  downloaded: boolean;
  ingested: boolean;
}

// ─── CLI Argument Parsing ────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Orders of the Day Crawler & Vectorizer

Usage:
  tsx scripts/scrape-orders-of-the-day.ts [options]

Options:
  --scrape-only       Only scrape metadata + download PDFs, don't ingest
  --ingest-only       Only ingest already-downloaded PDFs
  --skip-existing     Skip files already in database
  --dry-run           Preview what would be processed
  --limit <n>         Process only first N orders
  --session <name>    Only process a specific session (partial match)

Examples:
  tsx scripts/scrape-orders-of-the-day.ts
  tsx scripts/scrape-orders-of-the-day.ts --scrape-only
  tsx scripts/scrape-orders-of-the-day.ts --ingest-only --limit 5
  tsx scripts/scrape-orders-of-the-day.ts --session "23rd Session"
`);
    process.exit(0);
  }

  const options = {
    scrapeOnly: false,
    ingestOnly: false,
    skipExisting: false,
    dryRun: false,
    limit: 0,
    session: '',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--scrape-only':
        options.scrapeOnly = true;
        break;
      case '--ingest-only':
        options.ingestOnly = true;
        break;
      case '--skip-existing':
        options.skipExisting = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--limit':
        options.limit = parseInt(args[++i], 10);
        break;
      case '--session':
        options.session = args[++i];
        break;
    }
  }

  return options;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse date text like "Friday, the 23rd January, 2026" → "2026-01-23"
 */
function parseDateText(dateText: string): string {
  const months: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04',
    may: '05', june: '06', july: '07', august: '08',
    september: '09', october: '10', november: '11', december: '12',
  };

  // Normalize whitespace and commas: "January , 2026" → "January, 2026"
  // Also handle "Monday,the" → "Monday, the"
  const normalized = dateText.replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ');

  const match = normalized.match(/(\d{1,2})\w*\s+(\w+),?\s+(\d{4})/);
  if (!match) return new Date().toISOString().split('T')[0];

  const day = match[1].padStart(2, '0');
  const month = months[match[2].toLowerCase()] || '01';
  const year = match[3];

  return `${year}-${month}-${day}`;
}

/**
 * Generate a safe filename from session name and date
 * e.g., "23rd Session" + "2026-01-22" → "23rd-session-2026-01-22.pdf"
 */
function generateFileName(session: string, date: string): string {
  const sessionSlug = session
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${sessionSlug}-${date}.pdf`;
}

/**
 * Download a file from URL to local path
 */
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const protocol = fullUrl.startsWith('https') ? https : http;

    protocol.get(fullUrl, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} for ${fullUrl}`));
        return;
      }

      const fileStream = createWriteStream(destPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

// ─── Ingestion helpers (from batch-ingest.ts) ────────────────────────────────

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
    /\b(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\b/,
  ];

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

async function generateProceedingSummary(text: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert in parliamentary proceedings. Summarize the key discussions, decisions, and actions from this parliamentary Order of the Day document in a detailed manner.',
          },
          {
            role: 'user',
            content: `Please provide a detailed summary of this Order of the Day: ${text.substring(0, 8000)}`,
          },
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
    console.error('  ⚠️  Error generating summary:', error.message);
    return 'Summary generation failed.';
  }
}

async function checkIfProcessed(fileName: string): Promise<boolean> {
  const existing = await db
    .select()
    .from(documents)
    .where(eq(documents.originalFileName, fileName))
    .limit(1);
  return existing.length > 0;
}

// ─── Step 1: Scrape ─────────────────────────────────────────────────────────

async function scrapeMetadata(): Promise<OrderMetadata[]> {
  console.log('🌐 Launching browser...');
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    });
    const page = await context.newPage();

    console.log('📄 Navigating to Orders of the Day page...');
    await page.goto(ORDERS_URL, { waitUntil: 'networkidle', timeout: 60000 });

    // Get all session tabs
    const tabs = await page.$$('div[role="tablist"] > div[role="tab"], [role="tablist"] > h3[role="tab"]');

    // Fallback: try a broader selector if none found
    let tabElements = tabs;
    if (tabElements.length === 0) {
      // The tabs are within a tablist; use evaluate to find them
      tabElements = await page.$$('[role="tab"]');
    }

    console.log(`📋 Found ${tabElements.length} session tabs\n`);

    const allOrders: OrderMetadata[] = [];

    for (let i = 0; i < tabElements.length; i++) {
      const tab = tabElements[i];
      const tabText = (await tab.textContent())?.trim() || '';

      // Extract session name from the strong element or full text
      const sessionName = tabText.replace(/\s+/g, ' ').trim();

      console.log(`[${i + 1}/${tabElements.length}] ${sessionName}`);

      // Click to expand the tab
      await tab.click();
      await delay(DELAY_BETWEEN_TABS);

      // Find the visible tabpanel that appeared after clicking
      const panelLinks = await page.evaluate(() => {
        // Find the currently visible/active tabpanel
        const panels = document.querySelectorAll('[role="tabpanel"]');
        for (const panel of panels) {
          // Check if panel is visible (has display !== none and has content)
          const style = window.getComputedStyle(panel);
          if (style.display !== 'none' && panel.querySelectorAll('a').length > 0) {
            const links = Array.from(panel.querySelectorAll('a'));
            return links.map(link => ({
              text: link.textContent?.trim() || '',
              href: link.getAttribute('href') || '',
            }));
          }
        }
        return [];
      });

      for (const link of panelLinks) {
        if (!link.href || !link.href.includes('.pdf')) continue;

        // Resolve relative URL
        let pdfUrl = link.href;
        if (pdfUrl.startsWith('../')) {
          pdfUrl = `${BASE_URL}/${pdfUrl.replace('../', '')}`;
        } else if (pdfUrl.startsWith('/')) {
          pdfUrl = `${BASE_URL}${pdfUrl}`;
        } else if (!pdfUrl.startsWith('http')) {
          pdfUrl = `${BASE_URL}/en/${pdfUrl}`;
        }

        const dateText = link.text;
        const date = parseDateText(dateText);
        const fileName = generateFileName(sessionName, date);

        allOrders.push({
          session: sessionName,
          dateText,
          date,
          pdfUrl,
          fileName,
          downloaded: false,
          ingested: false,
        });
      }

      console.log(`   Found ${panelLinks.filter(l => l.href.includes('.pdf')).length} PDF(s)`);
    }

    console.log(`\n✅ Scraped ${allOrders.length} total orders across ${tabElements.length} sessions`);
    return allOrders;
  } finally {
    if (browser) {
      await browser.close();
      console.log('🌐 Browser closed\n');
    }
  }
}

// ─── Step 2: Download PDFs ──────────────────────────────────────────────────

async function downloadPDFs(orders: OrderMetadata[]): Promise<void> {
  await fs.mkdir(PDFS_DIR, { recursive: true });

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const destPath = path.join(PDFS_DIR, order.fileName);

    // Skip already downloaded
    if (existsSync(destPath)) {
      order.downloaded = true;
      skipped++;
      continue;
    }

    process.stdout.write(
      `[${i + 1}/${orders.length}] Downloading ${order.fileName}... `
    );

    try {
      await downloadFile(order.pdfUrl, destPath);
      order.downloaded = true;
      downloaded++;
      console.log('✓');
    } catch (error: any) {
      console.log(`✗ (${error.message})`);
      failed++;
    }

    // Respectful delay
    if (i < orders.length - 1) {
      await delay(DELAY_BETWEEN_DOWNLOADS);
    }

    // Save progress every 20 downloads
    if ((downloaded + failed) % 20 === 0 && (downloaded + failed) > 0) {
      await saveMetadata(orders);
    }
  }

  console.log(`\n📊 Download summary:`);
  console.log(`   ✅ Downloaded: ${downloaded}`);
  console.log(`   ⏭️  Already existed: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}\n`);
}

// ─── Step 3: Ingest into database ───────────────────────────────────────────

async function ingestOrders(
  orders: OrderMetadata[],
  options: { skipExisting: boolean; dryRun: boolean }
): Promise<void> {
  const toIngest = orders.filter(o => o.downloaded);
  console.log(`📥 Ingesting ${toIngest.length} downloaded PDFs...\n`);

  if (options.dryRun) {
    console.log('🔍 DRY RUN - Files that would be ingested:\n');
    for (const order of toIngest) {
      const alreadyProcessed = await checkIfProcessed(order.fileName);
      const status =
        alreadyProcessed && options.skipExisting ? '⏭️  SKIP' : '✅ INGEST';
      console.log(`${status} ${order.fileName}`);
      console.log(`         Session: ${order.session} | Date: ${order.date}\n`);
    }
    console.log('Run without --dry-run to ingest files.');
    return;
  }

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  console.log('═'.repeat(60));

  for (let i = 0; i < toIngest.length; i++) {
    const order = toIngest[i];
    const filePath = path.join(PDFS_DIR, order.fileName);

    console.log(`\n[${i + 1}/${toIngest.length}] ${order.fileName}`);
    console.log(`   Session: ${order.session} | Date: ${order.date}`);

    // Check if already in database
    if (options.skipExisting && (await checkIfProcessed(order.fileName))) {
      console.log('   ⏭️  Skipping (already in database)');
      order.ingested = true;
      skipped++;
      continue;
    }

    try {
      // Extract text from PDF
      const loader = new PDFLoader(filePath, {
        splitPages: true,
        parsedItemSeparator: '\n',
      });
      const docs = await loader.load();
      const text = docs.map(d => d.pageContent).join('\n');
      console.log(
        `   ✓ Extracted ${text.length.toLocaleString()} characters from ${docs.length} pages`
      );

      // Create document record
      const title = `Order of the Day - ${order.dateText || order.date} (${order.session})`;

      const [document] = await db
        .insert(documents)
        .values({
          title,
          type: 'parliamentary_bulletin',
          content: text,
          originalFileName: order.fileName,
        })
        .returning();

      // Split into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,
        chunkOverlap: 300,
        separators: ['\n\n', '\n', '.', '!', '?', ',', ' ', ''],
        keepSeparator: true,
      });

      const chunks = await splitter.createDocuments([text]);
      console.log(`   ✓ Created ${chunks.length} chunks`);

      // Generate embeddings in batches
      process.stdout.write('   🔮 Embeddings: ');
      const batchSize = 5;
      const embeddingsArray = [];

      for (let j = 0; j < chunks.length; j += batchSize) {
        const batch = chunks.slice(j, j + batchSize);

        const batchEmbeddings = await Promise.all(
          batch.map(chunk =>
            generateEmbeddings({
              pageContent: chunk.pageContent,
              metadata: {
                pageNumber: chunk.metadata.pageNumber || 1,
                section: detectSection(chunk.pageContent),
                timestamp: detectTimestamp(chunk.pageContent),
              },
            })
          )
        );

        embeddingsArray.push(...batchEmbeddings);
        process.stdout.write('▓');

        if (j + batchSize < chunks.length) {
          await delay(1000);
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
          metadata,
        }))
      );

      // Generate summary and create proceeding record
      process.stdout.write('   🤖 Proceeding Summary: ');
      const summary = await generateProceedingSummary(text);

      await createProceeding({
        title,
        date: order.date,
        summary,
        originalText: text,
      });
      console.log(`✓ (${order.date})`);

      console.log(`   ✅ Complete (ID: ${document.id})`);

      order.ingested = true;
      processed++;
    } catch (error: any) {
      console.error(`   ❌ Failed: ${error.message}`);
      failed++;
    }

    // Save metadata progress periodically
    if ((i + 1) % 10 === 0) {
      await saveMetadata(orders);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Ingestion summary:');
  console.log(`   ✅ Processed: ${processed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📁 Total: ${toIngest.length}\n`);
}

// ─── Metadata persistence ────────────────────────────────────────────────────

async function saveMetadata(orders: OrderMetadata[]): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(METADATA_FILE, JSON.stringify(orders, null, 2));
}

async function loadMetadata(): Promise<OrderMetadata[] | null> {
  try {
    const data = await fs.readFile(METADATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 Orders of the Day - Crawler & Vectorizer\n');

  const options = parseArgs();
  let allOrders: OrderMetadata[];

  // Step 1: Scrape metadata (unless --ingest-only)
  if (options.ingestOnly) {
    console.log('📂 Loading existing metadata...');
    const existing = await loadMetadata();
    if (!existing) {
      console.error(
        '❌ No metadata found. Run without --ingest-only first to scrape.'
      );
      process.exit(1);
    }
    allOrders = existing;
    console.log(`   Loaded ${allOrders.length} orders from metadata\n`);
  } else {
    allOrders = await scrapeMetadata();
    await saveMetadata(allOrders);
    console.log(`💾 Saved metadata to ${METADATA_FILE}\n`);
  }

  // Apply session filter and limit for the working set
  let workingOrders = allOrders;

  if (options.session) {
    const before = workingOrders.length;
    workingOrders = workingOrders.filter(o =>
      o.session.toLowerCase().includes(options.session.toLowerCase())
    );
    console.log(
      `🔍 Filtered to session "${options.session}": ${workingOrders.length}/${before} orders\n`
    );
  }

  if (options.limit > 0) {
    workingOrders = workingOrders.slice(0, options.limit);
    console.log(`📋 Limited to first ${workingOrders.length} orders\n`);
  }

  // Step 2: Download PDFs (unless --ingest-only)
  if (!options.ingestOnly) {
    console.log('📥 Downloading PDFs...\n');
    await downloadPDFs(workingOrders);
    await saveMetadata(allOrders);
  } else {
    // Mark already-downloaded files
    for (const order of workingOrders) {
      const destPath = path.join(PDFS_DIR, order.fileName);
      order.downloaded = existsSync(destPath);
    }
  }

  // Step 3: Ingest into database (unless --scrape-only)
  if (!options.scrapeOnly) {
    await ingestOrders(workingOrders, {
      skipExisting: options.skipExisting,
      dryRun: options.dryRun,
    });
    await saveMetadata(allOrders);
  }

  console.log('✨ Done!\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
