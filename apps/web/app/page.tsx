'use client'
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { User, TrendingUp, MessageCircle, Send, ArrowRight } from 'lucide-react'

export default function IndexPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/chat?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold leading-tight text-primary md:text-5xl lg:text-6xl">
            Democracy Should Be Transparent
          </h1>
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            Track your representatives, understand laws, and engage with Pakistan&apos;s parliament—all in plain language
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mx-auto mb-8 max-w-2xl">
            <div className="relative">
              <Input
                type="text"
                placeholder="Ask anything... Who is my MNA? What does Article 25 say?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pr-14 text-base"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-accent p-2.5 text-white transition-colors hover:bg-coral-600"
              >
                <Send className="size-5" />
              </button>
            </div>
          </form>

          {/* CTAs */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/chat">Start Exploring</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/about">Watch Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="container px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <Card hover className="p-8">
            <User className="mb-4 size-8 text-primary" />
            <h3 className="mb-3 text-2xl font-bold text-primary">
              Find Your Representative
            </h3>
            <p className="mb-4 text-base leading-relaxed text-muted-foreground">
              Search by constituency to discover who represents you—complete with contact details, performance metrics, and voting records.
            </p>
            <Link href="/representatives" className="inline-flex items-center text-base font-medium text-accent hover:underline">
              Search Now <ArrowRight className="ml-1 size-4" />
            </Link>
          </Card>

          <Card hover className="p-8">
            <TrendingUp className="mb-4 size-8 text-primary" />
            <h3 className="mb-3 text-2xl font-bold text-primary">
              Track Their Work
            </h3>
            <p className="mb-4 text-base leading-relaxed text-muted-foreground">
              Hold elected officials accountable with attendance records, bill sponsorship, committee participation, and voting history.
            </p>
            <Link href="/representatives" className="inline-flex items-center text-base font-medium text-accent hover:underline">
              View Dashboard <ArrowRight className="ml-1 size-4" />
            </Link>
          </Card>

          <Card hover className="p-8">
            <MessageCircle className="mb-4 size-8 text-primary" />
            <h3 className="mb-3 text-2xl font-bold text-primary">
              Understand Any Law
            </h3>
            <p className="mb-4 text-base leading-relaxed text-muted-foreground">
              Chat with our AI to decode Pakistan&apos;s constitution, bills, and laws in simple Urdu or English with verified citations.
            </p>
            <Link href="/chat" className="inline-flex items-center text-base font-medium text-accent hover:underline">
              Start Chatting <ArrowRight className="ml-1 size-4" />
            </Link>
          </Card>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="bg-secondary-bg py-16">
        <div className="container px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 grid gap-8 md:grid-cols-3">
              <div>
                <div className="mb-2 text-4xl font-bold text-primary md:text-5xl">
                  1,164
                </div>
                <div className="text-base text-muted-foreground">
                  Elected Officials Tracked
                </div>
              </div>
              <div>
                <div className="mb-2 text-4xl font-bold text-primary md:text-5xl">
                  5,200+
                </div>
                <div className="text-base text-muted-foreground">
                  Bills & Laws Indexed
                </div>
              </div>
              <div>
                <div className="mb-2 text-4xl font-bold text-primary md:text-5xl">
                  1973–Present
                </div>
                <div className="text-base text-muted-foreground">
                  Historical Coverage
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Powered by{" "}
              <Link href="https://codeforpakistan.org" target="_blank" className="font-medium text-primary hover:underline">
                Code for Pakistan
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

