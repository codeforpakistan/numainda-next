import { db } from '@/lib/db'
import { chatThreads } from '@/lib/db/schema/chat-threads'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const pehchanId = searchParams.get('pehchan_id')

  if (!pehchanId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [thread] = await db
      .select()
      .from(chatThreads)
      .where(
        and(
          eq(chatThreads.id, parseInt(params.id)),
          eq(chatThreads.pehchanId, pehchanId)
        )
      )

    return NextResponse.json(thread)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { messages, title, pehchanId } = await request.json()

  if (!pehchanId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [thread] = await db
      .update(chatThreads)
      .set({
        messages,
        title,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(chatThreads.id, parseInt(params.id)),
          eq(chatThreads.pehchanId, pehchanId)
        )
      )
      .returning()

    return NextResponse.json(thread)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update thread' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { pehchanId } = await request.json()

  if (!pehchanId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [deletedThread] = await db
      .delete(chatThreads)
      .where(
        and(
          eq(chatThreads.id, parseInt(params.id)),
          eq(chatThreads.pehchanId, pehchanId)
        )
      )
      .returning()

    return NextResponse.json(deletedThread)
  } catch (error) {
    console.error('Error deleting thread:', error)
    return NextResponse.json(
      { error: 'Failed to delete thread' },
      { status: 500 }
    )
  }
} 