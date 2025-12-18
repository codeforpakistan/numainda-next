import { Button } from '@/components/ui/button'
import { getProceeding } from '@/lib/proceedings'
import { format } from 'date-fns'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft } from 'lucide-react'

export default async function ProceedingPage({
  params: { id }
}: {
  params: { id: string }
}) {
  const proceeding = await getProceeding(id)
  
  if (!proceeding) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/proceedings" className="mb-6 flex items-center gap-2">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold">{proceeding.title}</h1>
          <p>{format(new Date(proceeding.date), 'MMMM d, yyyy')}</p>
        </div>
        
        <div className="prose max-w-none">
          <h2 className="mb-4 text-xl font-semibold">Summary</h2>
          <ReactMarkdown>{proceeding.summary}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
} 