import { embed, embedMany, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from '../db';
import { cosineDistance, desc, eq, gt, sql } from 'drizzle-orm';
import { embeddings } from '../db/schema/embeddings';
import { documents } from '../db/schema/documents';
import { representativeEmbeddings } from '../db/schema/representative-embeddings';
import { representatives } from '../db/schema/representatives';
import { createProceeding } from '@/lib/proceedings'
import { nanoid } from '@/lib/utils'

const embeddingModel = openai.embedding('text-embedding-ada-002');

/**
 * Generate embedding for a single string
 * Used for representative profiles and other simple text embedding needs
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });
  return embedding;
};

export const generateEmbeddings = async (
  chunk: { pageContent: string; metadata: { pageNumber: number } }
): Promise<Array<{ embedding: number[]; content: string; metadata: any }>> => {
  const { embedding } = await embed({
    model: embeddingModel,
    value: chunk.pageContent,
  });
  
  return [{
    content: chunk.pageContent,
    embedding,
    metadata: chunk.metadata
  }];
};

export const findRelevantContent = async (userQuery: string) => {
  const userQueryEmbedded = await generateEmbeddings({
    pageContent: userQuery,
    metadata: { pageNumber: 1 }
  });
  
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded[0].embedding,
  )})`;
  
  // Join with documents table to get document context
  const similarContent = await db
    .select({ 
      content: embeddings.content,
      similarity,
      documentTitle: documents.title,
      documentType: documents.type,
      metadata: embeddings.metadata,
      // Add page number and section info if available
      pageNumber: sql<number>`(${embeddings.metadata}->>'pageNumber')::int`,
      section: sql<string>`${embeddings.metadata}->>'section'`,
    })
    .from(embeddings)
    .leftJoin(documents, eq(embeddings.resourceId, documents.id))
    .where(gt(similarity, 0.75)) // Increased similarity threshold
    .orderBy(desc(similarity))
    .limit(6); // Increased limit for more context

  // Debug log
  console.log('Found relevant content:', {
    query: userQuery,
    matches: similarContent.length,
    topSimilarity: similarContent[0]?.similarity,
  });

  return similarContent;
};

export const findRelevantRepresentatives = async (userQuery: string) => {
  const userQueryEmbedded = await generateEmbeddings({
    pageContent: userQuery,
    metadata: { pageNumber: 1 }
  });

  const similarity = sql<number>`1 - (${cosineDistance(
    representativeEmbeddings.embedding,
    userQueryEmbedded[0].embedding,
  )})`;

  // Join with representatives table to get full context
  const similarReps = await db
    .select({
      name: representatives.nameClean,
      constituency: representatives.constituency,
      constituencyCode: representatives.constituencyCode,
      constituencyName: representatives.constituencyName,
      district: representatives.district,
      province: representatives.province,
      party: representatives.party,
      phone: representatives.phone,
      permanentAddress: representatives.permanentAddress,
      islamabadAddress: representatives.islamabadAddress,
      content: representativeEmbeddings.content,
      similarity,
    })
    .from(representativeEmbeddings)
    .leftJoin(representatives, eq(representativeEmbeddings.representativeId, representatives.id))
    .where(gt(similarity, 0.70)) // Slightly lower threshold for representatives
    .orderBy(desc(similarity))
    .limit(5); // Limit to top 5 representatives

  console.log('Found relevant representatives:', {
    query: userQuery,
    matches: similarReps.length,
    topSimilarity: similarReps[0]?.similarity,
  });

  return similarReps;
};

/**
 * AI-powered query router - uses LLM to understand what to search
 * Returns array of content types to search based on query intent
 */
export const detectQueryTypes = async (query: string): Promise<('representative' | 'bill' | 'document')[]> => {
  const { text: analysis } = await generateText({
    model: openai('gpt-4o-mini'),
    system: `You are a query analyzer for Pakistan's National Assembly database. Your job is to determine what type(s) of information the user needs.

Available information sources:
1. "representative" - National Assembly members (MNAs), their constituencies, contact info, party affiliations
2. "bill" - Legislative bills, acts, proposed laws, passed legislation
3. "document" - Constitution, articles, amendments, parliamentary proceedings

Analyze the user's query and return ONLY a JSON array of the sources needed. Examples:

Query: "Who is my MNA in NA-125?"
Response: ["representative"]

Query: "What is Article 25?"
Response: ["document"]

Query: "Tell me about the Finance Bill"
Response: ["bill", "document"]

Query: "Did Imran Khan propose any bills?"
Response: ["representative", "bill"]

Query: "Which MNA voted for the amendment?"
Response: ["representative", "document"]

Return ONLY the JSON array, nothing else.`,
    prompt: query,
    temperature: 0,
    maxTokens: 50,
  });

  try {
    // Parse the LLM response
    const parsed = JSON.parse(analysis);

    // Validate and return
    if (Array.isArray(parsed) && parsed.length > 0) {
      const valid = parsed.filter((type: string) =>
        type === 'representative' || type === 'bill' || type === 'document'
      );

      if (valid.length > 0) {
        console.log('AI detected query types:', valid, 'for query:', query);
        return valid as ('representative' | 'bill' | 'document')[];
      }
    }
  } catch (error) {
    console.error('Failed to parse AI query analysis:', error, 'Response was:', analysis);
  }

  // Fallback to document if parsing fails
  console.log('Falling back to document search for query:', query);
  return ['document'];
};

export async function generateProceedingSummary(text: string): Promise<string> {
  const { text: summary } = await generateText({
    model: openai('gpt-4o'),
    system: 'You are an expert pakistani parliamentary analyst. Create a detailed, well-structured summary of the following parliamentary proceeding. Include key points discussed, decisions made, and significant debates. Format as well written markdown ensure line breaks and headings for better readability.',
    messages: [
      {
        role: 'user',
        content: text
      }
    ],
    temperature: 0.7,
    maxTokens: 1500
  })

  return summary
}