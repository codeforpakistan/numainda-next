# Numainda Scripts

## PDF Ingestion Script

Ingest PDF files directly into the Numainda database with automatic vectorization.

### Quick Start

```bash
# Using npm script (recommended)
npm run ingest ./my-bill.pdf -- --title "Finance Bill 2024" --type bill --status passed

# Or directly with tsx
tsx scripts/ingest-pdf.ts ./my-bill.pdf --title "Finance Bill 2024" --type bill --status passed
```

### Usage

```bash
npm run ingest <pdf-path> -- --title "Title" --type <type> [options]
```

### Required Arguments

- `pdf-path` - Path to the PDF file
- `--title <string>` - Title of the document
- `--type <string>` - Document type:
  - `bill` - Legislative bills and acts
  - `constitution` - Constitution documents
  - `election_law` - Election law documents
  - `parliamentary_bulletin` - Daily parliamentary bulletins

### Optional Arguments (for bills)

- `--bill-number <string>` - Bill number (e.g., "Bill No. 123")
- `--session-number <string>` - Session number
- `--status <string>` - Status: `pending`, `passed`, or `rejected` (default: `passed`)
- `--passage-date <string>` - Passage date in YYYY-MM-DD format

### Optional Arguments (for parliamentary bulletins)

- `--date <string>` - Bulletin date in YYYY-MM-DD format

### Examples

#### Ingest a passed bill
```bash
npm run ingest ./bills/finance-2024.pdf -- \
  --title "Finance Bill 2024" \
  --type bill \
  --status passed \
  --bill-number "Bill No. 45" \
  --session-number "Session 2024" \
  --passage-date 2024-12-15
```

#### Ingest a parliamentary bulletin
```bash
npm run ingest ./bulletins/daily-2024-12-31.pdf -- \
  --title "Daily Parliamentary Bulletin" \
  --type parliamentary_bulletin \
  --date 2024-12-31
```

#### Ingest election law
```bash
npm run ingest ./laws/election-act.pdf -- \
  --title "Election Act 2017" \
  --type election_law
```

### What It Does

1. **Extracts text** from the PDF using LangChain's PDFLoader
2. **Creates a document record** in the database
3. **Splits text into chunks** (1500 chars with 300 char overlap)
4. **Generates embeddings** using OpenAI's text-embedding-ada-002
5. **Stores embeddings** in the database with metadata (sections, timestamps)
6. **Creates type-specific records**:
   - For bills: Creates a bill record with AI-generated summary
   - For bulletins: Creates a proceeding record with AI summary
7. **Makes content searchable** via RAG in the chat interface

### Requirements

Make sure your `.env` file has:
```bash
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
```

### Output

The script provides progress output:
```
🚀 Starting PDF ingestion...
📄 Loading PDF...
✓ Loaded 15 pages
✓ Extracted 45230 characters
💾 Creating document record...
✓ Document created with ID: abc123
✂️  Splitting into chunks...
✓ Created 32 chunks
🔮 Generating embeddings...
   Batch 1/7... ✓
   Batch 2/7... ✓
   ...
💾 Storing embeddings...
✓ Stored 32 embeddings
📋 Processing as bill...
🤖 Generating AI summary...
✓ Bill record created
✅ Ingestion complete!
```

## Batch Processing

Process multiple PDFs at once from a directory.

### Quick Start

```bash
# Process all PDFs in docs/ folder
npm run ingest:batch

# Process from specific directory
npm run ingest:batch ./my-bills

# Skip files already in database
npm run ingest:batch -- --skip-existing

# Preview what would be processed
npm run ingest:batch -- --dry-run
```

### Usage

```bash
npm run ingest:batch [directory] [options]
```

### Arguments

- `directory` - Directory containing PDFs (default: `./docs`)
- `--type <string>` - Document type for all files (default: `bill`)
  - Options: `bill`, `constitution`, `election_law`, `parliamentary_bulletin`
- `--status <string>` - Bill status for all files (default: `passed`)
  - Only used for bills: `pending`, `passed`, `rejected`
- `--date <string>` - Date for parliamentary bulletins (YYYY-MM-DD)
  - If not provided, extracts from filename or uses today's date
- `--skip-existing` - Skip files already in database
- `--dry-run` - Show what would be processed without actually processing

### Examples

```bash
# Process all bills in docs/ folder
npm run ingest:batch

# Process and skip existing files
npm run ingest:batch -- --skip-existing

# Preview before processing
npm run ingest:batch -- --dry-run

# Process from custom directory
npm run ingest:batch ./bills-2025 -- --type bill --status passed

# Process parliamentary bulletins
npm run ingest:batch ./bulletins -- --type parliamentary_bulletin

# Process bulletins with specific date (if not in filename)
npm run ingest:batch ./bulletins -- --type parliamentary_bulletin --date 2024-12-31
```

### What It Does

1. Scans directory for all PDF files
2. Extracts title from filename automatically
3. Processes each file sequentially
4. Shows progress bar for embeddings
5. Provides summary at the end

### Output

```
🚀 Batch PDF Ingestion

📂 Found 5 PDF file(s) in: ./docs
📋 Type: bill | Status: passed

[1/5] Finance Bill 2024.pdf
   ✓ Extracted 45,230 characters from 15 pages
   ✓ Created 32 chunks
   🔮 Embeddings: ▓▓▓▓▓▓▓ ✓ (32)
   🤖 Summary: ✓
   ✅ Complete (ID: abc123)

...

📊 Summary:
   ✅ Processed: 4
   ⏭️  Skipped: 1
   ❌ Failed: 0
   📁 Total: 5
```

### Troubleshooting

**Rate Limit Errors**: The script batches embeddings (5 per batch with 1s delay) to avoid OpenAI rate limits. If you still hit limits, reduce the batch size in the script.

**Database Connection**: Ensure your DATABASE_URL is correct and the database is accessible.

**Large PDFs**: Very large PDFs may take several minutes to process. Be patient!
