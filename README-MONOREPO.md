# Numainda v2 Monorepo

Welcome to the Numainda v2 monorepo! This is a complete architectural overhaul transforming Numainda into a world-class parliamentary intelligence platform.

## 🏗️ Architecture Overview

This monorepo uses **Turborepo** for fast, efficient builds and **npm workspaces** for package management.

## 📁 Structure

```
numainda-v2/
├── apps/                       # Applications
│   ├── web/                    # Next.js public website
│   ├── admin/                  # Admin dashboard (coming soon)
│   ├── api/                    # Standalone API service (coming soon)
│   └── mobile/                 # React Native app (coming soon)
│
├── packages/                   # Shared packages
│   ├── ui/                     # Shared UI components (shadcn/ui)
│   ├── database/               # Database schema & client (Drizzle ORM)
│   ├── shared/                 # Shared utilities, types, env validation
│   ├── config/                 # Shared configs (TypeScript, ESLint, etc.)
│   ├── ai-agents/              # LangGraph agentic AI system
│   └── parliament-sdk/         # Parliamentary data SDK
│
├── services/                   # Background services
│   ├── embeddings-worker/      # Embedding generation worker
│   └── parliament-scraper/     # National Assembly scraper
│
└── infrastructure/             # Infrastructure as code
    └── docker/                 # Docker configurations
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL with pgvector extension

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env with your credentials

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev
```

## 📦 Available Commands

### Development
```bash
npm run dev              # Start all apps in development mode
npm run build            # Build all apps
npm run start            # Start all apps in production mode
```

### Code Quality
```bash
npm run lint             # Lint all packages
npm run lint:fix         # Fix linting issues
npm run typecheck        # Type check all packages
npm run format:write     # Format code with Prettier
npm run format:check     # Check code formatting
```

### Database
```bash
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run migrations
npm run db:push          # Push schema to database
npm run db:studio        # Open Drizzle Studio
```

### Testing
```bash
npm run test             # Run tests in all packages
npm run test:watch       # Run tests in watch mode
```

### Cleanup
```bash
npm run clean            # Clean all build artifacts and node_modules
npm run clean:workspaces # Clean build artifacts only
```

## 🏃 Running Individual Apps

### Web App
```bash
cd apps/web
npm run dev              # http://localhost:3000
```

### Admin Dashboard (when ready)
```bash
cd apps/admin
npm run dev              # http://localhost:3001
```

### API Service (when ready)
```bash
cd apps/api
npm run dev              # http://localhost:4000
```

## 📚 Package Documentation

### @numainda/ui
Shared UI components built with Radix UI and Tailwind CSS.

**Key Components:**
- Avatar, Button, Card, Input, Label
- Progress, ScrollArea, Select
- Toast notifications
- All shadcn/ui components

### @numainda/database
Database layer with Drizzle ORM.

**Schemas:**
- `documents` - Legal documents (constitution, bills, etc.)
- `embeddings` - Vector embeddings for RAG
- `bills` - Legislative bills and acts
- `chat_threads` - User chat sessions
- `parliamentary_proceedings` - Session records

**Usage:**
```typescript
import { db, documents } from '@numainda/database';

const allDocs = await db.select().from(documents);
```

### @numainda/shared
Shared utilities, types, and environment validation.

**Exports:**
- `env` - Type-safe environment variables
- `cn()` - Tailwind class merger
- `nanoid()` - ID generation
- Common types

### @numainda/ai-agents
Agentic AI system using LangChain and LangGraph.

**Features:**
- Multi-agent workflows
- Specialized agents (constitutional, legislative, parliamentary, representative)
- Query routing
- Advanced RAG techniques (RAPTOR, multi-query, hybrid search)

### @numainda/parliament-sdk
SDK for accessing parliamentary data.

**Features:**
- Representative lookup
- Bill tracking
- Voting records
- Session proceedings
- Constituency data

## 🤖 Agentic AI Architecture

Numainda v2 uses an advanced agentic RAG system:

```
User Query → Query Router Agent
    ├─→ Constitutional Law Agent
    ├─→ Legislative Bill Agent
    ├─→ Parliamentary Proceedings Agent
    ├─→ Representative Tracker Agent
    └─→ Legal Reasoning Agent (o1/o3-mini)
         ↓
    Synthesis Agent → Response
```

### Key Improvements over v1:
- **Multi-agent coordination** via LangGraph
- **Specialized expertise** per domain
- **Advanced retrieval** (RAPTOR, multi-query, hybrid search)
- **Better reasoning** with o1/o3-mini models
- **Parliamentary data** integration

## 🗄️ Database Setup

### Required Extensions
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Running Migrations
```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Or push directly (development only)
npm run db:push
```

### Drizzle Studio
```bash
npm run db:studio
# Opens visual database browser at https://local.drizzle.studio
```

## 🔑 Environment Variables

Each app has its own `.env` file. See `.env.example` in each app directory.

### Required for apps/web:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key
- `AWS_*` - S3 credentials
- `NEXT_PUBLIC_SUPABASE_*` - Supabase config
- `QSTASH_*` - Upstash QStash config

## 📝 Development Workflow

### Adding a New Package
```bash
mkdir -p packages/my-package/src
cd packages/my-package

# Create package.json
cat > package.json << EOF
{
  "name": "@numainda/my-package",
  "version": "0.0.1",
  "private": true,
  "main": "./index.ts"
}
EOF

# Install dependencies at root
cd ../..
npm install
```

### Adding Dependencies
```bash
# Add to a specific package
npm install <package> --workspace=@numainda/web

# Add to root (dev dependencies)
npm install <package> --save-dev
```

### Creating a New App
```bash
mkdir -p apps/my-app
cd apps/my-app

# Create package.json with "@numainda/my-app" name
# Install dependencies
cd ../..
npm install
```

## 🏗️ Turborepo Benefits

- **Fast builds** via intelligent caching
- **Parallel execution** of tasks
- **Dependency awareness** (builds packages in correct order)
- **Remote caching** support (optional)

### Build Performance
Turborepo caches build outputs and only rebuilds what changed:
```bash
npm run build  # First build: ~30s
npm run build  # Second build: ~2s (cached!)
```

## 📊 Phase 1 Completion Status

✅ Monorepo structure created
✅ Turborepo and workspace configured
✅ Packages extracted (ui, database, shared, config)
✅ Apps structure created (web, admin, api, mobile)
✅ AI agents skeleton created
✅ Database schemas migrated

### Next Steps (Phase 2+):
- [ ] Implement advanced RAG techniques
- [ ] Build LangGraph workflows
- [ ] Create specialized agents
- [ ] Parliament data scraping
- [ ] Mobile app development
- [ ] Admin dashboard
- [ ] API service

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Run `npm run lint && npm run typecheck`
4. Test your changes
5. Submit PR

## 📖 Additional Documentation

- [Web App README](./apps/web/README.md)
- [Database Package README](./packages/database/README.md)
- [AI Agents README](./packages/ai-agents/README.md)
- [Original README](./README.md)
- [Architecture Plan](./CLAUDE.md)

## 🆘 Troubleshooting

### "Cannot find module '@numainda/*'"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Type errors in shared packages"
```bash
# Build packages first
npm run build --workspace=@numainda/shared
npm run build --workspace=@numainda/database
```

### "Turbo command not found"
```bash
# Install turbo globally or use npx
npm install -g turbo
# or
npx turbo <command>
```

## 📄 License

See [LICENSE](./LICENSE)

---

**Built with ❤️ for Pakistan 🇵🇰**
