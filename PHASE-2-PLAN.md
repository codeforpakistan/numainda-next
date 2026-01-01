# Phase 2: Advanced RAG System - Implementation Plan

## 🎯 Objectives

Transform Numainda from basic RAG to advanced agentic RAG system with:
1. **RAPTOR** - Hierarchical document retrieval (25-35% improvement)
2. **Multi-Query Retrieval** - Query expansion for better coverage
3. **Hybrid Search** - Vector (semantic) + BM25 (keyword)
4. **LangGraph Agents** - Specialized agents with orchestration
5. **Better Models** - o3-mini for generation, better embeddings

## 📋 Tasks Breakdown

### Task 1: Advanced RAG Infrastructure
**Goal:** Set up the foundation for advanced retrieval techniques

**Files to Create:**
```
packages/ai-agents/src/
├── retrieval/
│   ├── raptor.ts          # Hierarchical retrieval
│   ├── multi-query.ts     # Query expansion
│   ├── hybrid-search.ts   # Vector + BM25
│   └── compressor.ts      # Context compression
├── embeddings/
│   ├── openai.ts          # OpenAI embeddings
│   └── cohere.ts          # Cohere embed-v3 (for Urdu)
└── types/
    └── rag.ts             # RAG type definitions
```

**Dependencies to Add:**
```bash
# Add to packages/ai-agents/package.json
- @langchain/openai
- @langchain/cohere
- @langchain/community (text splitters)
- faiss-node (for hybrid search)
```

**Implementation Details:**
- RAPTOR: Recursive summarization of document chunks
- Multi-query: Generate 3-5 variations of user query
- Hybrid: Combine pgvector (semantic) + text search (keyword)
- Compression: Remove irrelevant chunks post-retrieval

---

### Task 2: RAPTOR Implementation
**Goal:** Build hierarchical retrieval system

**How RAPTOR Works:**
1. Split document into chunks
2. Create embeddings for base chunks (Level 0)
3. Cluster similar chunks
4. Generate summaries of clusters (Level 1)
5. Repeat until single root summary (Level 2+)
6. At query time, search across all levels

**Benefits:**
- Better context for long documents
- 25-35% improvement in retrieval accuracy
- Handles multi-hop questions better

**Code Structure:**
```typescript
export class RAPTORRetriever {
  async buildHierarchy(document: string): Promise<RAPTORTree>
  async retrieve(query: string, topK: number): Promise<Chunk[]>
}
```

---

### Task 3: Multi-Query Retrieval
**Goal:** Improve recall by generating query variations

**Implementation:**
```typescript
export class MultiQueryRetriever {
  // Generate 3-5 query variations
  async generateQueries(original: string): Promise<string[]>

  // Search with all variations
  async retrieve(query: string): Promise<Chunk[]>

  // Deduplicate and rank results
  async mergeResults(results: Chunk[][]): Promise<Chunk[]>
}
```

**Query Variations Examples:**
- Original: "What are fundamental rights in Pakistan?"
- Variation 1: "Constitutional fundamental rights Pakistan"
- Variation 2: "Basic human rights Pakistani constitution"
- Variation 3: "Citizens' rights Article 8-28 Pakistan"

---

### Task 4: Hybrid Search
**Goal:** Combine semantic and keyword search

**PostgreSQL Setup:**
```sql
-- Add GIN index for full-text search
CREATE INDEX embeddings_content_fts
  ON embeddings
  USING GIN (to_tsvector('english', content));
```

**Implementation:**
```typescript
export class HybridSearchRetriever {
  async vectorSearch(query: string, k: number): Promise<Chunk[]>
  async keywordSearch(query: string, k: number): Promise<Chunk[]>

  // Reciprocal Rank Fusion (RRF)
  async hybridRetrieve(
    query: string,
    vectorWeight = 0.7,
    keywordWeight = 0.3
  ): Promise<Chunk[]>
}
```

**When to Use:**
- Vector: Semantic concepts ("what are human rights?")
- Keyword: Exact legal terms ("Article 25", "Section 10(a)")
- Hybrid: Best of both worlds

---

### Task 5: Base Agent Class
**Goal:** Create reusable agent foundation

**Implementation:**
```typescript
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { BaseMessage } from '@langchain/core/messages';

export abstract class BaseAgent {
  constructor(
    protected model: BaseChatModel,
    protected tools: Tool[],
    protected systemPrompt: string
  ) {}

  abstract async invoke(
    input: string,
    history: BaseMessage[]
  ): Promise<string>;

  protected async retrieveContext(query: string): Promise<string>;
}
```

---

