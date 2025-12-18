import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documentUploads } from '@/lib/db/schema/document-uploads';
import { eq } from 'drizzle-orm';
import { Client } from '@upstash/qstash';
import { uploadToS3 } from '@/lib/s3';

// Create QStash client
const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

// Get the base URL for webhooks
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'development' && process.env.NGROK_URL) {
    return process.env.NGROK_URL;
  }
  // Ensure the URL has a scheme
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://numainda.codeforpakistan.org';
  console.log('appUrl', appUrl);
  return appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;
};

export async function GET() {
  try {
    const uploads = await db.select().from(documentUploads).orderBy(documentUploads.createdAt);
    return NextResponse.json(uploads);
  } catch (error) {
    console.error('Failed to fetch uploads:', error);
    return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    
    if (!file || !title || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert file to buffer and upload to S3
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name}`;
    const fileUrl = await uploadToS3(buffer, fileName, file.type);

    // Create upload record
    const [upload] = await db.insert(documentUploads).values({
      originalFileName: file.name,
      fileSize: file.size,
      fileUrl,
      status: 'pending',
      metadata: {
        title,
        type,
        // Add any additional metadata from the form
        ...Object.fromEntries(formData.entries()),
      },
    }).returning();

    // Queue the processing job
    const webhookUrl = `${getBaseUrl()}/api/admin/uploads/process`;
    console.log('webhookUrl', webhookUrl);
    await qstash.publish({
      url: webhookUrl,
      body: JSON.stringify({ uploadId: upload.id }),
      retries: 3,
    });

    return NextResponse.json(upload);
  } catch (error) {
    console.error('Failed to create upload:', error);
    return NextResponse.json(
      { error: 'Failed to create upload' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, error, uploadProgress, processingProgress } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing upload ID' },
        { status: 400 }
      );
    }

    const [upload] = await db
      .update(documentUploads)
      .set({
        status,
        error,
        uploadProgress,
        processingProgress,
        updatedAt: new Date(),
      })
      .where(eq(documentUploads.id, id))
      .returning();

    return NextResponse.json(upload);
  } catch (error) {
    console.error('Failed to update upload:', error);
    return NextResponse.json(
      { error: 'Failed to update upload' },
      { status: 500 }
    );
  }
} 