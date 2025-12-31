# Numainda

Your Digital Gateway to Pakistan's Constitution and Legislative Knowledge - an AI-powered constitutional guide making legal knowledge accessible to all citizens.

## Overview

Numainda is an interactive platform that helps citizens learn about Pakistan's constitution and rights through natural conversations in simple language. Built with Next.js 13 and powered by RAG (Retrieval-Augmented Generation), it provides accurate information about Pakistan's constitution, election laws, and parliamentary proceedings.

## Key Features

- **AI-Powered Constitutional Guide**
  - Natural language conversations about legal topics
  - 24/7 constitutional guidance powered by GPT-4o-mini
  - RAG-based responses with source citations
  - Complex legal concepts explained in everyday terms
  - Bilingual support (English and Urdu)

- **Knowledge Areas**
  - Constitution of Pakistan
  - Election Laws
  - Parliamentary Bulletins and Daily Proceedings
  - Legislative Bills and Acts

- **Advanced Capabilities**
  - Vector similarity search using pgvector
  - Real-time streaming responses
  - Conversation thread persistence
  - OAuth authentication via Pehchan (Pakistan's national digital identity)
  - Document upload and processing with AI summarization

## Technology Stack

### Frontend
- Next.js 13 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI + Radix UI Components
- Vercel AI SDK
- next-themes (Dark mode)

### Backend
- PostgreSQL with pgvector extension
- Drizzle ORM
- OpenAI API (embeddings & chat)
- LangChain Community (PDF processing)

### Infrastructure
- AWS S3 (Document storage)
- Upstash QStash (Background job processing)
- Vercel (Hosting & Analytics)
- Pehchan OAuth (Authentication)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ with pgvector extension
- OpenAI API key
- AWS account (for S3)
- Pehchan OAuth credentials
- Upstash QStash account

### Installation

```bash
# Clone the repository
git clone https://github.com/codeforpakistan/numainda-next.git
cd numainda-next

# Install dependencies
npm install
```

### Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/numainda"

# OpenAI
OPENAI_API_KEY="sk-..."

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET_NAME="numainda-documents"

# QStash (Background job processing)
QSTASH_TOKEN="..."
QSTASH_CURRENT_SIGNING_KEY="..."
QSTASH_NEXT_SIGNING_KEY="..."

# Pehchan OAuth
NEXT_PUBLIC_PEHCHAN_URL="https://pehchan.nayatel.com"
NEXT_PUBLIC_CLIENT_ID="..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Change to production URL when deploying
```

### Database Setup

```bash
# Generate migrations from schema
npm run db:generate

# Run migrations
npm run db:migrate

# Or for rapid development, push schema directly
npm run db:push

# Open Drizzle Studio to inspect database
npm run db:studio
```

**Important**: Ensure the pgvector extension is installed and the HNSW index is created:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE INDEX ON embeddings USING hnsw (embedding vector_cosine_ops);
```

### Development

```bash
# Start development server (localhost:3000)
npm run dev

# Run type checking
npm run typecheck

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format:write

# Check formatting
npm run format:check
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Development Workflow

### Common Development Commands

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Build production bundle
npm run start                  # Start production server
npm run preview                # Build and start production

# Code Quality
npm run lint                   # Run ESLint
npm run lint:fix               # Fix linting issues
npm run typecheck              # TypeScript check
npm run format:write           # Format with Prettier
npm run format:check           # Check formatting

# Database (Drizzle ORM)
npm run db:generate            # Generate migrations
npm run db:migrate             # Run migrations
npm run db:push                # Push schema to database
npm run db:pull                # Pull schema from database
npm run db:studio              # Open Drizzle Studio GUI
npm run db:check               # Check migration consistency

# Testing
npm test                       # Run Jest tests
npm run test:watch             # Run tests in watch mode

# Document Ingestion
npm run ingest:batch           # Process all PDFs in docs/ folder
npm run ingest <pdf> -- --title "Title" --type bill  # Process single PDF
```

### Adding New Documents

#### Option 1: Batch Processing (Recommended for multiple files)

Process all PDFs in a directory at once:

```bash
# Process all bills in docs/ folder
npm run ingest:batch

# Process all bills and skip existing
npm run ingest:batch -- --skip-existing

# Process parliamentary bulletins
npm run ingest:batch ./bulletins -- --type parliamentary_bulletin

# Preview what would be processed
npm run ingest:batch -- --dry-run
```

**Supported document types**: `bill`, `parliamentary_bulletin`, `constitution`, `election_law`

The batch script automatically:
- Scans directory for all PDFs
- Extracts titles from filenames
- Processes each file sequentially
- Skips already-processed files (with `--skip-existing`)
- Provides progress summary

#### Option 2: Single File Processing

Process one PDF at a time:

```bash
# Ingest a legislative bill
npm run ingest ./bill.pdf -- \
  --title "Finance Bill 2024" \
  --type bill \
  --status passed \
  --bill-number "Bill No. 45" \
  --passage-date 2024-12-15

# Ingest parliamentary bulletin
npm run ingest ./bulletin.pdf -- \
  --title "Parliamentary Bulletin - 15 Dec 2024" \
  --type parliamentary_bulletin \
  --date 2024-12-15
```

**What the scripts do**:
- Extract text from PDF using LangChain
- Chunk text (1500 chars, 300 overlap)
- Generate embeddings with OpenAI (text-embedding-ada-002)
- Store in database with metadata
- Create AI summaries (GPT-4o for bills, detailed summaries for bulletins)
- Make content searchable via RAG in chat

**See `scripts/README.md` for complete CLI documentation.**

#### Option 3: Admin Interface (Web UI)

1. Navigate to `/admin/upload`
2. Upload PDF through the web interface
3. System automatically:
   - Uploads to S3
   - Queues async processing job via QStash
   - Extracts text and metadata
   - Generates embeddings
   - Creates AI summaries
4. Monitor progress in admin dashboard

### Database Schema Changes

When modifying the database schema:

1. Update schema files in `lib/db/schema/`
2. Generate migration: `npm run db:generate`
3. Review generated SQL in `lib/db/migrations/`
4. Apply migration: `npm run db:migrate`
5. For rapid iteration (skips migrations): `npm run db:push`

### Working with RAG (Retrieval-Augmented Generation)

To improve retrieval quality:

**Adjust chunk size/overlap** (`lib/actions/documents.ts`):
```typescript
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1500,      // Modify this
  chunkOverlap: 300     // Modify this
});
```

**Tune similarity threshold** (`lib/ai/embedding.ts`):
```typescript
const relevantContent = await findRelevantContent(query, {
  threshold: 0.75,  // Modify threshold (0-1)
  limit: 6          // Number of results
});
```

**Update system prompt** (`app/api/chat/route.tsx`):
- Modify the system message to change AI behavior
- Add constraints or formatting requirements
- Adjust citation style

## Architecture Overview

### Database Layer (Drizzle + PostgreSQL + pgvector)

**Schema**: `lib/db/schema/`

Key tables:
- `documents` - Core document storage (constitution, laws, bulletins)
- `embeddings` - Vector embeddings (1536-dim) with HNSW index
- `bills` - Legislative bills/acts with AI summaries
- `parliamentary-proceedings` - Daily proceedings with summaries
- `chat-threads` - User conversation history (JSONB messages)
- `document-uploads` - Upload tracking with async processing status

### RAG Pipeline

**Flow** (see `app/api/chat/route.tsx`):
1. Extract last user message
2. `findRelevantContent()` performs cosine similarity search (threshold > 0.75, top 6 results)
3. Format context with document titles, types, and sections
4. Stream response with GPT-4o-mini
5. Cite sources and admit when information is unavailable

**Document Processing** (`lib/actions/documents.ts`):
- LangChain PDFLoader extracts text with page metadata
- RecursiveCharacterTextSplitter: chunkSize=1500, chunkOverlap=300
- Section detection and timestamp extraction
- Batch embedding: 5 chunks at a time, 1s delay (rate limiting)
- Type-specific AI summarization

### Authentication (Pehchan OAuth)

**Login Flow** (`components/pehchan-button.tsx`):
1. Construct OAuth URL with client_id, redirect_uri, scope
2. User authenticates with Pehchan
3. Callback handler (`app/auth/callback/page.tsx`) receives tokens
4. Fetch user info, extract pehchan_id (CNIC)
5. Store in localStorage, redirect to /chat

**Session Management**:
- Client-side: localStorage stores tokens, user_info, pehchan_id
- Server-side: pehchan_id used for thread ownership verification

### API Routes

**Chat APIs** (`app/api/chat/`):
- `POST /api/chat` - Main chat with RAG streaming
- `GET /api/chat/threads` - List user's threads
- `POST /api/chat/threads` - Create new thread
- `GET /api/chat/threads/[id]` - Get thread (auth check)
- `PATCH /api/chat/threads/[id]` - Update messages/title
- `DELETE /api/chat/threads/[id]` - Delete thread

**Admin APIs** (`app/api/admin/`):
- `POST /api/admin/uploads` - Upload to S3, queue processing
- `PATCH /api/admin/uploads` - Update upload status
- `POST /api/admin/uploads/process` - QStash webhook for processing

**Other APIs**:
- `GET /api/bills` - Fetch all bills
- `POST /api/upload` - Simple S3 upload

### Async Processing (QStash)

**Upload flow** (`app/api/admin/uploads/process/route.ts`):
1. Admin uploads PDF via `/api/admin/uploads`
2. File uploaded to S3, record created in document-uploads
3. QStash job queued for processing
4. Worker fetches file, parses PDF, chunks text, generates embeddings
5. Creates document and bill/proceeding records with AI summaries
6. Updates upload status (completed/failed)

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

Make sure to:
1. Set all environment variables in Vercel dashboard
2. Connect PostgreSQL database (e.g., Supabase, Neon, RDS)
3. Update `NEXT_PUBLIC_APP_URL` to production URL
4. Configure QStash webhooks with production URLs

### Self-Hosting

```bash
# Build the application
npm run build

# Start production server
npm run start
```

Requirements:
- Node.js 18+ runtime
- PostgreSQL 14+ with pgvector
- All environment variables configured
- Reverse proxy (nginx/Apache) recommended

## Maintenance

### Regular Tasks

**Monitor API Usage**:
- OpenAI API usage (embeddings + chat completions)
- Check rate limits and adjust batching if needed

**Database Maintenance**:
```bash
# Vacuum and analyze tables
VACUUM ANALYZE embeddings;
VACUUM ANALYZE documents;

# Reindex for performance
REINDEX INDEX embeddings_embedding_idx;
```

**Document Updates**:
- Use CLI script or admin interface to add new documents
- Monitor upload status in admin dashboard
- Check QStash logs for processing failures

**Error Monitoring**:
- Check Vercel logs for API errors
- Monitor QStash webhook failures
- Review OpenAI API error rates

### Troubleshooting

**Embedding Rate Limits**:
If hitting OpenAI rate limits, adjust batching in `lib/actions/documents.ts`:
```typescript
// Current: 5 chunks per batch, 1s delay
const batchSize = 5;
await new Promise(resolve => setTimeout(resolve, 1000));
```

**Vector Search Performance**:
Ensure HNSW index exists:
```sql
CREATE INDEX ON embeddings USING hnsw (embedding vector_cosine_ops);
```

**Auth Token Expiry**:
Pehchan tokens expire. Users need to re-login. Consider implementing token refresh if needed.

**Upload Processing Failures**:
- Check QStash dashboard for failed jobs
- Verify S3 bucket permissions
- Ensure OpenAI API key is valid
- Check document format (only PDFs supported)

## Project Structure

```
numainda-next/
├── app/                          # Next.js 13 App Router
│   ├── api/                      # API routes
│   │   ├── chat/                 # Chat & thread management
│   │   ├── admin/                # Admin APIs (uploads, processing)
│   │   └── bills/                # Bills API
│   ├── chat/                     # Chat interface
│   ├── bills/                    # Bills listing & details
│   ├── proceedings/              # Parliamentary proceedings
│   ├── constitution/             # Constitution viewer
│   ├── admin/                    # Admin dashboard
│   └── auth/                     # OAuth callback
├── components/                   # React components
│   ├── ui/                       # Shadcn UI components
│   └── *.tsx                     # Feature components
├── lib/                          # Core logic
│   ├── ai/                       # AI & embedding utilities
│   ├── db/                       # Database (Drizzle ORM)
│   │   ├── schema/               # Database schema
│   │   └── migrations/           # SQL migrations
│   ├── actions/                  # Server actions
│   └── utils.ts                  # Utilities
├── scripts/                      # CLI scripts
│   ├── ingest-pdf.ts             # Single PDF ingestion
│   ├── batch-ingest.ts           # Batch PDF processing
│   └── README.md                 # CLI documentation
├── public/                       # Static assets
└── config/                       # Configuration files
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Run linter: `npm run lint:fix`
6. Run type check: `npm run typecheck`
7. Commit your changes: `git commit -m 'Add feature'`
8. Push to the branch: `git push origin feature-name`
9. Submit a pull request

### Code Quality Standards

- All code must pass TypeScript type checking
- ESLint rules must be followed
- Prettier formatting must be applied
- Tests must pass
- Maintain existing architecture patterns

## Journey

1. **The Original Vision**: Started as a parliamentary monitoring system tracking attendance, voting patterns, and legislative performance metrics.

2. **The Pivot**: User research revealed a deeper need for accessible constitutional knowledge, leading to transformation into an AI-powered constitutional guide.

3. **Today's Numainda**: Now serves as an interactive platform where citizens can learn about their constitution and rights through simple conversations, powered by state-of-the-art AI and RAG technology.

## Media Coverage

Featured in ["Say Hello to My New Friend"](https://codeforpakistan.org/stories/say-hello-to-my-new-friend) - An article about how Numainda is transforming constitutional literacy in Pakistan through AI and human-centered design.

## License

[Add license information here]

## Support

For questions or issues:
- Open an issue on GitHub
- Contact Code for Pakistan team
- Check documentation in `CLAUDE.md` for detailed technical guidance

## External Services

- **Pehchan**: Pakistan's national digital identity (OAuth provider)
- **OpenAI**: Embeddings and chat completions
- **AWS S3**: Document storage
- **Upstash QStash**: Background job queue
- **Vercel**: Hosting and analytics
