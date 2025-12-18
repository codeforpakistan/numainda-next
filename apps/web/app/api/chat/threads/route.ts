import { db } from '@/lib/db'
import { chatThreads } from '@/lib/db/schema/chat-threads'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pehchanId = searchParams.get('pehchan_id')

  if (!pehchanId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const threads = await db
      .select()
      .from(chatThreads)
      .where(eq(chatThreads.pehchanId, pehchanId))
      .orderBy(chatThreads.updatedAt)

    return NextResponse.json(threads)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { pehchanId, title = 'New Chat', messages = [] } = await request.json()
  console.log('Creating thread:', { pehchanId, title, messages })

  if (!pehchanId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [thread] = await db
      .insert(chatThreads)
      .values({
        pehchanId,
        title,
        messages
      })
      .returning()

    console.log('Created thread:', thread)
    return NextResponse.json(thread)
  } catch (error) {
    console.error('Failed to create thread:', error)
    return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 })
  }
} 