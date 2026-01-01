# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Numainda is an AI-powered constitutional guide for Pakistan, making legal knowledge accessible through natural language conversations. Built with Next.js 13 App Router, it uses RAG (Retrieval-Augmented Generation) to provide accurate information about Pakistan's constitution, election laws, and parliamentary proceedings.

## Common Development Commands

```bash
# Development
npm run dev                    # Start development server (localhost:3000)
npm run build                  # Build production bundle
npm run start                  # Start production server
npm run preview                # Build and start production server

# Code Quality
npm run lint                   # Run ESLint
npm run lint:fix               # Fix linting issues
npm run typecheck              # Run TypeScript compiler check (no emit)
npm run format:write           # Format code with Prettier
npm run format:check           # Check code formatting

# Database (Drizzle ORM)
npm run db:generate            # Generate migrations from schema
npm run db:migrate             # Run migrations (tsx lib/db/migrate.ts)
npm run db:push                # Push schema directly to database
npm run db:pull                # Pull schema from database
npm run db:studio              # Open Drizzle Studio (GUI)
npm run db:check               # Check migration consistency

# Testing
npm test                       # Run Jest tests
npm run test:watch             # Run tests in watch mode

# PDF Ingestion (CLI Script)
npm run ingest <pdf-path> -- --title "Title" --type bill [options]
# Example: npm run ingest ./bill.pdf -- --title "Finance Bill" --type bill --status passed
```

## Architecture Overview

### Database Layer (Drizzle + PostgreSQL with pgvector)

**Schema Location**: `lib/db/schema/`

Key tables:
- **documents** - Core document storage (constitution, election laws, parliamentary bulletins)
- **embeddings** - Vector embeddings (1536-dim) with HNSW index for cosine similarity search
- **bills** - Legislative bills/acts with AI-generated summaries
- **parliamentary-proceedings** - Daily proceedings with AI summaries
- **chat-threads** - User conversation history (JSONB messages array)
- **document-uploads** - Upload tracking with async processing status

**Connection**: `lib/db/index.ts` uses postgres-js driver. Environment variables managed via `@t3-oss/env-nextjs` in `lib/env.mjs`.

### AI/LLM Integration

**Core file**: `lib/ai/embedding.ts`

Technology stack:
- Vercel AI SDK for streaming chat and embeddings
- OpenAI models:
  - `text-embedding-ada-002` - Vector embeddings (1536 dimensions)
  - `gpt-4o` - Bill/proceeding summaries
  - `gpt-4o-mini` - Chat responses
- LangChain Community for PDF parsing and text chunking

**RAG Flow** (see `app/api/chat/route.tsx`):
1. Extract last user message
2. `findRelevantContent()` performs cosine similarity search (threshold > 0.75, top 6 results)
3. Format context with document titles, types, and sections
4. Stream response with GPT-4o-mini
5. System prompt enforces: cite sources, no hallucination, admit when context is insufficient

**Document Processing** (`lib/actions/documents.ts`):
- LangChain PDFLoader extracts text with page metadata
- RecursiveCharacterTextSplitter: chunkSize=1500, chunkOverlap=300
- Section detection and timestamp extraction for metadata
- Batch embedding: 5 chunks at a time, 1s delay (rate limiting)
- Type-specific AI summarization for bills and parliamentary bulletins

### Authentication (Pehchan OAuth)

**Pehchan** is Pakistan's national digital identity service using OAuth 2.0.

**Login Flow** (`components/pehchan-button.tsx`):
1. Construct OAuth URL with client_id, redirect_uri, scope (openid profile email)
2. User authenticates with Pehchan
3. Callback handler (`app/auth/callback/page.tsx`) receives tokens
4. Fetch user info, extract pehchan_id (CNIC)
5. Store in localStorage, redirect to /chat

**Session Management**:
- Client-side: localStorage stores tokens, user_info, pehchan_id
- Server-side: pehchan_id used for thread ownership verification in API routes

### API Routes Structure

**Chat APIs** (`app/api/chat/`):
- `POST /api/chat` - Main chat with RAG streaming
- `GET /api/chat/threads` - List user's threads (requires pehchan_id)
- `POST /api/chat/threads` - Create new thread
- `GET /api/chat/threads/[id]` - Get thread (auth check)
- `PATCH /api/chat/threads/[id]` - Update messages/title
- `DELETE /api/chat/threads/[id]` - Delete thread