### Task 6-8: Specialized Agents

#### Query Router Agent
**Purpose:** Route queries to appropriate specialist agents

**System Prompt:**
```
You are a query router. Analyze the user's question and determine which specialist agent should handle it:

- CONSTITUTIONAL: Questions about constitution, rights, amendments
- LEGISLATIVE: Questions about bills, acts, laws, legislation
- PARLIAMENTARY: Questions about proceedings, debates, sessions
- REPRESENTATIVE: Questions about MNAs, voting records, constituencies

Respond with ONLY the agent name.
```

#### Constitutional Law Agent
**Purpose:** Expert in Pakistan's Constitution

**Tools:**
- RAPTOR retrieval (for constitution hierarchies)
- Article/clause lookup
- Amendment history

**System Prompt:**
```
You are a constitutional law expert specializing in Pakistan's Constitution.
Use the retrieved context to answer questions about:
- Fundamental rights (Articles 8-28)
- Constitutional amendments
- State structure and governance
- Judicial interpretation

Always cite specific articles and clauses.
```

#### Legislative Bill Agent
**Purpose:** Expert in bills and acts

**Tools:**
- Bill status lookup
- Comparison between bills
- Legislative timeline

**System Prompt:**
```
You are a legislative analyst specializing in Pakistani bills and acts.
Provide information about:
- Bill status and progress
- Key provisions and impacts
- Amendments to existing laws
- Parliamentary votes

Include bill numbers, passage dates, and current status.
```

---

### Task 9: LangGraph Workflow
**Goal:** Orchestrate multi-agent system

**Workflow Graph:**
```
┌─────────────┐
│ User Query  │
└──────┬──────┘
       │
       v
┌─────────────────┐
│ Query Router    │
└──────┬──────────┘
       │
       ├─────────┬─────────┬──────────────┐
       v         v         v              v
┌──────────┐ ┌────────┐ ┌───────────┐ ┌─────────────┐
│Constitu- │ │Legisla-│ │Parliament-│ │Representa-  │
│tional    │ │tive    │ │ary        │ │tive         │
│Agent     │ │Agent   │ │Agent      │ │Agent        │
└────┬─────┘ └────┬───┘ └─────┬─────┘ └──────┬──────┘
     │            │            │              │
     └────────────┴────────────┴──────────────┘
                       │
                       v
              ┌─────────────────┐
              │ Synthesis Agent │
              └────────┬────────┘
                       │
                       v
                  ┌─────────┐
                  │Response │
                  └─────────┘
```

**LangGraph Implementation:**
```typescript
import { StateGraph } from '@langchain/langgraph';

const workflow = new StateGraph({
  channels: {
    query: { value: null },
    route: { value: null },
    context: { value: [] },
    response: { value: null }
  }
});

// Nodes
workflow.addNode('router', queryRouterAgent);
workflow.addNode('constitutional', constitutionalAgent);
workflow.addNode('legislative', legislativeAgent);
workflow.addNode('synthesizer', synthesisAgent);

// Conditional routing
workflow.addConditionalEdges(
  'router',
  (state) => state.route,
  {
    'CONSTITUTIONAL': 'constitutional',
    'LEGISLATIVE': 'legislative',
    // ... more routes
  }
);

// All specialist agents → synthesizer
workflow.addEdge('constitutional', 'synthesizer');
workflow.addEdge('legislative', 'synthesizer');

const app = workflow.compile();
```

---

### Task 10: Retrieval Tools
**Goal:** Tools that agents can use

**Tools to Create:**

1. **Vector Search Tool**
```typescript
const vectorSearchTool = new Tool({
  name: 'vector_search',
  description: 'Search documents by semantic meaning',
  func: async (query: string) => {
    return await hybridRetriever.vectorSearch(query, 6);
  }
});
```

2. **Keyword Search Tool**
```typescript
const keywordSearchTool = new Tool({
  name: 'keyword_search',
  description: 'Search for exact terms (e.g., "Article 25", "Section 10")',
  func: async (query: string) => {
    return await hybridRetriever.keywordSearch(query, 6);
  }
});
```

3. **RAPTOR Tool**
```typescript
const raptorTool = new Tool({
  name: 'hierarchical_search',
  description: 'Search long documents with hierarchical context',
  func: async (query: string) => {
    return await raptorRetriever.retrieve(query, 6);
  }
});
```

4. **Bill Lookup Tool**
```typescript
const billLookupTool = new Tool({
  name: 'bill_lookup',
  description: 'Get bill details by number or title',
  func: async (billId: string) => {
    return await db.query.bills.findFirst({
      where: eq(bills.id, billId)
    });
  }
});
```

