'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const suggestions = [
  "What are my fundamental rights?",
  "How is the Prime Minister elected?",
  "What does the 18th Amendment say?",
  "Find my representative",
]

export function HomeChatInput() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    setLoading(true)

    if (
      trimmed.toLowerCase().includes('representative') ||
      trimmed.toLowerCase().includes('mna') ||
      trimmed.toLowerCase().match(/^na-?\d/i)
    ) {
      router.push(`/representatives?search=${encodeURIComponent(trimmed)}`)
    } else {
      router.push(`/chat?q=${encodeURIComponent(trimmed)}`)
    }
  }

  const handleSuggestion = (suggestion: string) => {
    if (suggestion === "Find my representative") {
      router.push('/representatives')
    } else {
      router.push(`/chat?q=${encodeURIComponent(suggestion)}`)
    }
  }

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything about Pakistan's constitution, laws, elections..."
          className="w-full resize-none rounded-xl border bg-background p-4 pr-14 text-base shadow-sm transition-shadow placeholder:text-muted-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50 md:p-5 md:pr-16 md:text-lg"
          rows={2}
          style={{ fontSize: '16px' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={loading || !query.trim()}
          className="absolute bottom-3 right-3 size-10 rounded-lg md:bottom-4 md:right-4 md:size-11"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4 md:size-5" />
          )}
          <span className="sr-only">Send</span>
        </Button>
      </form>

      {/* Suggestion chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => handleSuggestion(suggestion)}
            className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary md:px-4 md:py-2 md:text-sm"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