**Admin APIs** (`app/api/admin/`):
- `POST /api/admin/uploads` - Upload to S3, create upload record, queue processing via QStash
- `PATCH /api/admin/uploads` - Update upload status/progress
- `POST /api/admin/uploads/process` - QStash webhook handler for async document processing

**Other APIs**:
- `GET /api/bills` - Fetch all bills (force-dynamic, no caching)
- `POST /api/upload` - Simple S3 upload

### Async Processing (QStash)

**Upload flow** (`app/api/admin/uploads/process/route.ts`):
1. Admin uploads PDF via `/api/admin/uploads`
2. File uploaded to S3, record created in document-uploads table
3. QStash job queued for processing
4. Worker fetches file, parses PDF, chunks text, generates embeddings
5. Creates document and bill/proceeding records with AI summaries
6. Updates upload status (completed/failed)

**Rate limiting**: Batched embedding generation (5 chunks, 1s delay) to respect OpenAI limits.

### App Structure (Next.js 13 App Router)

**Main pages** (`app/`):
- `/` - Landing page with hero and feature cards
- `/chat` - Main chat interface (auth-gated, real-time streaming, thread persistence)
- `/bills` - Bills listing, `/bills/[id]` - Individual bill details
- `/proceedings` - Parliamentary proceedings, `/proceedings/[id]` - Details
- `/constitution` - Constitution viewer
- `/about` - About page
- `/auth/callback` - OAuth callback handler
- `/admin/dashboard`, `/admin/upload` - Admin interfaces

**Layout** (`app/layout.tsx`):
- Theme provider (dark mode via next-themes)
- Site header with navigation (site-header.tsx)
- Footer, toast notifications, Vercel Analytics, Google Analytics

**Navigation** (`config/site.ts`): Home, Chat, About, Proceedings, Acts, Constitution

### Key Services & Utilities

**S3 Integration** (`lib/s3.ts`):
- `uploadToS3()` - Upload buffer with content type
- `getSignedUrlForFile()` - Generate presigned URLs (1 hour expiry)

**ID Generation** (`lib/utils.ts`):
- `nanoid()` - Custom alphabet ID generator
- `cn()` - Tailwind class merging utility

**Parliamentary Proceedings** (`lib/proceedings.ts`):
- `getProceedings()` - List all proceedings
- `getProceeding(id)` - Get single proceeding
- `createProceeding()` - Insert new record

### Component Architecture

**UI Components** (`components/ui/`):
- Shadcn UI + Radix primitives
- Chat: chat-bubble, chat-input, chat-message
- Forms: button, input, select, label
- Layout: card, scroll-area, avatar, badge

**Feature Components** (`components/`):
- `pehchan-button.tsx` - OAuth login button
- `site-header.tsx` - Navigation header
- `message-threads-sidebar.tsx` - Chat history sidebar
- `google-analytics.tsx` - GA4 script loader
- `*-view-tracker.tsx` - Analytics tracking wrappers for server components
- `footer.tsx`, `theme-provider.tsx`

## Development Guidelines

### Database Changes

1. Modify schema files in `lib/db/schema/`
2. Run `npm run db:generate` to create migration
3. Review generated migration in `lib/db/migrations/`
4. Run `npm run db:migrate` to apply migration
5. For rapid iteration: `npm run db:push` (skips migrations)

### Adding New Documents

**Option 1: CLI Script (Recommended for bulk ingestion)**

Use the `ingest-pdf.ts` script for direct PDF ingestion:

```bash
npm run ingest ./bill.pdf -- \
  --title "Finance Bill 2024" \
  --type bill \
  --status passed \
  --bill-number "Bill No. 45" \
  --passage-date 2024-12-15
```

The script:
- Extracts text from PDF using LangChain
- Chunks text (1500 chars, 300 overlap)
- Generates embeddings with OpenAI
- Stores in database with metadata
- Creates AI summaries for bills/proceedings
- See `scripts/README.md` for full documentation

**Option 2: Admin Interface (Web UI)**

1. Upload PDF through `/admin/upload`
2. System automatically:
   - Uploads to S3
   - Queues processing job
   - Extracts text and metadata
   - Generates embeddings
   - Creates summaries for bills/proceedings
3. Monitor progress in admin dashboard

### Working with RAG

To improve retrieval quality:
- Modify chunk size/overlap in `lib/actions/documents.ts` (RecursiveCharacterTextSplitter)
- Adjust similarity threshold in `lib/ai/embedding.ts` (findRelevantContent)
- Update section detection patterns for better metadata
- Tune system prompt in `app/api/chat/route.tsx`

### Testing

