/**
 * Advanced RAG Type Definitions
 * Core types for retrieval, agents, and workflows
 */

// ============================================================================
// Retrieval Types
// ============================================================================

/**
 * Represents a chunk of text with metadata
 */
export interface Chunk {
  id: string;
  content: string;
  embedding?: number[];
  metadata: ChunkMetadata;
  score?: number; // Relevance score
}

/**
 * Metadata associated with a chunk
 */
export interface ChunkMetadata {
  documentId: string;
  documentTitle: string;
  documentType: 'constitution' | 'bill' | 'election_law' | 'parliamentary_bulletin';
  pageNumber?: number;
  section?: string;
  article?: string;
  clause?: string;
  timestamp?: string;
  level?: number; // For RAPTOR hierarchy (0 = base, 1+ = summary levels)
  parentId?: string; // For RAPTOR parent chunks
}

/**
 * RAPTOR Tree Node
 * Represents hierarchical document structure
 */
export interface RAPTORNode {
  id: string;
  level: number; // 0 = leaf, higher = more abstract
  content: string;
  embedding: number[];
  children: string[]; // IDs of child nodes
  metadata: ChunkMetadata;
}

/**
 * RAPTOR Tree Structure
 */
export interface RAPTORTree {
  root: RAPTORNode;
  levels: Map<number, RAPTORNode[]>; // level -> nodes at that level
  documentId: string;
}

/**
 * Search result from retrieval
 */
export interface SearchResult {
  chunks: Chunk[];
  query: string;
  method: 'vector' | 'keyword' | 'hybrid' | 'raptor' | 'multi-query';
  totalResults: number;
  retrievalTime: number; // milliseconds
}

// ============================================================================
// Agent Types
// ============================================================================

/**
 * Agent configuration
 */
export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  model: string; // e.g., 'gpt-4o-mini', 'o3-mini'
  temperature: number;
  maxTokens: number;
  tools: string[]; // Tool names this agent can use
}

/**
 * Agent input
 */
export interface AgentInput {
  query: string;
  history: ChatMessage[];
  context?: Chunk[];
  metadata?: Record<string, any>;
}

/**
 * Agent output
 */
export interface AgentOutput {
  response: string;
  context: Chunk[];
  toolCalls: ToolCall[];
  metadata: {
    agent: string;
    model: string;
    tokensUsed: number;
    latency: number;
  };
}

/**
 * Chat message
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

/**
 * Tool call record
 */
export interface ToolCall {
  toolName: string;
  input: any;
  output: any;
  duration: number;
}

// ============================================================================
// Workflow Types
// ============================================================================

/**
 * Workflow state
 * Passed between nodes in LangGraph
 */
export interface WorkflowState {
  query: string;
  history: ChatMessage[];
  route?: AgentRoute;
  context: Chunk[];
  intermediateResponses: Map<string, string>; // agent -> response
  finalResponse?: string;
  metadata: {
    startTime: number;
    routingTime?: number;
    retrievalTime?: number;
    generationTime?: number;
  };
}

/**
 * Agent routing decision
 */
export type AgentRoute =
  | 'constitutional'
  | 'legislative'
  | 'parliamentary'
  | 'representative'
  | 'general';

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  enableParallelAgents: boolean;
  maxRetries: number;
  timeout: number; // milliseconds
  caching: boolean;
}

// ============================================================================
// Evaluation Types
// ============================================================================

/**
 * RAG evaluation result
 */
export interface EvaluationResult {
  query: string;
  response: string;
  context: Chunk[];
  groundTruth?: string;
  scores: {
    faithfulness: number; // 0-1: Response matches context
    relevance: number; // 0-1: Answers the question
    completeness: number; // 0-1: Comprehensive answer
    precision: number; // Precision@K
    recall: number; // Recall@K
    mrr: number; // Mean Reciprocal Rank
  };
  latency: number;
  tokensUsed: number;
}

/**
 * Batch evaluation results
 */
export interface BatchEvaluationResults {
  results: EvaluationResult[];
  averageScores: {
    faithfulness: number;
    relevance: number;
    completeness: number;
    precision: number;
    recall: number;
    mrr: number;
  };
  averageLatency: number;
  totalTokensUsed: number;
  timestamp: Date;
}

// ============================================================================
// Embedding Types
// ============================================================================

/**
 * Embedding provider
 */
export type EmbeddingProvider = 'openai' | 'cohere';

/**
 * Embedding configuration
 */
export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  model: string; // e.g., 'text-embedding-3-large', 'embed-multilingual-v3.0'
  dimensions: number;
  batchSize: number;
}

/**
 * Embedding result
 */
export interface EmbeddingResult {
  text: string;
  embedding: number[];
  model: string;
  tokens: number;
}

// ============================================================================
// Search Types
// ============================================================================

/**
 * Hybrid search parameters
 */
export interface HybridSearchParams {
  query: string;
  vectorWeight: number; // 0-1
  keywordWeight: number; // 0-1
  topK: number;
  filters?: ChunkFilters;
}

/**
 * Filters for chunk retrieval
 */
export interface ChunkFilters {
  documentType?: ChunkMetadata['documentType'];
  documentIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  metadata?: Record<string, any>;
}

/**
 * Query expansion result
 */
export interface QueryExpansion {
  original: string;
  variations: string[];
  method: 'llm' | 'template' | 'hybrid';
}
