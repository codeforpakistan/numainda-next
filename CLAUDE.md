# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Numainda is an AI-powered constitutional guide for Pakistan, making legal knowledge accessible through natural conversations. It transforms complex constitutional and legislative information into simple, understandable language for all citizens.

**Key Features:**
- AI-powered chat interface for constitutional and legislative queries
- RAG (Retrieval Augmented Generation) system using vector embeddings
- Document management for constitution, bills, election laws, and parliamentary proceedings
- Bilingual support (English and Urdu)

## Development Commands

### Running the Application
```bash
npm run dev           # Start development server (http://localhost:3000)
npm run build         # Build for production
npm run start         # Start production server
npm run preview       # Build and start production server
```

### Code Quality
```bash
npm run lint          # Run ESLint
npm run lint:fix      # Run ESLint and auto-fix issues
npm run typecheck     # Run TypeScript type checking (tsc --noEmit)
npm run format:write  # Format code with Prettier
npm run format:check  # Check code formatting
```

### Database Operations
```bash
npm run db:generate   # Generate Drizzle migrations from schema changes
npm run db:migrate    # Run migrations (executes lib/db/migrate.ts)
npm run db:push       # Push schema changes directly to database
npm run db:pull       # Introspect database and pull schema
npm run db:studio     # Open Drizzle Studio (database UI)
npm run db:check      # Check migration consistency
npm run db:drop       # Drop database migrations
```

### Testing
```bash
npm test              # Run Jest tests
npm test:watch        # Run Jest in watch mode
```

## Architecture

### Technology Stack
- **Framework:** Next.js 13 with App Router
- **Language:** TypeScript (strict mode enabled)
- **Database:** PostgreSQL with Drizzle ORM
- **Vector Search:** pgvector extension for semantic search
- **AI:** Vercel AI SDK with OpenAI (GPT-4o-mini for chat, text-embedding-ada-002 for embeddings)
- **Document Processing:** LangChain for PDF parsing and text chunking
- **Storage:** AWS S3 for file uploads
- **Auth:** Supabase
- **UI:** Radix UI + Tailwind CSS + shadcn/ui
- **Background Jobs:** Upstash QStash

### Directory Structure

```
app/                        # Next.js 13 app directory
├── api/                    # API routes
│   ├── chat/              # Chat streaming endpoint and thread management
│   ├── admin/             # Admin upload and processing endpoints
│   └── bills/             # Bills/Acts API
├── chat/                  # Chat interface page
├── bills/                 # Bills/Acts pages
├── proceedings/           # Parliamentary proceedings pages
├── constitution/          # Constitution page
├── admin/                 # Admin dashboard and upload pages
└── components/            # Page-specific components

components/                 # Shared React components
├── ui/                    # shadcn/ui components
└── chat/                  # Chat-related components

lib/                       # Core business logic
├── db/                    # Database layer
│   ├── schema/           # Drizzle schemas (documents, embeddings, bills, chat-threads)
│   ├── migrations/       # Auto-generated migration files
│   └── index.ts          # Database client initialization
├── actions/              # Server actions for data mutations
│   ├── documents.ts      # Document upload, PDF processing, embedding generation
│   ├── resources.ts      # Resource CRUD operations
│   └── bills.ts          # Bills management
├── ai/                   # AI/ML utilities
│   └── embedding.ts      # Vector embedding generation and similarity search
├── middleware/           # Custom middleware
└── env.mjs               # Environment variable validation with @t3-oss/env-nextjs

config/                    # Configuration files
└── site.ts               # Site configuration (navigation, links, etc.)

public/                    # Static assets
└── uploads/              # Temporary upload directory (files are moved to S3)
```

### Database Schema

**documents** table: Stores full text of legal documents
- Types: `constitution`, `election_law`, `parliamentary_bulletin`, `bill`
- Full document content stored for reference
- Related to embeddings via one-to-many relationship

**embeddings** table: Stores vector embeddings for semantic search
- 1536-dimensional vectors (OpenAI text-embedding-ada-002)
- Uses pgvector with HNSW index for fast cosine similarity search
- Stores chunks of documents with metadata (pageNumber, section, timestamp)
- Links to documents via `resourceId` (cascade delete)