Tests use Jest + Testing Library:
- Test files: `components/__tests__/`
- Config: `jest.config.js`, `jest.setup.js`
- Run tests before committing: `npm test`

## Environment Variables

Required variables (see `.env.local`):
```bash
# Database
DATABASE_URL="postgresql://..."

# OpenAI
OPENAI_API_KEY="sk-..."

# AWS S3
AWS_REGION="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET_NAME="..."

# QStash
QSTASH_TOKEN="..."
QSTASH_CURRENT_SIGNING_KEY="..."
QSTASH_NEXT_SIGNING_KEY="..."

# Pehchan OAuth
NEXT_PUBLIC_PEHCHAN_URL="https://pehchan.nayatel.com"
NEXT_PUBLIC_CLIENT_ID="..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Or production URL
```

## Key Technical Decisions

1. **Vector Search**: pgvector with HNSW indexing for fast cosine similarity search on 1536-dim embeddings
2. **RAG over Fine-tuning**: Retrieval-augmented generation ensures accurate, up-to-date legal information without model retraining
3. **Async Processing**: QStash handles heavy document processing to avoid blocking API requests
4. **Client-side Auth**: pehchan_id stored in localStorage, verified server-side for thread ownership
5. **Streaming Responses**: Vercel AI SDK provides real-time chat experience
6. **Batch Embedding**: Rate limiting prevents OpenAI API throttling
7. **Metadata Enhancement**: Section detection and timestamp extraction improve retrieval relevance

## Common Issues

### Embedding Rate Limits
If you hit OpenAI rate limits during document processing, adjust batch size and delay in `lib/actions/documents.ts` (currently 5 chunks per batch, 1s delay).

### Vector Search Performance
If retrieval is slow, ensure HNSW index is created on embeddings table:
```sql
CREATE INDEX ON embeddings USING hnsw (embedding vector_cosine_ops);
```

### Auth Token Expiry
Pehchan tokens expire. If users report auth issues, they need to re-login. Implement token refresh if needed.

## Analytics & Monitoring

### Google Analytics (GA4)

**Tracking ID**: `G-QMPHXVV7TX`

**Implementation** (`components/google-analytics.tsx`, `lib/analytics.ts`):
- Next.js Script component with `afterInteractive` strategy for optimized loading
- Comprehensive event tracking across all user interactions
- Client-side wrappers for server components to track page views

**Key Metrics Tracked**:

1. **User Engagement**
   - Page views (automatic)
   - Session duration
   - Active users

2. **Chat Interactions**
   - `trackChatMessage(threadId?)` - Message sending
   - `trackNewChatThread()` - New conversation creation

3. **Authentication**
   - `trackPehchanLogin(success: boolean)` - Login attempts

4. **Document Views**
   - `trackBillView(billId)` - Bill detail views
   - `trackProceedingView(proceedingId)` - Proceeding views
   - `trackConstitutionView()` - Constitution page views
   - `trackDocumentView(type, id)` - Generic document tracking

5. **Admin Actions**
   - `trackDocumentUpload(documentType)` - Document uploads

6. **Search & RAG**
   - `trackSearch(query, resultCount)` - Search queries
   - `trackRAGQuery(relevantChunks)` - RAG retrieval performance

**Tracking Components**:
- `components/bill-view-tracker.tsx` - Bill view tracking wrapper
- `components/proceeding-view-tracker.tsx` - Proceeding view wrapper
- `components/constitution-view-tracker.tsx` - Constitution view wrapper

These client components wrap server components to trigger GA events on mount.

**Adding New Tracking Events**:

1. Add function to `lib/analytics.ts`:
   ```typescript
   export const trackCustomEvent = (label?: string) => {
     trackEvent("event_name", "Category", label)
   }
   ```

2. Import and use in components:
   ```typescript
   import { trackCustomEvent } from "@/lib/analytics"

   // In your component
   trackCustomEvent("context")
   ```

**View Analytics**: https://analytics.google.com (Property: G-QMPHXVV7TX)

**Documentation**: See `docs/google-analytics-integration.md` for comprehensive setup details, metric recommendations, and troubleshooting.

## External Services

- **Pehchan**: Pakistan's national digital identity (OAuth provider)
- **OpenAI**: Embeddings and chat completions
- **AWS S3**: Document storage
- **Upstash QStash**: Background job queue
- **Vercel**: Hosting and analytics
- **Google Analytics**: User behavior and engagement tracking (GA4)

## Related Services

- `/services/embeddings-worker` - Separate worker for embedding processing
- `/services/parliament-scraper` - Web scraping for parliamentary data
