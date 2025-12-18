import { NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { db } from '@/lib/db';
import { documentUploads } from '@/lib/db/schema/document-uploads';
import { eq } from 'drizzle-orm';
import { uploadDocument } from '@/lib/actions/documents';
import { getSignedUrlForFile } from '@/lib/s3';

interface UploadMetadata {
  [key: string]: string;
}

async function handler(req: Request) {
  try {
    console.log('Processing webhook received');
    const { uploadId } = await req.json();
    console.log('Processing upload:', uploadId);
    
    // Update status to processing
    await db
      .update(documentUploads)
      .set({ 
        status: 'processing',
        processingProgress: 10,
        updatedAt: new Date()
      })
      .where(eq(documentUploads.id, uploadId));
    console.log('Updated status to processing');

    // Get upload details
    const [upload] = await db
      .select()
      .from(documentUploads)
      .where(eq(documentUploads.id, uploadId));

    if (!upload) {
      console.error('Upload not found:', uploadId);
      throw new Error('Upload not found');
    }
    console.log('Found upload:', upload.id);

    try {
      // Extract the file key from the S3 URL
      const fileKey = upload.fileUrl.split('/').pop();
      if (!fileKey) {
        console.error('Invalid file URL:', upload.fileUrl);
        throw new Error('Invalid file URL');
      }
      console.log('Extracted file key:', fileKey);

      // Get a signed URL for the file
      console.log('Generating signed URL...');
      const signedUrl = await getSignedUrlForFile(fileKey);
      console.log('Got signed URL');
      
      // Fetch the file using the signed URL
      console.log('Fetching file from S3...');
      const fileResponse = await fetch(signedUrl);
      if (!fileResponse.ok) {
        console.error('Failed to fetch file:', fileResponse.status, fileResponse.statusText);
        throw new Error(`Failed to fetch file from S3: ${fileResponse.statusText}`);
      }
      console.log('File fetched successfully');
      
      const fileBlob = await fileResponse.blob();
      const file = new File([fileBlob], upload.originalFileName, { type: 'application/pdf' });
      console.log('Created File object');
      
      // Create form data with the file
      const formData = new FormData();
      formData.append('file', file);
      const metadata = upload.metadata as UploadMetadata;
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, value);
      });
      console.log('Created FormData with metadata:', Object.keys(metadata));

      // Process the document using existing logic
      console.log('Starting document processing...');
      const result = await uploadDocument(formData);
      console.log('Document processing result:', result);

      if (!result.success) {
        throw new Error(result.message);
      }

      // Update upload status to completed
      await db
        .update(documentUploads)
        .set({ 
          status: 'completed',
          processingProgress: 100,
          documentId: result.document?.id,
          updatedAt: new Date()
        })
        .where(eq(documentUploads.id, uploadId));
      console.log('Updated status to completed');

    } catch (error) {
      console.error('Error during processing:', error);
      // Update upload status to failed
      await db
        .update(documentUploads)
        .set({ 
          status: 'failed',
          error: (error as Error).message,
          updatedAt: new Date()
        })
        .where(eq(documentUploads.id, uploadId));
      console.log('Updated status to failed');
      
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process upload:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}

export const POST = verifySignatureAppRouter(handler); 