---

### Task 11: Migrate Chat Endpoint
**Goal:** Replace Vercel AI SDK with LangChain streaming

**Current (Vercel AI SDK):**
```typescript
// apps/web/app/api/chat/route.tsx
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages,
    system: '...'
  });

  return result.toDataStreamResponse();
}
```

**New (LangChain + LangGraph):**
```typescript
// apps/web/app/api/chat/route.tsx
import { workflow } from '@numainda/ai-agents';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1];

  // Stream from LangGraph workflow
  const stream = await workflow.stream({
    query: lastMessage.content,
    history: messages.slice(0, -1)
  });

  // Convert to streaming response
  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`)
          );
        }
        controller.close();
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      }
    }
  );
}
```

---

### Task 12: Testing & Evaluation
**Goal:** Measure RAG improvements

**Test Queries:**
```typescript
const testQueries = [
  // Constitutional questions
  "What are the fundamental rights in Pakistan's constitution?",
  "Explain Article 25 about equality",

  // Legislative questions
  "What is the status of the 26th Amendment?",
  "Which bills were passed in 2024?",

  // Complex multi-hop
  "How does the constitution protect minorities and what laws have been passed?",

  // Exact legal terms
  "Find Section 10(a) of Elections Act 2017"
];
```

**Evaluation Metrics:**
1. **Retrieval Quality:**
   - Precision@K: Relevant docs in top K results
   - Recall@K: % of relevant docs retrieved
   - MRR (Mean Reciprocal Rank): Position of first relevant doc

2. **Response Quality:**
   - Faithfulness: Does response match source docs?
   - Relevance: Does it answer the question?
   - Completeness: Is the answer comprehensive?

3. **Performance:**
   - Latency: Time to first token
   - Throughput: Queries per second

**Evaluation Script:**
```typescript
// packages/ai-agents/src/__tests__/rag-eval.ts
import { RAGASScore } from 'ragas';

async function evaluateRAG() {
  const results = [];

  for (const query of testQueries) {
    const startTime = Date.now();
    const { response, context } = await workflow.invoke(query);
    const latency = Date.now() - startTime;

    const score = await RAGASScore.compute({
      query,
      response,
      context,
      groundTruth: expectedAnswers[query]
    });

    results.push({ query, score, latency });
  }

  console.table(results);
}
```

---

## 📊 Expected Improvements

### Before (Current RAG):
- **Retrieval:** Basic vector search only
- **Chunk Size:** Fixed 1500 chars
- **Model:** GPT-4o-mini
- **Accuracy:** ~70-75%
- **Latency:** ~2-3s

### After (Advanced RAG):
- **Retrieval:** RAPTOR + Multi-query + Hybrid
- **Chunk Size:** Semantic + hierarchical
- **Model:** o3-mini (faster, better reasoning)
- **Accuracy:** ~90-95% (25-35% improvement)
- **Latency:** ~1.5-2s (better caching)

---

## 🚀 Implementation Order

1. **Day 1-2:** Infrastructure & RAPTOR
   - Set up retrieval packages
   - Implement RAPTOR algorithm
   - Add hierarchical indexing

2. **Day 3-4:** Multi-Query & Hybrid Search
   - Query expansion
   - BM25 keyword search
   - Hybrid fusion algorithm

3. **Day 5-6:** Agents & LangGraph
   - Base agent class
   - Router + 2 specialist agents
   - LangGraph workflow

4. **Day 7:** Migration & Testing
   - Replace chat endpoint
   - Run evaluation suite
   - Document improvements

---

## 📦 Dependencies to Add

```bash
npm install --workspace=@numainda/ai-agents \
  @langchain/openai \
  @langchain/cohere \
  @langchain/langgraph \
  langsmith \
  faiss-node
```

---

## 🎯 Success Criteria

- [ ] RAPTOR retrieval working with test documents
- [ ] Multi-query generating 3-5 variations
- [ ] Hybrid search combining vector + keyword
- [ ] 3+ specialized agents operational
- [ ] LangGraph workflow routing correctly
- [ ] Chat endpoint migrated from Vercel AI SDK
- [ ] Evaluation showing 20%+ improvement
- [ ] Response latency < 2 seconds

---

## 📝 Notes

- Keep existing Vercel AI SDK code until migration complete
- Test each component independently before integration
- Use LangSmith for debugging agent workflows
- Document all prompt engineering decisions

**Ready to build the future of parliamentary AI!** 🇵🇰

---

**Next:** Start with Task 1 - Set up advanced RAG infrastructure