**bills** table: Stores legislative bills/acts
- Fields: title, status, summary, originalText, billNumber, sessionNumber, passageDate
- Status values: `pending`, `passed`, `rejected`

**chat_threads** table: Stores user chat sessions
- Fields: id, userId, title, messages (JSONB), createdAt

### AI & RAG System

**Document Processing Pipeline:**
1. PDF uploaded via admin interface → `lib/actions/documents.ts`
2. Text extracted using LangChain PDFLoader
3. Text split into chunks (1500 chars, 300 overlap) using RecursiveCharacterTextSplitter
4. Each chunk processed to generate embeddings via OpenAI API
5. Embeddings stored in database with metadata (section headers, timestamps, page numbers)
6. For bills: AI-generated summary created and stored
7. For parliamentary bulletins: AI-generated summary + proceeding record created

**Query Pipeline:**
1. User sends message → `/app/api/chat/route.tsx`
2. Query converted to embedding
3. Cosine similarity search finds top 6 relevant chunks (threshold > 0.75)
4. Relevant context injected into system prompt
5. GPT-4o-mini generates response using Vercel AI SDK's `streamText`
6. Response streamed back to client

**Key AI Components:**
- `lib/ai/embedding.ts`: Core RAG functions
  - `generateEmbeddings()`: Creates vector embeddings
  - `findRelevantContent()`: Performs similarity search with cosine distance
  - `generateProceedingSummary()`: Generates summaries for parliamentary proceedings
- `app/api/chat/route.tsx`: Chat endpoint with streaming responses
- System prompt instructs AI to only use provided context, cite sources, and respond in engaging format with emojis/hashtags

### Path Aliases

TypeScript path alias `@/*` maps to project root. Import examples:
```typescript
import { db } from '@/lib/db'
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui/button'
```

### Environment Variables

Required environment variables (see `.env.local` example):
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for embeddings and chat
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`: S3 credentials
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase configuration
- `QSTASH_*`: Upstash QStash credentials for background jobs
- `NEXT_PUBLIC_POSTHOG_*`: PostHog analytics (optional)

Environment validation is handled by `lib/env.mjs` using `@t3-oss/env-nextjs`.

## Key Implementation Details

### Adding New Document Types
1. Update `documents` schema in `lib/db/schema/documents.ts` (add new type to enum if needed)
2. Update upload form in `app/admin/upload/page.tsx`
3. Add processing logic in `lib/actions/documents.ts` → `uploadDocument()`
4. Update chat system prompt in `app/api/chat/route.tsx` if needed

### Modifying Embedding Search
- Adjust similarity threshold in `lib/ai/embedding.ts` → `findRelevantContent()` (currently 0.75)
- Change chunk limit (currently 6 results)
- Modify chunk size/overlap in `lib/actions/documents.ts` (currently 1500/300)

### Database Migrations
1. Modify schema files in `lib/db/schema/`
2. Run `npm run db:generate` to create migration
3. Review generated migration in `lib/db/migrations/`
4. Run `npm run db:migrate` to apply
5. For production: migrations run via `lib/db/migrate.ts`

### Chat Interface
- Chat UI uses Vercel AI SDK's `useChat` hook
- Messages stored in `chat_threads` table
- Streaming responses handled by SDK
- Previous conversations accessible via sidebar

## Important Notes

- **Server Actions**: Enabled in `next.config.mjs`, used throughout for data mutations
- **Embeddings Cost**: OpenAI embedding API calls have costs - batch processing implemented with delays to avoid rate limits
- **Vector Search**: Requires pgvector extension enabled in PostgreSQL
- **File Uploads**: Files temporarily stored in `public/uploads/`, then moved to S3
- **AI Response Format**: System prompt enforces strict source citation and structured responses with emojis/hashtags
- **Database Connection**: Uses postgres.js client with Drizzle ORM
- **TypeScript**: Strict mode enabled, all files should be properly typed
