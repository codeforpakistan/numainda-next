import { getProceedings } from '@/lib/proceedings'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function ProceedingsPage() {
  const proceedings = await getProceedings()

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">Parliamentary Proceedings</h1>
      <div className="space-y-4">
        {proceedings.map((proceeding) => (
          <Link 
            key={proceeding.id} 
            href={`/proceedings/${proceeding.id}`}
            className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{proceeding.title}</h2>
              <span className="text-gray-500">{format(new Date(proceeding.date), 'MMMM d, yyyy')}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
} 