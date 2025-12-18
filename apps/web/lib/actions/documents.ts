'use server';

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { documents, insertDocumentSchema } from '@/lib/db/schema/documents';
import { db } from '../db';
import { generateEmbeddings, generateProceedingSummary } from '../ai/embedding';
import { embeddings as embeddingsTable } from '../db/schema/embeddings';
import { createProceeding } from "../proceedings";
import { nanoid } from 'nanoid';
import { bills, insertBillSchema } from '../db/schema/bills';

// Helper function to detect section headers
function detectSection(content: string): string | null {
  // Common section header patterns
  const sectionPatterns = [
    /^#{1,6}\s+(.+)$/m,  // Markdown headers
    /^([A-Z][A-Za-z\s]{2,}:)/m,  // Capitalized words followed by colon
    /^(\d+\.\d*\s+[A-Z][A-Za-z\s]{2,})/m,  // Numbered sections
    /^([A-Z][A-Za-z\s]{2,})$/m,  // All-caps or Title Case lines
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
  // Common date/time patterns
  const datePatterns = [
    // ISO dates: 2024-03-21
    /\b(\d{4}-\d{2}-\d{2})\b/,
    // Common date formats: 21/03/2024, 03/21/2024
    /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/,
    // Written dates: March 21, 2024
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/,
    // Times: 14:30:00, 2:30 PM
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

interface ChunkMetadata {
  pageNumber: number;
  section: string | null;
  timestamp: string | null;
}

async function extractTextFromPDF(file: File): Promise<string> {
  const blob = new Blob([await file.arrayBuffer()]);
  const loader = new PDFLoader(blob, {
    splitPages: true,
    parsedItemSeparator: '\n',
  });
  
  const docs = await loader.load();
  return docs.map(d => d.pageContent).join('\n');
}

async function createDocument({ title, type, content, originalFileName }: {
  title: string;
  type: string;
  content: string;
  originalFileName: string;
}) {
  // Store the full document
  const [document] = await db
    .insert(documents)
    .values({
      title,
      type,
      content,
      originalFileName,
    })
    .returning();

  // Split content into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 300,
    separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],
    keepSeparator: true,
  });

  const chunks = await splitter.createDocuments([content]);

  // Process chunks in batches to avoid rate limits
  const batchSize = 5;
  const embeddingsArray = [];
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(chunks.length / batchSize)}`);
    
    const batchEmbeddings = await Promise.all(
      batch.map(chunk => generateEmbeddings({
        pageContent: chunk.pageContent,
        metadata: {
          pageNumber: chunk.metadata.pageNumber || 1,
          section: detectSection(chunk.pageContent),
          timestamp: detectTimestamp(chunk.pageContent),
        } as ChunkMetadata
      }))
    );
    
    embeddingsArray.push(...batchEmbeddings);
    
    // Add a small delay between batches to avoid rate limits
    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Store embeddings with metadata
  await db.insert(embeddingsTable).values(
    embeddingsArray.flat().map(({ embedding, content, metadata }) => ({
      id: nanoid(),
      resourceId: document.id,
      embedding,
      content,
      metadata
    }))
  );

  return document;
}

export const uploadDocument = async (
  formData: FormData
): Promise<{ success: boolean; message: string; document?: any }> => {
  try {
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const bulletinDate = formData.get('date') as string;
    
    console.log('Starting document upload:', { title, type, fileName: file.name });
    
    // Extract text from PDF
    console.log('Extracting text from PDF...');
    const text = await extractTextFromPDF(file);
    console.log('Text extraction complete');

    // Create document first
    console.log('Creating document record...');
    const document = await createDocument({
      title,
      type,
      content: text,
      originalFileName: file.name,
    });
    console.log('Document record created:', document.id);

    // Handle different document types
    if (type === 'parliamentary_bulletin') {
      console.log('Processing parliamentary bulletin...');
      if (!bulletinDate) {
        throw new Error('Bulletin date is required');
      }
      
      try {
        console.log('Generating proceeding summary...');
        const summary = await generateProceedingSummary(text);
        console.log('Summary generated');
        
        console.log('Creating proceeding...');
        await createProceeding({
          title,
          date: bulletinDate,
          summary,
          originalText: text,
        });
        console.log('Proceeding created');
      } catch (error) {
        console.error('Error processing bulletin:', error);
        // Don't throw here, we still want to return the document
      }
    } else if (type === 'bill') {
      console.log('Processing bill...');
      const billNumber = formData.get('billNumber') as string;
      const sessionNumber = formData.get('sessionNumber') as string;
      const status = formData.get('status') as string;
      const passageDate = formData.get('passageDate') as string;
      
      try {
        console.log('Generating bill summary...');
        const summary = await generateBillSummary(text);
        console.log('Bill summary generated');
        
        console.log('Creating bill record...');
        await db.insert(bills).values({
          title,
          status,
          summary,
          originalText: text,
          billNumber,
          sessionNumber,
          passageDate: passageDate ? new Date(passageDate) : null,
        });
        console.log('Bill record created');
      } catch (error) {
        console.error('Error processing bill:', error);
        // Don't throw here, we still want to return the document
      }
    }

    return {
      success: true,
      message: 'Document uploaded successfully',
      document
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    return {
      success: false,
      message: 'Error uploading document: ' + (error as Error).message
    };
  }
};

async function generateBillSummary(text: string): Promise<string> {
  try {
    console.log('Calling OpenAI for bill summary...');
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
            content: `Please provide a concise summary of this bill: ${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      // Add timeout
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error: any) {
    console.error('Error generating bill summary:', error);
    if (error.name === 'AbortError') {
      return 'Summary generation timed out. The document was uploaded but summary generation failed.';
    }
    return 'Error generating summary. The document was uploaded but summary generation failed.';
  }
}